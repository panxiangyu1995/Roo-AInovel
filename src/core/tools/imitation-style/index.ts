import * as fs from "fs/promises";
import * as path from "path";
import { Task } from "../../task/Task";
import { ImitationToolUse, AskApproval, HandleError, PushToolResult, RemoveClosingTag } from "../../../shared/tools";
import { RecordSource } from "../../context-tracking/FileContextTrackerTypes";
import { StyleAnalysisContext, StyleAnalysisResult } from "./types";
import { DefaultStyleAnalyzer, StyleFileManager } from "./analyzer";
import { formatStyleAnalysis, generateSampleText } from "./formatters";
import { QuestionnaireManager } from "./sections";

/**
 * 风格模仿工具 - 分析用户写作风格并生成风格文件
 */
export async function imitationTool(
  cline: Task,
  block: ImitationToolUse,
  askApproval: AskApproval,
  handleError: HandleError,
  pushToolResult: PushToolResult,
  removeClosingTag: RemoveClosingTag,
) {
  try {
    // 获取参数
    let relPath = block.params.path as string | undefined;
    let text = block.params.text as string | undefined;
    const outputPath = (block.params.output_path as string) || "writing_style.json";
    const mode = block.params.mode as "analyze" | "update" | "questionnaire" || "analyze";
    const styleFilePath = block.params.style_file as string | undefined;

    // 处理部分工具使用
    if (block.partial) {
      const partialMessageProps = {
        tool: "imitation" as const,
        path: relPath,
        text: text,
        output_path: outputPath,
        mode: mode,
        style_file: styleFilePath
      };
      await cline.ask("tool", JSON.stringify(partialMessageProps), block.partial).catch(() => {});
      return;
    }

    // 重置连续错误计数
    cline.consecutiveMistakeCount = 0;

    // 根据模式执行不同操作
    switch (mode) {
      case "analyze":
        await analyzeWritingStyle(cline, relPath, text, outputPath, askApproval, pushToolResult);
        break;
      case "update":
        if (!styleFilePath) {
          const errorMessage = "更新模式需要提供style_file参数，指定要更新的风格文件路径。";
          await cline.say("error", errorMessage);
          pushToolResult(errorMessage);
          return;
        }
        await updateStyleFile(cline, styleFilePath, relPath, text, askApproval, pushToolResult);
        break;
      case "questionnaire":
        await runQuestionnaire(cline, outputPath, askApproval, pushToolResult);
        break;
      default:
        await analyzeWritingStyle(cline, relPath, text, outputPath, askApproval, pushToolResult);
    }

    // 提示用户后续操作选择
    await cline.ask("followup", "您对分析结果有什么反馈？或者您希望在特定文本上应用这种风格吗？").catch(() => {});
  } catch (error) {
    await handleError("写作风格分析", error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * 分析写作风格
 */
async function analyzeWritingStyle(
  cline: Task,
  relPath: string | undefined,
  text: string | undefined,
  outputPath: string,
  askApproval: AskApproval,
  pushToolResult: PushToolResult
): Promise<void> {
  // 如果没有提供文本或路径参数，提示用户提供
  if (!relPath && !text) {
    await cline.say(
      "text",
      "请提供要分析的文本。可以通过path参数指定文件，或直接通过text参数提供文本内容。",
    );
    pushToolResult("未提供参考文本，请在对话中提供文件路径或文本内容。");
    return;
  }

  // 获取参考文本内容
  let content = "";

  if (relPath) {
    try {
      // 获取当前工作目录
      const cwd = cline.cwd;
      // 解析文件路径
      const fullPath = path.isAbsolute(relPath) ? relPath : path.join(cwd, relPath);

      // 检查文件是否存在
      try {
        await fs.access(fullPath);
      } catch (error) {
        cline.consecutiveMistakeCount++;
        cline.recordToolError("imitation");
        const errorMessage = `文件不存在：${fullPath}\n找不到指定文件。请检查文件路径并重试。`;
        await cline.say("error", errorMessage);
        pushToolResult(errorMessage);
        return;
      }

      // 读取源文件内容
      try {
        // 获取文件状态以检查文件大小
        const stats = await fs.stat(fullPath);
        const fileSize = stats.size;

        // 如果文件大小超过15MB，提示文件过大
        if (fileSize > 15 * 1024 * 1024) {
          const errorMessage = `文件过大（${(fileSize / 1024 / 1024).toFixed(2)} MB），请提供较小的样本文件或使用text参数直接提供文本内容。`;
          await cline.say("error", errorMessage);
          pushToolResult(errorMessage);
          return;
        }

        // 读取文件内容
        content = await fs.readFile(fullPath, "utf8");
      } catch (error) {
        const errorMessage = `无法读取源文件：${relPath}，错误：${error instanceof Error ? error.message : String(error)}`;
        await cline.say("error", errorMessage);
        pushToolResult(errorMessage);
        return;
      }
    } catch (error) {
      const errorMessage = `无法读取源文件：${relPath}，错误：${error instanceof Error ? error.message : String(error)}`;
      await cline.say("error", errorMessage);
      pushToolResult(errorMessage);
      return;
    }
  } else if (text) {
    // 直接使用提供的文本
    content = text;
  }

  // 告知用户分析进度
  await cline.say("text", "正在分析您的写作风格...");

  // 创建分析上下文
  const context: StyleAnalysisContext = {
    cline,
    askApproval,
    handleError: (message: string, error: Error) => Promise.resolve(),
    pushToolResult,
    content,
    outputPath
  };

  // 创建分析器并分析
  const analyzer = new DefaultStyleAnalyzer();
  const result = await analyzer.analyze(context);

  if (!result.success) {
    const errorMessage = `分析失败：${result.error || "未知错误"}`;
    await cline.say("error", errorMessage);
    pushToolResult(errorMessage);
    return;
  }

  // 生成风格分析报告
  const analysisReport = formatStyleAnalysis(result);

  // 创建风格文件
  try {
    // 获取当前工作目录
    const cwd = cline.cwd;
    // 解析输出路径
    const fullOutputPath = path.isAbsolute(outputPath) ? outputPath : path.join(cwd, outputPath);
    
    // 创建风格文件
    await StyleFileManager.createStyleFile(result, fullOutputPath);

    // 生成Markdown报告文件
    const reportPath = fullOutputPath.replace(/\.json$/, ".md");
    await fs.writeFile(reportPath, analysisReport, "utf8");

    // 跟踪文件编辑操作
    await cline.fileContextTracker.trackFileContext(fullOutputPath, "roo_edited" as RecordSource);
    await cline.fileContextTracker.trackFileContext(reportPath, "roo_edited" as RecordSource);

    // 返回成功消息
    const successMessage = `写作风格分析完成！\n- 风格文件已保存到：${fullOutputPath}\n- 分析报告已保存到：${reportPath}`;
    await cline.say("text", successMessage);
    
    // 显示分析报告摘要
    await cline.say("text", "## 写作风格分析摘要\n\n" + 
      `- **语言特点**: ${result.language.sentencePatterns}, ${result.language.vocabulary}\n` +
      `- **叙事特点**: ${result.narrative.perspective}, ${result.narrative.tone}\n` +
      `- **独特元素**: ${result.unique.signatures.slice(0, 3).join(", ")}\n` +
      `- **关键词**: ${result.keywords.slice(0, 5).join(", ")}`
    );
    
    pushToolResult(successMessage);
  } catch (error) {
    const errorMessage = `写入风格分析结果失败：${error instanceof Error ? error.message : String(error)}`;
    await cline.say("error", errorMessage);
    pushToolResult(errorMessage);
  }
}

/**
 * 更新风格文件
 */
async function updateStyleFile(
  cline: Task,
  styleFilePath: string,
  relPath: string | undefined,
  text: string | undefined,
  askApproval: AskApproval,
  pushToolResult: PushToolResult
): Promise<void> {
  // 如果没有提供文本或路径参数，提示用户提供
  if (!relPath && !text) {
    await cline.say(
      "text",
      "请提供要分析的新文本。可以通过path参数指定文件，或直接通过text参数提供文本内容。",
    );
    pushToolResult("未提供参考文本，请在对话中提供文件路径或文本内容。");
    return;
  }

  // 获取参考文本内容
  let content = "";

  if (relPath) {
    try {
      // 获取当前工作目录
      const cwd = cline.cwd;
      // 解析文件路径
      const fullPath = path.isAbsolute(relPath) ? relPath : path.join(cwd, relPath);

      // 检查文件是否存在
      try {
        await fs.access(fullPath);
      } catch (error) {
        cline.consecutiveMistakeCount++;
        cline.recordToolError("imitation");
        const errorMessage = `文件不存在：${fullPath}\n找不到指定文件。请检查文件路径并重试。`;
        await cline.say("error", errorMessage);
        pushToolResult(errorMessage);
        return;
      }

      // 读取源文件内容
      content = await fs.readFile(fullPath, "utf8");
    } catch (error) {
      const errorMessage = `无法读取源文件：${relPath}，错误：${error instanceof Error ? error.message : String(error)}`;
      await cline.say("error", errorMessage);
      pushToolResult(errorMessage);
      return;
    }
  } else if (text) {
    // 直接使用提供的文本
    content = text;
  }

  // 检查风格文件是否存在
  const cwd = cline.cwd;
  const fullStylePath = path.isAbsolute(styleFilePath) ? styleFilePath : path.join(cwd, styleFilePath);
  
  try {
    await fs.access(fullStylePath);
  } catch (error) {
    const errorMessage = `风格文件不存在：${fullStylePath}\n找不到指定的风格文件。请检查路径并重试。`;
    await cline.say("error", errorMessage);
    pushToolResult(errorMessage);
    return;
  }

  // 告知用户分析进度
  await cline.say("text", "正在分析新文本并更新风格文件...");

  // 创建分析上下文
  const context: StyleAnalysisContext = {
    cline,
    askApproval,
    handleError: (message: string, error: Error) => Promise.resolve(),
    pushToolResult,
    content,
    outputPath: fullStylePath,
    styleFilePath: fullStylePath
  };

  // 创建分析器并分析
  const analyzer = new DefaultStyleAnalyzer();
  const result = await analyzer.analyze(context);

  if (!result.success) {
    const errorMessage = `分析失败：${result.error || "未知错误"}`;
    await cline.say("error", errorMessage);
    pushToolResult(errorMessage);
    return;
  }

  try {
    // 更新风格文件
    const updatedContent = await StyleFileManager.updateStyleFile(fullStylePath, result);
    
    // 生成Markdown报告文件
    const reportPath = fullStylePath.replace(/\.json$/, ".md");
    const analysisReport = formatStyleAnalysis(result);
    await fs.writeFile(reportPath, analysisReport, "utf8");

    // 跟踪文件编辑操作
    await cline.fileContextTracker.trackFileContext(fullStylePath, "roo_edited" as RecordSource);
    await cline.fileContextTracker.trackFileContext(reportPath, "roo_edited" as RecordSource);

    // 返回成功消息
    const successMessage = `风格文件更新完成！\n- 已更新风格文件：${fullStylePath}\n- 分析报告已保存到：${reportPath}\n- 当前样本数量：${updatedContent.sampleCount}`;
    await cline.say("text", successMessage);
    
    // 显示分析报告摘要
    await cline.say("text", "## 更新后的风格分析摘要\n\n" + 
      `- **语言特点**: ${updatedContent.language.sentencePatterns}, ${updatedContent.language.vocabulary}\n` +
      `- **叙事特点**: ${updatedContent.narrative.perspective}, ${updatedContent.narrative.tone}\n` +
      `- **独特元素**: ${updatedContent.unique.signatures.slice(0, 3).join(", ")}\n` +
      `- **关键词**: ${updatedContent.keywords.slice(0, 5).join(", ")}`
    );
    
    pushToolResult(successMessage);
  } catch (error) {
    const errorMessage = `更新风格文件失败：${error instanceof Error ? error.message : String(error)}`;
    await cline.say("error", errorMessage);
    pushToolResult(errorMessage);
  }
}

/**
 * 通过问卷收集风格信息
 */
async function runQuestionnaire(
  cline: Task,
  outputPath: string,
  askApproval: AskApproval,
  pushToolResult: PushToolResult
): Promise<void> {
  await cline.say("text", "将通过问卷方式收集您的写作风格信息。");
  
  // 创建问卷管理器
  const questionnaireManager = new QuestionnaireManager(cline);
  
  // 开始问卷调查
  const questionnaire = await questionnaireManager.startQuestionnaire();
  
  // 获取风格描述
  const styleDescription = questionnaireManager.getStyleDescription();
  
  try {
    // 获取当前工作目录
    const cwd = cline.cwd;
    // 解析输出路径
    const fullOutputPath = path.isAbsolute(outputPath) ? outputPath : path.join(cwd, outputPath);
    const reportPath = fullOutputPath.replace(/\.json$/, ".md");
    
    // 写入风格描述文件
    await fs.mkdir(path.dirname(fullOutputPath), { recursive: true });
    await fs.writeFile(reportPath, styleDescription, "utf8");
    
    // 跟踪文件编辑操作
    await cline.fileContextTracker.trackFileContext(reportPath, "roo_edited" as RecordSource);
    
    // 返回成功消息
    const successMessage = `问卷调查完成！风格描述已保存到：${reportPath}`;
    await cline.say("text", successMessage);
    await cline.say("text", styleDescription);
    
    pushToolResult(successMessage);
  } catch (error) {
    const errorMessage = `写入风格描述失败：${error instanceof Error ? error.message : String(error)}`;
    await cline.say("error", errorMessage);
    pushToolResult(errorMessage);
  }
} 