import * as path from "path"
import * as fs from "fs/promises"
import { prepareAppendDiff, prepareReplaceDiff } from "../utils/common"
import { findSectionPosition } from "../utils/position"
import { safeExecute } from "../utils/error-handler"

/**
 * 处理情感设计工作流
 */
export async function handleEmotionWorkflow(params: any): Promise<boolean> {
    const { cline, frameworkPath, frameworkContent, askApproval, handleError, pushToolResult, removeClosingTag } = params
    
    try {
        pushToolResult("正在分析情感设计情况...")
        
        // 获取工作区根路径
        const rootPath = cline.cwd || process.cwd()
        
        // 构建完整文件路径
        const fullPath = path.isAbsolute(frameworkPath) ? frameworkPath : path.join(rootPath, frameworkPath)
        
        // 检查情感设计部分是否存在
        const emotionSectionPosition = findSectionPosition(frameworkContent, ["## 情感设计", "## 情感元素", "## 情感架构"])
        
        // 询问用户希望如何改进情感设计
        const emotionQuestionBlock = {
            type: "tool_use" as const,
            name: "ask_followup_question" as const,
            params: {
                question: emotionSectionPosition.found ? 
                    "您希望如何改进情感设计？\n\n" +
                    "1. 优化情感基调\n" +
                    "2. 完善情感冲突\n" +
                    "3. 设计情感变化曲线\n" +
                    "4. 增强关键场景的情感表达\n" +
                    "5. 优化人物情感塑造\n" +
                    "6. 调整情感与主题的关联\n" : 
                    "您的框架中尚未包含情感设计部分。您希望添加哪种类型的情感设计？\n\n" +
                    "1. 基础情感基调设计\n" +
                    "2. 多维情感冲突设计\n" +
                    "3. 情感渐变式设计\n" +
                    "4. 对比强化型情感设计\n" +
                    "5. 角色驱动型情感设计\n" +
                    "6. 主题融合型情感设计\n"
            },
            partial: false,
        }
        
        let selectedOption = ""
        let continueInCurrentSection = true
        let success = false
        
        await safeExecute(async () => {
            await cline.toolManager.askFollowupQuestionTool(
                cline,
                emotionQuestionBlock,
            askApproval,
            handleError,
            async (result: unknown) => {
                if (result && typeof result === "string") {
                        selectedOption = result.trim()
                        
                        let promptContent = ""
                        
                        // 根据用户选择设置提示内容
                        if (emotionSectionPosition.found) {
                            // 已有情感设计，根据选择完善
                            if (selectedOption.includes("1") || selectedOption.toLowerCase().includes("基调")) {
                                promptContent = "请优化小说的情感基调，设计主要的情感色彩和基础氛围。"
                            } else if (selectedOption.includes("2") || selectedOption.toLowerCase().includes("冲突")) {
                                promptContent = "请完善小说中的情感冲突，包括角色内心冲突和人际情感冲突。"
                            } else if (selectedOption.includes("3") || selectedOption.toLowerCase().includes("变化")) {
                                promptContent = "请设计情感变化曲线，规划情感起伏节奏和高潮点。"
                            } else if (selectedOption.includes("4") || selectedOption.toLowerCase().includes("场景")) {
                                promptContent = "请增强关键场景的情感表达，突出情感爆发点和转折点。"
                            } else if (selectedOption.includes("5") || selectedOption.toLowerCase().includes("人物")) {
                                promptContent = "请优化人物情感塑造，深化角色的情感世界和表达方式。"
                            } else if (selectedOption.includes("6") || selectedOption.toLowerCase().includes("主题")) {
                                promptContent = "请调整情感与主题的关联，确保情感设计服务于主题表达。"
                            } else {
                                promptContent = "请全面改进情感设计，使情感表达更加丰富、真实和有深度。"
                            }
                        } else {
                            // 尚未有情感设计，根据选择创建
                            if (selectedOption.includes("1") || selectedOption.toLowerCase().includes("基础")) {
                                promptContent = "请创建基础情感基调设计，确定作品的主要情感色彩和氛围。"
                            } else if (selectedOption.includes("2") || selectedOption.toLowerCase().includes("多维")) {
                                promptContent = "请创建多维情感冲突设计，设计多层次的情感对立和冲突。"
                            } else if (selectedOption.includes("3") || selectedOption.toLowerCase().includes("渐变")) {
                                promptContent = "请创建情感渐变式设计，规划情感的逐步变化和发展过程。"
                            } else if (selectedOption.includes("4") || selectedOption.toLowerCase().includes("对比")) {
                                promptContent = "请创建对比强化型情感设计，通过情感对比突出主要情感。"
                            } else if (selectedOption.includes("5") || selectedOption.toLowerCase().includes("角色")) {
                                promptContent = "请创建角色驱动型情感设计，以角色情感发展为核心设计情感架构。"
                            } else if (selectedOption.includes("6") || selectedOption.toLowerCase().includes("主题")) {
                                promptContent = "请创建主题融合型情感设计，将情感设计与作品主题紧密结合。"
                            } else {
                                promptContent = "请创建完整的情感设计，包括情感基调、情感冲突和情感发展。"
                            }
                        }
                        
                        // 准备系统提示
                        const systemPrompt = `你是一位专业的小说情感设计专家。${
                            emotionSectionPosition.found ? 
                            "请根据现有情感设计进行改进和完善。" : 
                            "请创建一个新的情感设计部分。"
                        }
                        
                        ${promptContent}
                        
                        请确保情感设计：
                        1. 情感基调与故事类型和主题相符
                        2. 情感冲突丰富且具有层次感
                        3. 情感发展有起伏变化和高潮
                        4. 情感表达自然且能引起读者共鸣
                        5. 角色情感塑造丰满而真实
                        
                        ${emotionSectionPosition.found ? "以下是现有的情感设计内容：" : "请创建以下格式的情感设计："}
                        
                        ## 情感设计
                        
                        ### 情感基调
                        *情感基调的描述*
                        
                        ### 情感冲突
                        *情感冲突的描述*
                        
                        ### 情感发展
                        *情感发展曲线的描述*
                        
                        ### 关键情感点
                        *关键情感点的描述*
                        
                        请直接给出完整的Markdown格式情感设计内容，以"## 情感设计"开头。`;
                        
                        // 当前内容
                        let currentContent = ""
                        if (emotionSectionPosition.found) {
                            const contentLines = frameworkContent.split("\n")
                            currentContent = contentLines.slice(emotionSectionPosition.startLine, emotionSectionPosition.endLine + 1).join("\n")
                        }
                        
                        // 请求AI助手生成情感设计
                        const response = await cline.ask("emotion_design", `${systemPrompt}\n\n${emotionSectionPosition.found ? currentContent : ""}`, false)
                        
                        if (!response.text) {
                            pushToolResult("未能生成有效的情感设计内容。")
                            success = false
                            return
                        }
                        
                        // 提取情感设计内容
                        let newContent = response.text
                        
                        // 确保以"## 情感设计"开头
                        if (!newContent.includes("## 情感设计") && !newContent.includes("## 情感元素") && !newContent.includes("## 情感架构")) {
                            newContent = "## 情感设计\n\n" + newContent
                        }
                        
                        // 更新框架文件
                        let updatedContent = ""
                        if (emotionSectionPosition.found) {
                            // 替换现有部分
                            updatedContent = prepareReplaceDiff(
                                frameworkContent, 
                                emotionSectionPosition.startLine, 
                                emotionSectionPosition.endLine,
                                newContent
                            )
                        } else {
                            // 添加新部分
                            updatedContent = prepareAppendDiff(frameworkContent, "\n\n" + newContent)
                        }
                        
                        // 写入文件
                        await fs.writeFile(fullPath, updatedContent, "utf8")
                        success = true
                        
                        pushToolResult(`已${emotionSectionPosition.found ? "更新" : "添加"}情感设计内容。`)
                        
                        // 询问是否继续完善情感设计
                        const continueQuestionBlock = {
            type: "tool_use" as const,
            name: "ask_followup_question" as const,
            params: {
                                question: "您希望如何继续？\n\n" +
                                    "1. 继续深入完善情感设计\n" +
                                    "2. 添加更多情感细节\n" +
                                    "3. 调整情感与情节的融合\n" +
                                    "4. 增强情感表达的独特性\n" +
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
        pushToolResult(`处理情感设计时出错: ${error.message || "未知错误"}`)
        return false
    }
} 