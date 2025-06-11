import * as path from "path"
import * as fs from "fs/promises"
import {prepareReplaceDiff, prepareAppendDiff, displayFileContent, updateFrameworkFile} from "../utils/common"
import { findSectionPosition } from "../utils/position"
import { safeExecute } from "../utils/error-handler"

/**
 * 处理主题元素工作流
 */
export async function handleThemeWorkflow(params: any): Promise<boolean> {
    const { cline, frameworkPath, frameworkContent, askApproval, handleError, pushToolResult, removeClosingTag } = params
    
    try {
        pushToolResult("正在分析主题元素情况...")
        
        // 获取工作区根路径
        const rootPath = cline.cwd || process.cwd()
        
        // 构建完整文件路径
        const fullPath = path.isAbsolute(frameworkPath) ? frameworkPath : path.join(rootPath, frameworkPath)
        
        // 检查主题元素部分是否存在
        const themeSectionPosition = findSectionPosition(frameworkContent, ["## 主题元素", "## 主题", "## 题材"])
        
        // 询问用户希望如何改进主题元素
        const themeQuestionBlock = {
            type: "tool_use" as const,
            name: "ask_followup_question" as const,
            params: {
                question: themeSectionPosition.found ? 
                    "您希望如何改进主题元素？\n\n" +
                    "1. 明确核心主题思想\n" +
                    "2. 完善类型与题材\n" +
                    "3. 设计主题象征与隐喻\n" +
                    "4. 构建主题冲突\n" +
                    "5. 增加社会文化视角\n" +
                    "6. 设计主题表达方式\n" : 
                    "您的框架中尚未包含主题元素部分。您希望添加哪种类型的主题设计？\n\n" +
                    "1. 标准主题设计（类型、核心主题）\n" +
                    "2. 哲学思想探讨型主题\n" +
                    "3. 社会问题反思型主题\n" +
                    "4. 个人成长型主题\n" +
                    "5. 矛盾冲突型主题\n" +
                    "6. 多层次综合主题\n"
            },
            partial: false,
        }
        
        let selectedOption = ""
        let continueInCurrentSection = true
        let success = false
        
        await safeExecute(async () => {
            await cline.toolManager.askFollowupQuestionTool(
                cline,
                themeQuestionBlock,
            askApproval,
            handleError,
            async (result: unknown) => {
                if (result && typeof result === "string") {
                        selectedOption = result.trim()
                        
                        let promptContent = ""
                        
                        // 根据用户选择设置提示内容
                        if (themeSectionPosition.found) {
                            // 已有主题元素，根据选择完善
                            if (selectedOption.includes("1") || selectedOption.toLowerCase().includes("核心主题")) {
                                promptContent = "请明确小说的核心主题思想，包括作品要表达的中心思想、价值观和哲学观点。"
                            } else if (selectedOption.includes("2") || selectedOption.toLowerCase().includes("类型")) {
                                promptContent = "请完善小说的类型与题材定位，确定作品属于哪些文学类型，以及对应类型的常见元素和读者期望。"
                            } else if (selectedOption.includes("3") || selectedOption.toLowerCase().includes("象征")) {
                                promptContent = "请设计表达主题的象征与隐喻元素，包括可能的意象、符号和反复出现的元素。"
                            } else if (selectedOption.includes("4") || selectedOption.toLowerCase().includes("冲突")) {
                                promptContent = "请构建能够体现主题的核心冲突，设计能够推动主题发展的价值观碰撞和道德困境。"
                            } else if (selectedOption.includes("5") || selectedOption.toLowerCase().includes("社会文化")) {
                                promptContent = "请增加主题的社会文化视角，探讨作品可能涉及的历史背景、文化脉络和社会议题。"
                            } else if (selectedOption.includes("6") || selectedOption.toLowerCase().includes("表达方式")) {
                                promptContent = "请设计主题的表达方式，包括如何通过情节、对话、场景和角色成长来传递主题。"
                            } else {
                                promptContent = "请全面改进主题元素，使主题更加深刻、有说服力和共鸣感。"
                            }
                        } else {
                            // 尚未有主题元素，根据选择创建
                            if (selectedOption.includes("1") || selectedOption.toLowerCase().includes("标准")) {
                                promptContent = "请创建标准主题设计，包括小说类型和核心主题思想。"
                            } else if (selectedOption.includes("2") || selectedOption.toLowerCase().includes("哲学")) {
                                promptContent = "请创建探讨哲学思想的主题设计，深入探讨存在、真理、价值等哲学问题。"
                            } else if (selectedOption.includes("3") || selectedOption.toLowerCase().includes("社会问题")) {
                                promptContent = "请创建反思社会问题的主题设计，关注当代社会议题和现实矛盾。"
                            } else if (selectedOption.includes("4") || selectedOption.toLowerCase().includes("个人成长")) {
                                promptContent = "请创建关注个人成长的主题设计，探讨自我发现、成熟和蜕变的过程。"
                            } else if (selectedOption.includes("5") || selectedOption.toLowerCase().includes("矛盾冲突")) {
                                promptContent = "请创建以矛盾冲突为中心的主题设计，聚焦对立价值观和道德困境的碰撞。"
                            } else if (selectedOption.includes("6") || selectedOption.toLowerCase().includes("多层次")) {
                                promptContent = "请创建多层次综合的主题设计，包含个人、社会和哲学等多个层面的主题探讨。"
                            } else {
                                promptContent = "请创建完整的主题元素设计，包括类型定位、核心主题和表达方式。"
                            }
                        }
                        
                        // 准备系统提示
                        const systemPrompt = `你是一位专业的小说主题设计专家。${
                            themeSectionPosition.found ? 
                            "请根据现有主题元素进行改进和完善。" : 
                            "请创建一个新的主题元素部分。"
                        }
                        
                        ${promptContent}
                        
                        请确保主题设计：
                        1. 主题有深度且引人思考
                        2. 主题与故事类型和目标读者相符
                        3. 主题能通过情节和角色自然表达
                        4. 主题含有普遍性和共鸣点
                        5. 主题有明确的价值取向
                        
                        ${themeSectionPosition.found ? "以下是现有的主题元素内容：" : "请创建以下格式的主题元素："}
                        
                        ## 主题元素
                        
                        ### 类型与题材
                        *小说的类型和题材描述*
                        
                        ### 核心主题
                        *核心主题思想*
                        
                        ### 主题表达
                        *主题的表达方式*
                        
                        ### 主题象征
                        *主题相关的象征与隐喻*
                        
                        请直接给出完整的Markdown格式主题元素内容，以"## 主题元素"或类似标题开头。`;
                        
                        // 当前内容
                        let currentContent = ""
                        if (themeSectionPosition.found) {
                            const contentLines = frameworkContent.split("\n")
                            currentContent = contentLines.slice(themeSectionPosition.startLine, themeSectionPosition.endLine + 1).join("\n")
                        }
                        
                        // 请求AI助手生成主题元素
                        const response = await cline.ask("theme_design", `${systemPrompt}\n\n${themeSectionPosition.found ? currentContent : ""}`, false)
                        
                        if (!response.text) {
                            pushToolResult("未能生成有效的主题元素内容。")
                            success = false
                            return
                        }
                        
                        // 提取主题元素内容
                        let newContent = response.text
                        
                        // 确保以"## 主题元素"开头
                        if (!newContent.includes("## 主题元素") && !newContent.includes("## 主题") && !newContent.includes("## 题材")) {
                            newContent = "## 主题元素\n\n" + newContent
                        }
                        
                        // 更新框架文件
                        let updatedContent = ""
                        if (themeSectionPosition.found) {
                            // 替换现有部分
                            updatedContent = prepareReplaceDiff(
                                frameworkContent, 
                                themeSectionPosition.startLine, 
                                themeSectionPosition.endLine,
                                newContent
                            )
                        } else {
                            // 添加新部分
                            updatedContent = prepareAppendDiff(frameworkContent, "\n\n" + newContent)
                        }
                        
                        // 写入文件
                        await updateFrameworkFile(fullPath, updatedContent)
                        success = true
                        
                        pushToolResult(`已${themeSectionPosition.found ? "更新" : "添加"}主题元素内容。`)
                        
                        // 询问是否继续完善主题元素
                        const continueQuestionBlock = {
            type: "tool_use" as const,
            name: "ask_followup_question" as const,
            params: {
                                question: "您希望如何继续？\n\n" +
                                    "1. 继续深入完善主题元素\n" +
                                    "2. 添加更多主题细节\n" +
                                    "3. 调整主题表达方式\n" +
                                    "4. 增强主题与情节关联\n" +
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
                                    } else if (continueChoice.includes("3") || continueChoice.toLowerCase().includes("调整主题")) {
                                        continueInCurrentSection = true
                                    } else if (continueChoice.includes("4") || continueChoice.toLowerCase().includes("增强主题")) {
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
                                            },
                                            removeClosingTag
                                        )
                                    }
                }
            },
            removeClosingTag
        )
                    }
                },
                removeClosingTag
            )
        }, handleError)
        
        return success || continueInCurrentSection
    } catch (error) {
        handleError(error)
        pushToolResult(`处理主题元素时出错: ${error.message || "未知错误"}`)
        return false
    }
} 