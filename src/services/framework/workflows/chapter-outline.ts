import * as path from "path"
import * as fs from "fs/promises"
import { prepareReplaceDiff, prepareAppendDiff, displayFileContent } from "../utils/common"
import { findSectionPosition } from "../utils/position"
import { safeExecute } from "../utils/error-handler"

/**
 * 处理章节大纲工作流
 */
export async function handleChapterOutlineWorkflow(params: any): Promise<boolean> {
    const { cline, frameworkPath, frameworkContent, askApproval, handleError, pushToolResult, removeClosingTag } = params
    
    try {
        pushToolResult("正在分析章节大纲情况...")
        
        // 获取工作区根路径
        const rootPath = cline.cwd || process.cwd()
        
        // 构建完整文件路径
        const fullPath = path.isAbsolute(frameworkPath) ? frameworkPath : path.join(rootPath, frameworkPath)
        
        // 检查章节大纲部分是否存在
        const chapterSectionPosition = findSectionPosition(frameworkContent, ["## 章节规划", "## 章节大纲", "## 章节设计"])
        
        // 询问用户希望如何改进章节大纲
        const chapterQuestionBlock = {
            type: "tool_use" as const,
            name: "ask_followup_question" as const,
            params: {
                question: chapterSectionPosition.found ? 
                    "您希望如何改进章节大纲？\n\n" +
                    "1. 添加更详细的章节内容描述\n" +
                    "2. 重新规划章节结构\n" +
                    "3. 调整章节节奏和转折点\n" +
                    "4. 深入设计关键章节的情节\n" +
                    "5. 增加章节内的角色发展描述\n" +
                    "6. 完善章节间的连贯性和伏笔\n" : 
                    "您的框架中尚未包含章节大纲部分。您希望添加哪种类型的章节规划？\n\n" +
                    "1. 简单章节列表\n" +
                    "2. 详细章节大纲\n" +
                    "3. 三幕结构章节规划\n" +
                    "4. 情节节点驱动的章节规划\n" +
                    "5. 按人物成长规划章节\n" +
                    "6. 结合多种结构的综合章节规划\n"
            },
            partial: false,
        }
        
        let selectedOption = ""
        let continueInCurrentSection = true
        let success = false
        
        await safeExecute(async () => {
            await cline.toolManager.askFollowupQuestionTool(
                cline,
                chapterQuestionBlock,
            askApproval,
            handleError,
            async (result: unknown) => {
                if (result && typeof result === "string") {
                        selectedOption = result.trim()
                        
                        // 检查是否要继续当前部分或跳到下一部分
                        if (selectedOption.includes("5") || selectedOption.toLowerCase().includes("继续完善")) {
                            continueInCurrentSection = true
                            return true
                        } else if (selectedOption.includes("6") || selectedOption.toLowerCase().includes("跳到下一个")) {
                            continueInCurrentSection = false
                            return true
                        }
                        
                        let promptContent = ""
                        
                        // 根据用户选择设置提示内容
                        if (chapterSectionPosition.found) {
                            // 已有章节大纲，根据选择完善
                            if (selectedOption.includes("1") || selectedOption.toLowerCase().includes("详细")) {
                                promptContent = "请为现有章节添加更详细的内容描述，包括每章的关键情节、角色发展和情感变化。"
                            } else if (selectedOption.includes("2") || selectedOption.toLowerCase().includes("重新规划")) {
                                promptContent = "请重新规划章节结构，确保故事有清晰的开端、发展、高潮和结局。"
                            } else if (selectedOption.includes("3") || selectedOption.toLowerCase().includes("节奏")) {
                                promptContent = "请调整章节节奏和转折点，确保故事有适当的紧张和放松节奏，以及关键的转折点。"
                            } else if (selectedOption.includes("4") || selectedOption.toLowerCase().includes("关键章节")) {
                                promptContent = "请深入设计几个关键章节的具体情节，包括场景、对话和情感变化。"
                            } else {
                                promptContent = "请全面改进章节大纲，使其更加详细、有结构性，并与故事情节紧密关联。"
                            }
                        } else {
                            // 尚未有章节大纲，根据选择创建
                            if (selectedOption.includes("1") || selectedOption.toLowerCase().includes("简单")) {
                                promptContent = "请创建一个简单的章节列表，概述每章的主要内容。"
                            } else if (selectedOption.includes("2") || selectedOption.toLowerCase().includes("详细")) {
                                promptContent = "请创建一个详细的章节大纲，包括每章的主要情节、场景和角色发展。"
                            } else if (selectedOption.includes("3") || selectedOption.toLowerCase().includes("三幕")) {
                                promptContent = "请创建一个基于三幕结构的章节规划，明确设置引子、第一转折点、中点、第二转折点和结局。"
                            } else if (selectedOption.includes("4") || selectedOption.toLowerCase().includes("情节节点")) {
                                promptContent = "请创建一个围绕关键情节节点组织的章节规划，确保每个情节节点都有足够的章节支持。"
                            } else {
                                promptContent = "请创建一个全面的章节规划，包括章节数量、每章主要内容、故事结构和节奏控制。"
                            }
                        }
                        
                        // 准备系统提示
                        const systemPrompt = `你是一位专业的小说章节规划专家。${
                            chapterSectionPosition.found ? 
                            "请根据现有章节大纲进行改进和完善。" : 
                            "请创建一个新的章节大纲部分。"
                        }
                        
                        ${promptContent}
                        
                        请确保章节规划：
                        1. 支持故事的整体结构和节奏
                        2. 为每个主要角色提供足够的发展空间
                        3. 包含适当的情节转折和悬念设计
                        4. 章节数量适中，便于读者阅读
                        5. 章节之间有逻辑连贯性
                        
                        ${chapterSectionPosition.found ? "以下是现有的章节大纲内容：" : "请创建以下格式的章节大纲："}
                        
                        ## 章节规划
                        
                        *章节数量和大致内容*
                        
                        ### 开篇章节 (1-X章)
                        *开篇章节的内容描述*
                        
                        ### 发展章节 (X-Y章)
                        *发展章节的内容描述*
                        
                        ### 高潮章节 (Y-Z章)
                        *高潮章节的内容描述*
                        
                        ### 结局章节 (Z-最终章)
                        *结局章节的内容描述*
                        
                        请直接给出完整的Markdown格式章节规划内容，以"## 章节规划"开头。`;
                        
                        // 当前内容
                        let currentContent = ""
                        if (chapterSectionPosition.found) {
                            const contentLines = frameworkContent.split("\n")
                            currentContent = contentLines.slice(chapterSectionPosition.startLine, chapterSectionPosition.endLine + 1).join("\n")
                        }
                        
                        // 请求AI助手生成章节大纲
                        const response = await cline.ask("novel_outline", `${systemPrompt}\n\n${chapterSectionPosition.found ? currentContent : ""}`, false)
                        
                        if (!response.text) {
                            pushToolResult("未能生成有效的章节大纲内容。")
                            success = false
                            return
                        }
                        
                        // 提取章节大纲内容
                        let newContent = response.text
                        
                        // 确保以"## 章节规划"开头
                        if (!newContent.includes("## 章节规划") && !newContent.includes("## 章节大纲") && !newContent.includes("## 章节设计")) {
                            newContent = "## 章节规划\n\n" + newContent
                        }
                        
                        // 更新框架文件
                        let updatedContent = ""
                        if (chapterSectionPosition.found) {
                            // 替换现有部分
                            updatedContent = prepareReplaceDiff(
                                frameworkContent, 
                                chapterSectionPosition.startLine, 
                                chapterSectionPosition.endLine,
                                newContent
                            )
                        } else {
                            // 添加新部分
                            updatedContent = prepareAppendDiff(frameworkContent, "\n\n" + newContent)
                        }
                        
                        // 写入文件
                        await fs.writeFile(fullPath, updatedContent, "utf8")
                        success = true
                        
                        pushToolResult(`已${chapterSectionPosition.found ? "更新" : "添加"}章节大纲内容。`)
                        
                        // 询问是否继续完善章节大纲
                        const continueQuestionBlock = {
            type: "tool_use" as const,
            name: "ask_followup_question" as const,
            params: {
                                question: "您希望如何继续？\n\n" +
                                    "1. 继续深入完善章节大纲\n" +
                                    "2. 添加更多章节细节\n" +
                                    "3. 调整章节结构\n" +
                                    "4. 规划关键情节点\n" +
                                    "5. 跳到下一个部分\n" +
                                    "6. 结束框架完善，切换到文字生成模式开始写作\n"
            },
            partial: false,
        }
        
                        await cline.toolManager.askFollowupQuestionTool(
                            cline,
                            continueQuestionBlock,
            askApproval,
            handleError,
            async (result: unknown) => {
                if (result && typeof result === "string") {
                                    const continueChoice = result.trim()
                                    
                                    if (continueChoice.includes("1") || continueChoice.toLowerCase().includes("继续")) {
                                        continueInCurrentSection = true
                                    } else if (continueChoice.includes("2") || continueChoice.toLowerCase().includes("添加更多")) {
                                        continueInCurrentSection = true
                                    } else if (continueChoice.includes("3") || continueChoice.toLowerCase().includes("调整章节结构")) {
                                        continueInCurrentSection = true
                                    } else if (continueChoice.includes("4") || continueChoice.toLowerCase().includes("规划关键情节点")) {
                                        continueInCurrentSection = true
                                    } else if (continueChoice.includes("5") || continueChoice.toLowerCase().includes("跳到下一个")) {
                                        continueInCurrentSection = false
                                    } else {
                                        // 用户选择结束框架完善
                                        pushToolResult("您选择了结束框架完善。框架已保存。")
                                        continueInCurrentSection = false
                                        
                                        // 询问是否切换到writer模式
                                        const switchQuestionBlock = {
            type: "tool_use" as const,
            name: "ask_followup_question" as const,
            params: {
                                                question: "是否要切换到文字生成模式开始写作？\n\n" +
                                                    "1. 是，开始写作\n" +
                                                    "2. 否，稍后再写"
            },
            partial: false,
        }
        
                                        await cline.toolManager.askFollowupQuestionTool(
                                            cline,
                                            switchQuestionBlock,
            askApproval,
            handleError,
            async (result: unknown) => {
                if (result && typeof result === "string") {
                                                    const switchChoice = result.trim()
                                                    
                                                    if (switchChoice.includes("1") || switchChoice.toLowerCase().includes("是")) {
                                                        // 使用switch_mode工具切换到writer模式
                                                        const switchModeBlock = {
                                                            type: "tool_use" as const,
                                                            name: "switch_mode" as const,
                                                            params: {
                                                                mode_slug: "writer",
                                                                reason: "开始基于框架进行小说创作",
                                                            },
                                                            partial: false,
                                                        }
                                                        
                                                        pushToolResult("正在切换到文字生成模式...")
                                                        
                                                        try {
                                                            await cline.recursivelyMakeClineRequests([{
                                                                type: "tool_use",
                                                                name: "switch_mode",
                                                                tool: {
                                                                    name: "switch_mode",
                                                                    input: {
                                                                        mode_slug: "writer",
                                                                        reason: "开始基于框架进行小说创作"
                                                                    }
                                                                }
                                                            }])
                                                            
                                                            pushToolResult("已切换到文字生成模式。您现在可以开始根据框架创作小说内容了。")
                                                        } catch (error) {
                                                            pushToolResult("模式切换失败，请手动切换到文字生成模式。错误: " + error)
                                                        }
                                                    }
                                                }
                                                return true // 确保所有嵌套回调函数都有返回值
                                            },
                                            removeClosingTag
                                        )
                                    }
                                }
                                return true // 确保所有嵌套回调函数都有返回值
            },
            removeClosingTag
        )
                    }
                    return true // 确保所有代码路径都返回值
                },
                removeClosingTag
            )
        }, handleError)
        
        return success || continueInCurrentSection
    } catch (error) {
        handleError(error)
        pushToolResult(`处理章节大纲时出错: ${error.message || "未知错误"}`)
        return false
    }
} 