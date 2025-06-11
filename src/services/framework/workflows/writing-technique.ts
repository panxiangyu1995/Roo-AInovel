import * as path from "path"
import * as fs from "fs/promises"
import {prepareReplaceDiff, prepareAppendDiff, displayFileContent, updateFrameworkFile} from "../utils/common"
import { findSectionPosition } from "../utils/position"
import { safeExecute } from "../utils/error-handler"

/**
 * 处理写作手法工作流
 */
export async function handleWritingTechniqueWorkflow(params: any): Promise<boolean> {
    const { cline, frameworkPath, frameworkContent, askApproval, handleError, pushToolResult, removeClosingTag } = params
    
    try {
        pushToolResult("正在分析写作手法情况...")
        
        // 获取工作区根路径
        const rootPath = cline.cwd || process.cwd()
        
        // 构建完整文件路径
        const fullPath = path.isAbsolute(frameworkPath) ? frameworkPath : path.join(rootPath, frameworkPath)
        
        // 检查写作手法部分是否存在
        const techniqueSectionPosition = findSectionPosition(frameworkContent, ["## 写作手法", "## 叙事技巧", "## 表达技法"])
        
        // 询问用户希望如何改进写作手法
        const techniqueQuestionBlock = {
            type: "tool_use" as const,
            name: "ask_followup_question" as const,
            params: {
                question: techniqueSectionPosition.found ? 
                    "您希望如何改进写作手法？\n\n" +
                    "1. 优化描写技巧\n" +
                    "2. 完善对话设计\n" +
                    "3. 增强情景营造\n" +
                    "4. 设计伏笔与呼应\n" +
                    "5. 丰富修辞手法\n" +
                    "6. 调整节奏控制\n" : 
                    "您的框架中尚未包含写作手法部分。您希望添加哪种类型的写作手法？\n\n" +
                    "1. 标准描写技巧（人物、场景、心理）\n" +
                    "2. 意识流写法\n" +
                    "3. 白描写法\n" +
                    "4. 象征性写法\n" +
                    "5. 电影蒙太奇手法\n" +
                    "6. 多视角交叉写法\n"
            },
            partial: false,
        }
        
        let selectedOption = ""
        let continueInCurrentSection = true
        let success = false
        
        await safeExecute(async () => {
            await cline.toolManager.askFollowupQuestionTool(
                cline,
                techniqueQuestionBlock,
                askApproval,
                handleError,
                async (result: unknown) => {
                    if (result && typeof result === "string") {
                        selectedOption = result.trim()
                        
                        let promptContent = ""
                        
                        // 根据用户选择设置提示内容
                        if (techniqueSectionPosition.found) {
                            // 已有写作手法，根据选择完善
                            if (selectedOption.includes("1") || selectedOption.toLowerCase().includes("描写")) {
                                promptContent = "请优化小说的描写技巧，包括人物、场景、情感等方面的生动描写方法。"
                            } else if (selectedOption.includes("2") || selectedOption.toLowerCase().includes("对话")) {
                                promptContent = "请完善小说的对话设计，包括对话特色、内在逻辑和推动情节的技巧。"
                            } else if (selectedOption.includes("3") || selectedOption.toLowerCase().includes("情景")) {
                                promptContent = "请增强小说的情景营造能力，设计如何通过多感官描写创造沉浸式体验。"
                            } else if (selectedOption.includes("4") || selectedOption.toLowerCase().includes("伏笔")) {
                                promptContent = "请设计小说中的伏笔与呼应技巧，包括如何布置和回收伏笔以增强故事的整体性。"
                            } else if (selectedOption.includes("5") || selectedOption.toLowerCase().includes("修辞")) {
                                promptContent = "请丰富小说的修辞手法，如比喻、拟人、排比、对比等多种修辞的灵活运用。"
                            } else if (selectedOption.includes("6") || selectedOption.toLowerCase().includes("节奏")) {
                                promptContent = "请调整小说的节奏控制技巧，包括快慢节奏的切换、铺垫和高潮的处理方式。"
                            } else {
                                promptContent = "请全面改进写作手法，使文本表达更加生动、有感染力和艺术性。"
                            }
                        } else {
                            // 尚未有写作手法，根据选择创建
                            if (selectedOption.includes("1") || selectedOption.toLowerCase().includes("标准")) {
                                promptContent = "请创建标准描写技巧指南，包括人物、场景和心理描写的基本方法和要点。"
                            } else if (selectedOption.includes("2") || selectedOption.toLowerCase().includes("意识流")) {
                                promptContent = "请创建意识流写法指南，包括内心独白、自由联想和时空交错的表现技巧。"
                            } else if (selectedOption.includes("3") || selectedOption.toLowerCase().includes("白描")) {
                                promptContent = "请创建白描写法指南，包括简洁而有力的表达方式和点到为止的艺术。"
                            } else if (selectedOption.includes("4") || selectedOption.toLowerCase().includes("象征")) {
                                promptContent = "请创建象征性写法指南，探讨如何通过象征和隐喻深化作品主题。"
                            } else if (selectedOption.includes("5") || selectedOption.toLowerCase().includes("蒙太奇")) {
                                promptContent = "请创建电影蒙太奇手法的文字应用指南，包括画面感和剪辑感的文字表现。"
                            } else if (selectedOption.includes("6") || selectedOption.toLowerCase().includes("多视角")) {
                                promptContent = "请创建多视角交叉写法指南，包括不同视角的切换技巧和整合方式。"
                            } else {
                                promptContent = "请创建完整的写作手法指南，包括描写技巧、对话设计和节奏控制等方面。"
                            }
                        }
                        
                        // 准备系统提示
                        const systemPrompt = `你是一位专业的小说写作技巧专家。${
                            techniqueSectionPosition.found ? 
                            "请根据现有写作手法进行改进和完善。" : 
                            "请创建一个新的写作手法部分。"
                        }
                        
                        ${promptContent}
                        
                        请确保写作手法设计：
                        1. 具有实用性和可操作性
                        2. 与作品风格和类型相符
                        3. 能够提升作品的表现力和感染力
                        4. 包含具体的技巧示例和应用方法
                        5. 保持风格的一致性和连贯性
                        
                        ${techniqueSectionPosition.found ? "以下是现有的写作手法内容：" : "请创建以下格式的写作手法："}
                        
                        ## 写作手法
                        
                        ### 描写技巧
                        *人物、场景、情感等描写技巧*
                        
                        ### 对话设计
                        *对话风格和功能*
                        
                        ### 节奏控制
                        *情节节奏和文字节奏*
                        
                        ### 特色手法
                        *特殊的表现手法和技巧*
                        
                        请直接给出完整的Markdown格式写作手法内容，以"## 写作手法"或类似标题开头。`;
                        
                        // 当前内容
                        let currentContent = ""
                        if (techniqueSectionPosition.found) {
                            const contentLines = frameworkContent.split("\n")
                            currentContent = contentLines.slice(techniqueSectionPosition.startLine, techniqueSectionPosition.endLine + 1).join("\n")
                        }
                        
                        // 请求AI助手生成写作手法
                        const response = await cline.ask("technique_design", `${systemPrompt}\n\n${techniqueSectionPosition.found ? currentContent : ""}`, false)
                        
                        if (!response.text) {
                            pushToolResult("未能生成有效的写作手法内容。")
                            success = false
                            return
                        }
                        
                        // 提取写作手法内容
                        let newContent = response.text
                        
                        // 确保以"## 写作手法"开头
                        if (!newContent.includes("## 写作手法") && !newContent.includes("## 叙事技巧") && !newContent.includes("## 表达技法")) {
                            newContent = "## 写作手法\n\n" + newContent
                        }
                        
                        // 更新框架文件
                        let updatedContent = ""
                        if (techniqueSectionPosition.found) {
                            // 替换现有部分
                            updatedContent = prepareReplaceDiff(
                                frameworkContent, 
                                techniqueSectionPosition.startLine, 
                                techniqueSectionPosition.endLine,
                                newContent
                            )
                        } else {
                            // 添加新部分
                            updatedContent = prepareAppendDiff(frameworkContent, "\n\n" + newContent)
                        }
                        
                        // 写入文件
                        await updateFrameworkFile(fullPath, updatedContent)
                        success = true
                        
                        pushToolResult(`已${techniqueSectionPosition.found ? "更新" : "添加"}写作手法内容。`)
                        
                        // 询问是否继续完善写作手法
                        const continueQuestionBlock = {
                            type: "tool_use" as const,
                            name: "ask_followup_question" as const,
                            params: {
                                question: "您希望如何继续？\n\n" +
                                    "1. 继续深入完善写作手法\n" +
                                    "2. 添加更多技巧细节\n" +
                                    "3. 调整写作风格\n" +
                                    "4. 增强表现力和感染力\n" +
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
        pushToolResult(`处理写作手法时出错: ${error.message || "未知错误"}`)
        return false
    }
} 