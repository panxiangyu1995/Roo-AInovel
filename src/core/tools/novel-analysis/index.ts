import * as vscode from "vscode"
import * as path from "path"
import * as fsPromises from "fs/promises"

import { Task } from "../../task/Task"
import {
  ToolUse,
  AskApproval,
  HandleError,
  PushToolResult,
  RemoveClosingTag,
  NovelAnalysisToolUse,
} from "../../../shared/tools"
import { formatResponse } from "../../prompts/responses"
import { RecordSource } from "../../context-tracking/FileContextTrackerTypes"
import { fileExistsAtPath } from "../../../utils/fs"
import { getReadablePath } from "../../../utils/path"
import { isPathOutsideWorkspace } from "../../../utils/pathUtils"
import { novelContentSearchTool } from "../novelContentSearchTool"

import { AnalysisSection, AnalysisContext } from "./types"
import { extractNovelTitle } from "./extractors"
import { analyzeSections } from "./analyzer"
import { formatSectionContent, formatFullReport, formatErrorMessage } from "./formatters"

/**
 * 小说分析工具 - 分析小说的类型、世界观、角色关系、情节结构、写作风格、主题等13个方面
 */
export async function novelAnalysisTool(
  cline: Task,
  block: NovelAnalysisToolUse,
  askApproval: AskApproval,
  handleError: HandleError,
  pushToolResult: PushToolResult,
  removeClosingTag: RemoveClosingTag,
) {
  try {
    // 检查当前模式是否为分析模式
    const { mode } = (await cline.providerRef.deref()?.getState()) || {}
    if (mode !== "analysis") {
      const errorMessage = "小说分析工具只能在分析模式下使用。请使用 switch_mode 工具切换到分析模式。"
      await cline.say("error", errorMessage)
      pushToolResult(errorMessage)
      return
    }

    // 检查是否提供了路径参数
    let relPath = block.params.path

    // 尝试从文本参数中获取@引用
    if (!relPath && block.params.text) {
      // 搜索文本中的@引用
      const atFileRegex = /@([^\s]+)/g
      const matches = block.params.text.match(atFileRegex)
      if (matches && matches.length > 0) {
        // 提取第一个@引用的文件路径（去除@前缀）
        relPath = matches[0].substring(1)
        // 处理转义的空格
        relPath = relPath.replace(/\\\s/g, " ")
      }
    }

    // 如果没有提供路径参数，提示用户提供
    if (!relPath) {
      await cline.say(
        "text",
        "请提供要分析的小说文件名。例如：novel_analysis path=我的小说.md 或者使用@引用：@我的小说.md",
      )
      pushToolResult("未提供文件路径，请在对话中提供文件名。")
      return
    }

    // 解析分析类型
    const analysisType = (removeClosingTag("type", block.params.type) || "full") as AnalysisSection
    const title = removeClosingTag("title", block.params.title) || "未命名小说"

    // 创建默认输出路径
    const fileNameWithoutExt = path.basename(relPath).replace(/\.[^/.]+$/, "")
    const outputPath = block.params.output_path || `${fileNameWithoutExt}_分析报告.md`

    // 告知用户使用的源文件和输出路径
    await cline.say("text", `将分析文件: ${relPath}，分析结果将保存到: ${outputPath}`)

    // 处理部分工具使用
    if (block.partial) {
      const partialMessageProps = {
        tool: "novel_analysis" as const,
        path: getReadablePath(cline.cwd, relPath),
        type: analysisType,
        title: title,
      }
      await cline.ask("tool", JSON.stringify(partialMessageProps), block.partial).catch(() => {})
      return
    }

    // 验证文件是否存在
    const absolutePath = path.resolve(cline.cwd, relPath)
    const fileExists = await fileExistsAtPath(absolutePath)

    if (!fileExists) {
      cline.consecutiveMistakeCount++
      cline.recordToolError("novel_analysis")
      const formattedError = formatResponse.toolError(
        `文件不存在：${absolutePath}\n找不到指定文件。请检查文件路径并重试。`,
      )
      await cline.say("error", formattedError)
      pushToolResult(formattedError)
      return
    }

    // 验证访问权限
    const accessAllowed = cline.rooIgnoreController?.validateAccess(relPath)
    if (!accessAllowed) {
      await cline.say("rooignore_error", relPath)
      pushToolResult(formatResponse.rooIgnoreError(relPath))
      return
    }

    // 重置连续错误计数
    cline.consecutiveMistakeCount = 0

    // 读取源文件内容
    let sourceContent = ""
    try {
      // 获取文件状态以检查文件大小
      const stats = await fsPromises.stat(absolutePath)
      const fileSize = stats.size

      // 如果文件大小超过15KB，使用novelContentSearchTool进行处理
      if (fileSize > 15 * 1024) {
        await cline.say(
          "text",
          `文件较大（${(fileSize / 1024 / 1024).toFixed(2)} MB），将使用优化的处理技术进行分析。`,
        )

        // 创建一个novelContentSearch工具的参数对象
        const novelSearchBlock = {
          name: "novel_content_search" as const,
          params: {
            query: `分析小说《${title || path.basename(relPath, path.extname(relPath))}》的内容`,
            path: relPath,
            type: analysisType === AnalysisSection.FULL ? "general" : analysisType,
          },
          partial: false,
          type: "tool_use" as const,
        }

        // 调用novelContentSearchTool进行处理
        await novelContentSearchTool(
          cline,
          novelSearchBlock,
          askApproval,
          handleError,
          pushToolResult,
          removeClosingTag,
        )
        return
      }

      // 如果文件较小，直接读取全部内容
      sourceContent = await fsPromises.readFile(absolutePath, "utf-8")
    } catch (error) {
      const errorMessage = `无法读取源文件：${relPath}，错误：${error instanceof Error ? error.message : String(error)}`
      await cline.say("error", errorMessage)
      pushToolResult(errorMessage)
      return
    }

    if (!sourceContent) {
      const errorMessage = `源文件为空：${relPath}`
      await cline.say("error", errorMessage)
      pushToolResult(errorMessage)
      return
    }

    // 提取小说标题
    const novelTitle = title || extractNovelTitle(sourceContent)

    // 确定要分析的部分
    let sectionsToAnalyze: AnalysisSection[] = []
    if (analysisType === AnalysisSection.FULL) {
      sectionsToAnalyze = [AnalysisSection.FULL]
    } else {
      sectionsToAnalyze = [analysisType]
    }

    // 创建分析上下文
    const context: AnalysisContext = {
      cline,
      askApproval,
      handleError,
      pushToolResult,
      removeClosingTag,
      title: novelTitle,
      content: sourceContent,
      outputPath,
      sections: sectionsToAnalyze,
    }

    // 执行分析
    const results = await analyzeSections(context)

    // 检查分析结果
    if (results.length === 0) {
      const errorMessage = `分析失败，没有返回结果。`
      await cline.say("error", errorMessage)
      pushToolResult(errorMessage)
      return
    }

    // 格式化分析结果
    let analysisContent = ""
    if (analysisType === AnalysisSection.FULL) {
      // 对于完整分析，使用第一个结果
      const fullResult = results[0]
      if (fullResult.success) {
        analysisContent = formatSectionContent(AnalysisSection.FULL, novelTitle, fullResult.content)
      } else {
        analysisContent = formatErrorMessage(novelTitle, fullResult.error || "未知错误")
      }
    } else {
      // 对于单个部分分析，使用该部分的结果
      const sectionResult = results[0]
      if (sectionResult.success) {
        analysisContent = formatSectionContent(sectionResult.section, novelTitle, sectionResult.content)
      } else {
        analysisContent = formatErrorMessage(novelTitle, sectionResult.error || "未知错误")
      }
    }

    // 写入分析结果到输出文件
    const absoluteOutputPath = path.resolve(cline.cwd, outputPath)
    const outputDir = path.dirname(absoluteOutputPath)

    try {
      // 确保输出目录存在
      await fsPromises.mkdir(outputDir, { recursive: true })

      // 写入分析结果
      await fsPromises.writeFile(absoluteOutputPath, analysisContent, "utf-8")

      // 跟踪文件编辑操作
      await cline.fileContextTracker.trackFileContext(outputPath, "roo_edited" as RecordSource)

      // 返回成功消息
      const successMessage = `小说分析完成！分析结果已保存到：${getReadablePath(cline.cwd, outputPath)}`
      await cline.say("text", successMessage)
      pushToolResult(successMessage)
    } catch (error) {
      const errorMessage = `写入分析结果失败：${error instanceof Error ? error.message : String(error)}`
      await cline.say("error", errorMessage)
      pushToolResult(errorMessage)
    }
  } catch (error) {
    await handleError("小说分析", error instanceof Error ? error : new Error(String(error)))
  }
} 