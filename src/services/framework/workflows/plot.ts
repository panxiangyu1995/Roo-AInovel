import * as path from "path"
import * as fs from "fs/promises"
import { prepareReplaceDiff, prepareAppendDiff, displayFileContent } from "../utils/common"
import { findSectionPosition } from "../utils/position"
import { safeExecute } from "../utils/error-handler"

/**
 * 处理故事大纲工作流
 */
export async function handlePlotWorkflow(params: any): Promise<boolean> {
    const { cline, frameworkPath, frameworkContent, askApproval, handleError, pushToolResult, removeClosingTag } = params
    
    try {
        pushToolResult("正在分析故事大纲情况...")
        
        // 获取工作区根路径
        const rootPath = cline.cwd || process.cwd()
        
        // 构建完整文件路径
        const fullPath = path.isAbsolute(frameworkPath) ? frameworkPath : path.join(rootPath, frameworkPath)
        
        // 检查故事大纲部分是否存在
        const plotSectionPosition = findSectionPosition(frameworkContent, ["## 故事大纲", "## 剧情大纲", "## 情节设计"])
        
        // 询问用户希望如何改进故事大纲
        const plotQuestionBlock = {
            type: "tool_use" as const,
            name: "ask_followup_question" as const,
            params: {
                question: plotSectionPosition.found ? 
                    "您希望如何改进故事大纲？\n\n" +
                    "1. 优化故事架构\n" +
                    "2. 完善时间线设计\n" +
                    "3. 强化关键转折点\n" +
                    "4. 丰富子情节\n" +
                    "5. 优化冲突设计\n" +
                    "6. 调整叙事节奏\n" : 
                    "您的框架中尚未包含故事大纲部分。您希望添加哪种类型的故事结构？\n\n" +
                    "1. 三幕剧结构\n" +
                    "2. 英雄旅程结构\n" +
                    "3. 非线性叙事结构\n" +
                    "4. 多线并行结构\n" +
                    "5. 起承转合结构\n" +
                    "6. 环形叙事结构\n"
            },
            partial: false,
        }
        
        let selectedOption = ""
        let continueInCurrentSection = true
        let success = false
        
        await safeExecute(async () => {
            await cline.toolManager.askFollowupQuestionTool(
                cline,
                plotQuestionBlock,
                askApproval,
                handleError,
                async (result: unknown) => {
                    if (result && typeof result === "string") {
                        selectedOption = result.trim()
                        
                        let promptContent = ""
                        
                        // 根据用户选择设置提示内容
                        if (plotSectionPosition.found) {
                            // 已有故事大纲，根据选择完善
                            if (selectedOption.includes("1") || selectedOption.toLowerCase().includes("架构")) {
                                promptContent = "请优化小说的故事架构，包括起承转合的设计和整体框架的合理性。"
                            } else if (selectedOption.includes("2") || selectedOption.toLowerCase().includes("时间线")) {
                                promptContent = "请完善小说的时间线设计，确保故事进展有序且具有合理的内在逻辑。"
                            } else if (selectedOption.includes("3") || selectedOption.toLowerCase().includes("转折点")) {
                                promptContent = "请强化关键转折点设计，确保转折点足够有力并能推动故事发展。"
                            } else if (selectedOption.includes("4") || selectedOption.toLowerCase().includes("子情节")) {
                                promptContent = "请丰富小说的子情节，为主线添加丰富的支线并确保它们与主线有机结合。"
                            } else if (selectedOption.includes("5") || selectedOption.toLowerCase().includes("冲突")) {
                                promptContent = "请优化冲突设计，包括内外冲突的层次感以及冲突的持续性和递进性。"
                            } else if (selectedOption.includes("6") || selectedOption.toLowerCase().includes("节奏")) {
                                promptContent = "请调整叙事节奏，设计不同阶段的紧张与松弛交替以维持读者兴趣。"
                            } else {
                                promptContent = "请全面改进故事大纲，使故事结构更加扎实且引人入胜。"
                            }
                        } else {
                            // 尚未有故事大纲，根据选择创建
                            if (selectedOption.includes("1") || selectedOption.toLowerCase().includes("三幕")) {
                                promptContent = "请创建基于三幕剧结构的故事大纲，包括设定、对抗和解决三个主要部分。"
                            } else if (selectedOption.includes("2") || selectedOption.toLowerCase().includes("英雄")) {
                                promptContent = "请创建基于英雄旅程结构的故事大纲，遵循坎贝尔神话模式的十七个阶段。"
                            } else if (selectedOption.includes("3") || selectedOption.toLowerCase().includes("非线性")) {
                                promptContent = "请创建非线性叙事结构的故事大纲，可以包括时间跳跃、视角切换或故事碎片。"
                            } else if (selectedOption.includes("4") || selectedOption.toLowerCase().includes("多线")) {
                                promptContent = "请创建多线并行结构的故事大纲，平行发展多个相关的故事线并最终汇合。"
                            } else if (selectedOption.includes("5") || selectedOption.toLowerCase().includes("起承转合")) {
                                promptContent = "请创建起承转合结构的故事大纲，符合东方传统叙事方式的四段式结构。"
                            } else if (selectedOption.includes("6") || selectedOption.toLowerCase().includes("环形")) {
                                promptContent = "请创建环形叙事结构的故事大纲，故事的结尾呼应开头，形成完整的循环。"
                            } else {
                                promptContent = "请创建完整的故事大纲，包括故事概要、时间线、主要转折点和子情节。"
                            }
                        }
                        
                        // 准备系统提示
                        const systemPrompt = `你是一位专业的小说剧情设计专家。${
                            plotSectionPosition.found ? 
                            "请根据现有故事大纲进行改进和完善。" : 
                            "请创建一个新的故事大纲部分。"
                        }
                        
                        ${promptContent}
                        
                        请确保故事大纲设计：
                        1. 结构合理且富有逻辑性
                        2. 情节有吸引力和推动力
                        3. 冲突设计合理并能引发紧张感
                        4. 转折点设计有力且令人惊讶
                        5. 整体叙事节奏有变化且引人入胜
                        
                        ${plotSectionPosition.found ? "以下是现有的故事大纲内容：" : "请创建以下格式的故事大纲："}
                        
                        ## 故事大纲

### 故事概要
                        *整体故事的简要描述*

### 时间线
                        *故事的时间设定和进展*

### 主要转折点
                        *关键的情节转折点*

### 子情节
                        *支线故事和次要情节*
                        
                        ### 冲突设计
                        *主要冲突和次要冲突*
                        
                        请直接给出完整的Markdown格式故事大纲内容，以"## 故事大纲"或类似标题开头。`;
                        
                        // 当前内容
                        let currentContent = ""
                        if (plotSectionPosition.found) {
                            const contentLines = frameworkContent.split("\n")
                            currentContent = contentLines.slice(plotSectionPosition.startLine, plotSectionPosition.endLine + 1).join("\n")
                        }
                        
                        // 请求AI助手生成故事大纲
                        const response = await cline.ask("plot_design", `${systemPrompt}\n\n${plotSectionPosition.found ? currentContent : ""}`, false)
                        
                        if (!response.text) {
                            pushToolResult("未能生成有效的故事大纲内容。")
                            success = false
                            return
                        }
                        
                        // 提取故事大纲内容
                        let newContent = response.text
                        
                        // 确保以"## 故事大纲"开头
                        if (!newContent.includes("## 故事大纲") && !newContent.includes("## 剧情大纲") && !newContent.includes("## 情节设计")) {
                            newContent = "## 故事大纲\n\n" + newContent
                        }
                        
                        // 更新框架文件
                        let updatedContent = ""
                        if (plotSectionPosition.found) {
                            // 替换现有部分
                            updatedContent = prepareReplaceDiff(
                                frameworkContent, 
                                plotSectionPosition.startLine, 
                                plotSectionPosition.endLine,
                                newContent
                            )
                        } else {
                            // 添加新部分
                            updatedContent = prepareAppendDiff(frameworkContent, "\n\n" + newContent)
                        }
                        
                        // 写入文件
                        await fs.writeFile(fullPath, updatedContent, "utf8")
                        success = true
                        
                        pushToolResult(`已${plotSectionPosition.found ? "更新" : "添加"}故事大纲内容。`)
                        
                        // 询问是否继续完善故事大纲
                        const continueQuestionBlock = {
                            type: "tool_use" as const,
                            name: "ask_followup_question" as const,
                            params: {
                                question: "您希望如何继续？\n\n" +
                                    "1. 继续深入完善故事大纲\n" +
                                    "2. 添加更多故事细节\n" +
                                    "3. 调整故事结构\n" +
                                    "4. 增强情节冲突\n" +
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
        pushToolResult(`处理故事大纲时出错: ${error.message || "未知错误"}`)
        return false
    }
} 