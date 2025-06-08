import * as path from "path"
import * as fs from "fs/promises"
import { ReflectionConfig, WorkflowParams } from "../types"
import { determineReflectionSectionPosition } from "../utils/diff-utils"
import { generateReflectionSection } from "../utils/generators"
import { prepareAppendDiff, prepareReplaceDiff } from "../utils/common"
import { findSectionPosition } from "../utils/position"
import { safeExecute } from "../utils/error-handler"

/**
 * 处理自我反思工作流
 */
export async function handleReflectionWorkflow(params: any): Promise<boolean> {
    const { cline, frameworkPath, frameworkContent, askApproval, handleError, pushToolResult, removeClosingTag } = params
    
    try {
        pushToolResult("正在分析自我反思情况...")
        
        // 获取工作区根路径
        const rootPath = cline.cwd || process.cwd()
        
        // 构建完整文件路径
        const fullPath = path.isAbsolute(frameworkPath) ? frameworkPath : path.join(rootPath, frameworkPath)
        
        // 检查自我反思部分是否存在
        const reflectionSectionPosition = findSectionPosition(frameworkContent, ["## 自我反思", "## 创作反思", "## 写作挑战"])
        
        // 询问用户希望如何改进自我反思
        const reflectionQuestionBlock = {
            type: "tool_use" as const,
            name: "ask_followup_question" as const,
            params: {
                question: reflectionSectionPosition.found ? 
                    "您希望如何改进自我反思？\n\n" +
                    "1. 深化创作意图分析\n" +
                    "2. 完善作品独特价值\n" +
                    "3. 探讨创作挑战与应对\n" +
                    "4. 增加读者反馈预期\n" +
                    "5. 分析个人风格特点\n" +
                    "6. 制定创作提升计划\n" : 
                    "您的框架中尚未包含自我反思部分。您希望添加哪种类型的自我反思？\n\n" +
                    "1. 创作意图与目标\n" +
                    "2. 作品价值与意义\n" +
                    "3. 创作挑战与对策\n" +
                    "4. 个人风格与特色\n" +
                    "5. 读者体验设计\n" +
                    "6. 成长目标与计划\n"
            },
            partial: false,
        }
        
        let selectedOption = ""
        let continueInCurrentSection = true
        let success = false
        
        await safeExecute(async () => {
            await cline.toolManager.askFollowupQuestionTool(
                cline,
                reflectionQuestionBlock,
            askApproval,
            handleError,
            async (result: unknown) => {
                if (result && typeof result === "string") {
                        selectedOption = result.trim()
                        
                        let promptContent = ""
                        
                        // 根据用户选择设置提示内容
                        if (reflectionSectionPosition.found) {
                            // 已有自我反思，根据选择完善
                            if (selectedOption.includes("1") || selectedOption.toLowerCase().includes("意图")) {
                                promptContent = "请深化创作意图分析，明确作品要表达的核心思想和创作初衷。"
                            } else if (selectedOption.includes("2") || selectedOption.toLowerCase().includes("价值")) {
                                promptContent = "请完善作品独特价值，分析作品在文学性、思想性和娱乐性方面的贡献。"
                            } else if (selectedOption.includes("3") || selectedOption.toLowerCase().includes("挑战")) {
                                promptContent = "请探讨创作过程中可能面临的挑战，以及相应的应对策略。"
                            } else if (selectedOption.includes("4") || selectedOption.toLowerCase().includes("读者")) {
                                promptContent = "请增加对读者反馈的预期，分析可能的读者反应和评价。"
                            } else if (selectedOption.includes("5") || selectedOption.toLowerCase().includes("风格")) {
                                promptContent = "请分析个人写作风格特点，包括语言、结构和叙事方面的特色。"
                            } else if (selectedOption.includes("6") || selectedOption.toLowerCase().includes("计划")) {
                                promptContent = "请制定创作提升计划，规划如何在写作过程中不断提高和突破。"
                            } else {
                                promptContent = "请全面改进自我反思，使其更有深度和实用性。"
                            }
                        } else {
                            // 尚未有自我反思，根据选择创建
                            if (selectedOption.includes("1") || selectedOption.toLowerCase().includes("目标")) {
                                promptContent = "请创建关于创作意图与目标的自我反思，明确你希望通过这部作品达成什么。"
                            } else if (selectedOption.includes("2") || selectedOption.toLowerCase().includes("意义")) {
                                promptContent = "请创建关于作品价值与意义的自我反思，分析作品可能的社会和文学价值。"
                            } else if (selectedOption.includes("3") || selectedOption.toLowerCase().includes("对策")) {
                                promptContent = "请创建关于创作挑战与对策的自我反思，预见写作中的困难并制定应对计划。"
                            } else if (selectedOption.includes("4") || selectedOption.toLowerCase().includes("特色")) {
                                promptContent = "请创建关于个人风格与特色的自我反思，分析你的写作风格和叙事特点。"
                            } else if (selectedOption.includes("5") || selectedOption.toLowerCase().includes("体验")) {
                                promptContent = "请创建关于读者体验设计的自我反思，思考如何提供最佳的阅读体验。"
                            } else if (selectedOption.includes("6") || selectedOption.toLowerCase().includes("目标")) {
                                promptContent = "请创建关于成长目标与计划的自我反思，规划如何通过这部作品提升写作能力。"
                            } else {
                                promptContent = "请创建完整的自我反思，包括创作意图、作品价值和个人发展。"
                            }
                        }
                        
                        // 准备系统提示
                        const systemPrompt = `你是一位专业的小说创作顾问。${
                            reflectionSectionPosition.found ? 
                            "请根据现有自我反思进行改进和完善。" : 
                            "请创建一个新的自我反思部分。"
                        }
                        
                        ${promptContent}
                        
                        请确保自我反思：
                        1. 创作意图和目标明确
                        2. 对作品价值有深入分析
                        3. 对创作挑战有清醒认识
                        4. 对个人风格有准确把握
                        5. 有具体的成长和提升计划
                        
                        ${reflectionSectionPosition.found ? "以下是现有的自我反思内容：" : "请创建以下格式的自我反思："}
                        
                        ## 自我反思
                        
                        ### 创作意图
                        *创作意图的描述*
                        
                        ### 作品价值
                        *作品价值的描述*
                        
                        ### 创作挑战
                        *创作挑战的描述*
                        
                        ### 个人风格
                        *个人风格的描述*
                        
                        ### 成长计划
                        *成长计划的描述*
                        
                        请直接给出完整的Markdown格式自我反思内容，以"## 自我反思"开头。`;
                        
                        // 当前内容
                        let currentContent = ""
                        if (reflectionSectionPosition.found) {
                            const contentLines = frameworkContent.split("\n")
                            currentContent = contentLines.slice(reflectionSectionPosition.startLine, reflectionSectionPosition.endLine + 1).join("\n")
                        }
                        
                        // 请求AI助手生成自我反思
                        const response = await cline.ask("reflection_design", `${systemPrompt}\n\n${reflectionSectionPosition.found ? currentContent : ""}`, false)
                        
                        if (!response.text) {
                            pushToolResult("未能生成有效的自我反思内容。")
                            success = false
                            return
                        }
                        
                        // 提取自我反思内容
                        let newContent = response.text
                        
                        // 确保以"## 自我反思"开头
                        if (!newContent.includes("## 自我反思") && !newContent.includes("## 创作反思") && !newContent.includes("## 写作挑战")) {
                            newContent = "## 自我反思\n\n" + newContent
                        }
                        
                        // 更新框架文件
                        let updatedContent = ""
                        if (reflectionSectionPosition.found) {
                            // 替换现有部分
                            updatedContent = prepareReplaceDiff(
                                frameworkContent, 
                                reflectionSectionPosition.startLine, 
                                reflectionSectionPosition.endLine,
                                newContent
                            )
                        } else {
                            // 添加新部分
                            updatedContent = prepareAppendDiff(frameworkContent, "\n\n" + newContent)
                        }
                        
                        // 写入文件
                        await fs.writeFile(fullPath, updatedContent, "utf8")
                        success = true
                        
                        pushToolResult(`已${reflectionSectionPosition.found ? "更新" : "添加"}自我反思内容。`)
                        
                        // 询问是否继续完善自我反思
                        const continueQuestionBlock = {
            type: "tool_use" as const,
            name: "ask_followup_question" as const,
            params: {
                                question: "您希望如何继续？\n\n" +
                                    "1. 继续深入完善自我反思\n" +
                                    "2. 添加更多反思细节\n" +
                                    "3. 调整反思与创作的关联\n" +
                                    "4. 增强反思的独特性\n" +
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
                                    } else if (continueChoice.includes("3") || continueChoice.toLowerCase().includes("调整")) {
                                        continueInCurrentSection = true
                                    } else if (continueChoice.includes("4") || continueChoice.toLowerCase().includes("增强")) {
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
                    return true // 确保所有嵌套回调函数都有返回值
                },
                removeClosingTag
            )
        }, handleError)
        
        return success || continueInCurrentSection
    } catch (error) {
        handleError(error)
        pushToolResult(`处理自我反思时出错: ${error.message || "未知错误"}`)
        return false
    }
} 