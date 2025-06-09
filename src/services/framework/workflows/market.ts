import * as path from "path"
import * as fs from "fs/promises"
import { prepareReplaceDiff, prepareAppendDiff, displayFileContent } from "../utils/common"
import { findSectionPosition } from "../utils/position"
import { safeExecute } from "../utils/error-handler"

/**
 * 处理市场定位工作流
 */
export async function handleMarketWorkflow(params: any): Promise<boolean> {
    const { cline, frameworkPath, frameworkContent, askApproval, handleError, pushToolResult, removeClosingTag } = params
    
    try {
        pushToolResult("正在分析市场定位情况...")
        
        // 获取工作区根路径
        const rootPath = cline.cwd || process.cwd()
        
        // 构建完整文件路径
        const fullPath = path.isAbsolute(frameworkPath) ? frameworkPath : path.join(rootPath, frameworkPath)
        
        // 检查市场定位部分是否存在
        const marketSectionPosition = findSectionPosition(frameworkContent, ["## 市场定位", "## 市场", "## 目标读者"])
        
        // 询问用户希望如何改进市场定位
        const marketQuestionBlock = {
            type: "tool_use" as const,
            name: "ask_followup_question" as const,
            params: {
                question: marketSectionPosition.found ? 
                    "您希望如何改进市场定位？\n\n" +
                    "1. 精确目标读者群体\n" +
                    "2. 分析市场竞争状况\n" +
                    "3. 设计多媒体改编方向\n" +
                    "4. 确定作品差异化优势\n" +
                    "5. 增加商业价值分析\n" +
                    "6. 规划推广策略\n" : 
                    "您的框架中尚未包含市场定位部分。您希望添加哪种类型的市场定位？\n\n" +
                    "1. 标准市场定位（读者群体、改编潜力）\n" +
                    "2. 大众市场导向型\n" +
                    "3. 细分市场精准型\n" +
                    "4. 跨媒体开发型\n" +
                    "5. 商业价值导向型\n" +
                    "6. 多元市场综合型\n"
            },
            partial: false,
        }
        
        let selectedOption = ""
        let continueInCurrentSection = true
        let success = false
        
        await safeExecute(async () => {
            await cline.toolManager.askFollowupQuestionTool(
                cline,
                marketQuestionBlock,
            askApproval,
            handleError,
            async (result: unknown) => {
                if (result && typeof result === "string") {
                        selectedOption = result.trim()
                        
                        let promptContent = ""
                        
                        // 根据用户选择设置提示内容
                        if (marketSectionPosition.found) {
                            // 已有市场定位，根据选择完善
                            if (selectedOption.includes("1") || selectedOption.toLowerCase().includes("读者")) {
                                promptContent = "请精确描述小说的目标读者群体，包括年龄、性别、兴趣、阅读习惯等详细特征。"
                            } else if (selectedOption.includes("2") || selectedOption.toLowerCase().includes("竞争")) {
                                promptContent = "请分析当前市场中类似题材作品的竞争状况，以及您的作品如何在竞争中脱颖而出。"
                            } else if (selectedOption.includes("3") || selectedOption.toLowerCase().includes("改编")) {
                                promptContent = "请设计作品的多媒体改编方向，包括电影、电视剧、游戏、漫画等可能的衍生产品。"
                            } else if (selectedOption.includes("4") || selectedOption.toLowerCase().includes("差异化")) {
                                promptContent = "请确定作品的差异化优势，说明它与同类作品的区别以及独特卖点。"
                            } else if (selectedOption.includes("5") || selectedOption.toLowerCase().includes("商业价值")) {
                                promptContent = "请增加作品的商业价值分析，包括潜在的盈利模式和市场规模估计。"
                            } else if (selectedOption.includes("6") || selectedOption.toLowerCase().includes("推广")) {
                                promptContent = "请规划作品的推广策略，包括目标平台、营销方式和读者互动计划。"
                            } else {
                                promptContent = "请全面改进市场定位，使其更具针对性和商业可行性。"
                            }
                        } else {
                            // 尚未有市场定位，根据选择创建
                            if (selectedOption.includes("1") || selectedOption.toLowerCase().includes("标准")) {
                                promptContent = "请创建标准市场定位，包括目标读者群体和多媒体改编潜力。"
                            } else if (selectedOption.includes("2") || selectedOption.toLowerCase().includes("大众")) {
                                promptContent = "请创建面向大众市场的定位，着重分析广泛读者群体的吸引策略。"
                            } else if (selectedOption.includes("3") || selectedOption.toLowerCase().includes("细分")) {
                                promptContent = "请创建针对细分市场的精准定位，深入分析特定读者群体的需求和偏好。"
                            } else if (selectedOption.includes("4") || selectedOption.toLowerCase().includes("跨媒体")) {
                                promptContent = "请创建以跨媒体开发为导向的市场定位，详细规划不同媒体形式的改编策略。"
                            } else if (selectedOption.includes("5") || selectedOption.toLowerCase().includes("商业")) {
                                promptContent = "请创建以商业价值为导向的市场定位，重点分析作品的盈利模式和商业前景。"
                            } else if (selectedOption.includes("6") || selectedOption.toLowerCase().includes("多元")) {
                                promptContent = "请创建多元市场综合定位，兼顾不同读者群体和多种商业开发方向。"
                            } else {
                                promptContent = "请创建完整的市场定位设计，包括目标读者、市场竞争和商业前景。"
                            }
                        }
                        
                        // 准备系统提示
                        const systemPrompt = `你是一位专业的小说市场定位专家。${
                            marketSectionPosition.found ? 
                            "请根据现有市场定位进行改进和完善。" : 
                            "请创建一个新的市场定位部分。"
                        }
                        
                        ${promptContent}
                        
                        请确保市场定位设计：
                        1. 目标读者群体定义清晰
                        2. 市场竞争分析客观准确
                        3. 多媒体改编方向具有可行性
                        4. 作品差异化优势明确
                        5. 商业价值评估合理
                        
                        ${marketSectionPosition.found ? "以下是现有的市场定位内容：" : "请创建以下格式的市场定位："}
                        
                        ## 市场定位
                        
                        ### 目标读者群体
                        *目标读者的描述*
                        
                        ### 市场竞争分析
                        *市场竞争状况分析*
                        
                        ### 多媒体改编潜力
                        *多媒体改编方向*
                        
                        ### 作品差异化优势
                        *作品与同类作品的区别*
                        
                        请直接给出完整的Markdown格式市场定位内容，以"## 市场定位"或类似标题开头。`;
                        
                        // 当前内容
                        let currentContent = ""
                        if (marketSectionPosition.found) {
                            const contentLines = frameworkContent.split("\n")
                            currentContent = contentLines.slice(marketSectionPosition.startLine, marketSectionPosition.endLine + 1).join("\n")
                        }
                        
                        // 请求AI助手生成市场定位
                        const response = await cline.ask("market_design", `${systemPrompt}\n\n${marketSectionPosition.found ? currentContent : ""}`, false)
                        
                        if (!response.text) {
                            pushToolResult("未能生成有效的市场定位内容。")
                            success = false
                            return
                        }
                        
                        // 提取市场定位内容
                        let newContent = response.text
                        
                        // 确保以"## 市场定位"开头
                        if (!newContent.includes("## 市场定位") && !newContent.includes("## 市场") && !newContent.includes("## 目标读者")) {
                            newContent = "## 市场定位\n\n" + newContent
                        }
                        
                        // 更新框架文件
                        let updatedContent = ""
                        if (marketSectionPosition.found) {
                            // 替换现有部分
                            updatedContent = prepareReplaceDiff(
                                frameworkContent, 
                                marketSectionPosition.startLine, 
                                marketSectionPosition.endLine,
                                newContent
                            )
                        } else {
                            // 添加新部分
                            updatedContent = prepareAppendDiff(frameworkContent, "\n\n" + newContent)
                        }
                        
                        // 写入文件
                        await fs.writeFile(fullPath, updatedContent, "utf8")
                        success = true
                        
                        pushToolResult(`已${marketSectionPosition.found ? "更新" : "添加"}市场定位内容。`)
                        
                        // 询问是否继续完善市场定位
                        const continueQuestionBlock = {
            type: "tool_use" as const,
            name: "ask_followup_question" as const,
            params: {
                                question: "您希望如何继续？\n\n" +
                                    "1. 继续深入完善市场定位\n" +
                                    "2. 添加更多市场细节\n" +
                                    "3. 调整商业策略\n" +
                                    "4. 增强目标读者分析\n" +
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
        pushToolResult(`处理市场定位时出错: ${error.message || "未知错误"}`)
        return false
    }
} 