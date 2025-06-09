import * as path from "path"
import * as fs from "fs/promises"
import { prepareReplaceDiff, prepareAppendDiff, displayFileContent } from "../utils/common"
import { findSectionPosition } from "../utils/position"
import { safeExecute } from "../utils/error-handler"

/**
 * 处理小说题材工作流
 */
export async function handleGenreWorkflow(params: any): Promise<boolean> {
    const { cline, frameworkPath, frameworkContent, askApproval, handleError, pushToolResult, removeClosingTag } = params
    
    try {
        pushToolResult("正在分析小说题材情况...")
        
        // 获取工作区根路径
        const rootPath = cline.cwd || process.cwd()
        
        // 构建完整文件路径
        const fullPath = path.isAbsolute(frameworkPath) ? frameworkPath : path.join(rootPath, frameworkPath)
        
        // 检查小说题材部分是否存在
        const genreSectionPosition = findSectionPosition(frameworkContent, ["## 小说题材", "## 题材", "## 类型"])
        
        // 询问用户希望如何改进小说题材
        const genreQuestionBlock = {
            type: "tool_use" as const,
            name: "ask_followup_question" as const,
            params: {
                question: genreSectionPosition.found ? 
                    "您希望如何改进小说题材设定？\n\n" +
                    "1. 明确主要题材类型\n" +
                    "2. 设计题材融合特点\n" +
                    "3. 完善题材规则与设定\n" +
                    "4. 强化题材创新点\n" +
                    "5. 增加题材流派特色\n" +
                    "6. 调整题材市场定位\n" : 
                    "您的框架中尚未包含小说题材部分。您希望添加哪种类型的小说题材？\n\n" +
                    "1. 修仙/仙侠\n" +
                    "2. 武侠/江湖\n" +
                    "3. 玄幻/奇幻\n" +
                    "4. 科幻/未来\n" +
                    "5. 都市/现代\n" +
                    "6. 其他类型（悬疑/历史/游戏等）\n"
            },
            partial: false,
        }
        
        let selectedOption = ""
        let continueInCurrentSection = true
        let success = false
        
        await safeExecute(async () => {
            await cline.toolManager.askFollowupQuestionTool(
                cline,
                genreQuestionBlock,
                askApproval,
                handleError,
                async (result: unknown) => {
                    if (result && typeof result === "string") {
                        selectedOption = result.trim()
                        
                        let promptContent = ""
                        
                        // 根据用户选择设置提示内容
                        if (genreSectionPosition.found) {
                            // 已有小说题材，根据选择完善
                            if (selectedOption.includes("1") || selectedOption.toLowerCase().includes("主要题材")) {
                                promptContent = "请明确小说的主要题材类型，包括具体的类型划分、子类型和风格倾向。"
                            } else if (selectedOption.includes("2") || selectedOption.toLowerCase().includes("融合")) {
                                promptContent = "请设计小说的题材融合特点，如何将多种题材元素有机结合，形成独特的题材混搭。"
                            } else if (selectedOption.includes("3") || selectedOption.toLowerCase().includes("规则")) {
                                promptContent = "请完善小说题材的规则与设定，包括该题材的基本法则、套路和读者期待。"
                            } else if (selectedOption.includes("4") || selectedOption.toLowerCase().includes("创新")) {
                                promptContent = "请强化小说题材的创新点，如何在传统题材基础上进行创新和突破。"
                            } else if (selectedOption.includes("5") || selectedOption.toLowerCase().includes("流派")) {
                                promptContent = "请增加小说题材的流派特色，让作品在该题材中形成独特的流派风格。"
                            } else if (selectedOption.includes("6") || selectedOption.toLowerCase().includes("市场")) {
                                promptContent = "请调整小说题材的市场定位，考虑题材的受众群体、市场空间和发展趋势。"
                            } else {
                                promptContent = "请全面改进小说题材设定，使题材定位更加明确、有特色和市场竞争力。"
                            }
                        } else {
                            // 尚未有小说题材，根据选择创建
                            if (selectedOption.includes("1") || selectedOption.toLowerCase().includes("修仙") || selectedOption.toLowerCase().includes("仙侠")) {
                                promptContent = "请创建修仙/仙侠类题材设定，包括修炼体系、境界划分、仙家宗门和世界观等。"
                            } else if (selectedOption.includes("2") || selectedOption.toLowerCase().includes("武侠") || selectedOption.toLowerCase().includes("江湖")) {
                                promptContent = "请创建武侠/江湖类题材设定，包括武功体系、门派设定、江湖规则和历史背景等。"
                            } else if (selectedOption.includes("3") || selectedOption.toLowerCase().includes("玄幻") || selectedOption.toLowerCase().includes("奇幻")) {
                                promptContent = "请创建玄幻/奇幻类题材设定，包括魔法体系、种族设定、世界构建和特殊规则等。"
                            } else if (selectedOption.includes("4") || selectedOption.toLowerCase().includes("科幻") || selectedOption.toLowerCase().includes("未来")) {
                                promptContent = "请创建科幻/未来类题材设定，包括科技水平、未来社会形态、宇宙观和科学设定等。"
                            } else if (selectedOption.includes("5") || selectedOption.toLowerCase().includes("都市") || selectedOption.toLowerCase().includes("现代")) {
                                promptContent = "请创建都市/现代类题材设定，包括现实基础、特殊元素、社会背景和生活形态等。"
                            } else if (selectedOption.includes("6") || selectedOption.toLowerCase().includes("其他")) {
                                promptContent = "请创建其他类型题材设定（如悬疑/历史/游戏等），包括该题材的核心特征、规则体系和世界观等。"
                            } else {
                                promptContent = "请创建完整的小说题材设定，包括题材类型、规则体系和创新特点等。"
                            }
                        }
                        
                        // 准备系统提示
                        const systemPrompt = `你是一位专业的小说题材设计专家。${
                            genreSectionPosition.found ? 
                            "请根据现有小说题材进行改进和完善。" : 
                            "请创建一个新的小说题材部分。"
                        }
                        
                        ${promptContent}
                        
                        请确保小说题材设计：
                        1. 题材定位明确且有特色
                        2. 符合题材基本规则与读者期待
                        3. 有足够的创新点与差异化特征
                        4. 题材内部逻辑自洽
                        5. 有市场竞争力和读者吸引力
                        
                        ${genreSectionPosition.found ? "以下是现有的小说题材内容：" : "请创建以下格式的小说题材："}
                        
                        ## 小说题材
                        
                        ### 主要类型
                        *小说的主要题材类型*
                        
                        ### 题材特色
                        *题材的独特之处与创新点*
                        
                        ### 题材规则
                        *该题材的基本规则与设定*
                        
                        ### 题材融合
                        *与其他题材的融合特点*
                        
                        请直接给出完整的Markdown格式小说题材内容，以"## 小说题材"或类似标题开头。`;
                        
                        // 当前内容
                        let currentContent = ""
                        if (genreSectionPosition.found) {
                            const contentLines = frameworkContent.split("\n")
                            currentContent = contentLines.slice(genreSectionPosition.startLine, genreSectionPosition.endLine + 1).join("\n")
                        }
                        
                        // 请求AI助手生成小说题材
                        const response = await cline.ask("genre_design", `${systemPrompt}\n\n${genreSectionPosition.found ? currentContent : ""}`, false)
                        
                        if (!response.text) {
                            pushToolResult("未能生成有效的小说题材内容。")
                            success = false
                            return
                        }
                        
                        // 提取小说题材内容
                        let newContent = response.text
                        
                        // 确保以"## 小说题材"开头
                        if (!newContent.includes("## 小说题材") && !newContent.includes("## 题材") && !newContent.includes("## 类型")) {
                            newContent = "## 小说题材\n\n" + newContent
                        }
                        
                        // 更新框架文件
                        let updatedContent = ""
                        if (genreSectionPosition.found) {
                            // 替换现有部分
                            updatedContent = prepareReplaceDiff(
                                frameworkContent, 
                                genreSectionPosition.startLine, 
                                genreSectionPosition.endLine,
                                newContent
                            )
                        } else {
                            // 确定添加位置 - 在核心概念之后，主要角色之前
                            const coreConceptPosition = findSectionPosition(frameworkContent, ["## 核心概念"])
                            const characterPosition = findSectionPosition(frameworkContent, ["## 主要角色"])
                            
                            if (coreConceptPosition.found && characterPosition.found) {
                                // 在核心概念和主要角色之间插入
                                updatedContent = prepareReplaceDiff(
                                    frameworkContent,
                                    characterPosition.startLine,
                                    characterPosition.startLine - 1,
                                    newContent + "\n\n"
                                )
                            } else {
                                // 如果找不到合适位置，直接追加
                                updatedContent = prepareAppendDiff(frameworkContent, "\n\n" + newContent)
                            }
                        }
                        
                        // 写入文件
                        await fs.writeFile(fullPath, updatedContent, "utf8")
                        success = true
                        
                        pushToolResult(`已${genreSectionPosition.found ? "更新" : "添加"}小说题材内容。`)
                        
                        // 询问是否继续完善小说题材
                        const continueQuestionBlock = {
                            type: "tool_use" as const,
                            name: "ask_followup_question" as const,
                            params: {
                                question: "您希望如何继续？\n\n" +
                                    "1. 继续深入完善小说题材\n" +
                                    "2. 添加更多题材细节\n" +
                                    "3. 调整题材规则\n" +
                                    "4. 增强题材独特性\n" +
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
        pushToolResult(`处理小说题材时出错: ${error.message || "未知错误"}`)
        return false
    }
} 