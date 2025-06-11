import * as path from "path"
import * as fs from "fs/promises"
import {prepareReplaceDiff, prepareAppendDiff, displayFileContent, updateFrameworkFile} from "../utils/common"
import { findSectionPosition } from "../utils/position"
import { safeExecute } from "../utils/error-handler"

/**
 * 处理叙事风格工作流
 */
export async function handleStyleWorkflow(params: any): Promise<boolean> {
    const { cline, frameworkPath, frameworkContent, askApproval, handleError, pushToolResult, removeClosingTag } = params
    
    try {
        pushToolResult("正在分析叙事风格情况...")
        
        // 获取工作区根路径
        const rootPath = cline.cwd || process.cwd()
        
        // 构建完整文件路径
        const fullPath = path.isAbsolute(frameworkPath) ? frameworkPath : path.join(rootPath, frameworkPath)
        
        // 检查叙事风格部分是否存在
        const styleSectionPosition = findSectionPosition(frameworkContent, ["## 叙事风格", "## 风格", "## 写作风格"])
        
        // 询问用户希望如何改进叙事风格
        const styleQuestionBlock = {
            type: "tool_use" as const,
            name: "ask_followup_question" as const,
            params: {
                question: styleSectionPosition.found ? 
                    "您希望如何改进叙事风格？\n\n" +
                    "1. 优化叙事视角设计\n" +
                    "2. 完善语言风格\n" +
                    "3. 调整叙事节奏\n" +
                    "4. 设计情感表达方式\n" +
                    "5. 构建场景描写风格\n" +
                    "6. 设计对话风格特点\n" : 
                    "您的框架中尚未包含叙事风格部分。您希望添加哪种类型的叙事风格？\n\n" +
                    "1. 标准叙事风格（视角、语言风格）\n" +
                    "2. 实验性叙事风格\n" +
                    "3. 文学性叙事风格\n" +
                    "4. 流畅简洁型风格\n" +
                    "5. 戏剧性强调型风格\n" +
                    "6. 多层次综合风格\n"
            },
            partial: false,
        }
        
        let selectedOption = ""
        let continueInCurrentSection = true
        let success = false
        
        await safeExecute(async () => {
            await cline.toolManager.askFollowupQuestionTool(
                cline,
                styleQuestionBlock,
            askApproval,
            handleError,
            async (result: unknown) => {
                if (result && typeof result === "string") {
                        selectedOption = result.trim()
                        
                        let promptContent = ""
                        
                        // 根据用户选择设置提示内容
                        if (styleSectionPosition.found) {
                            // 已有叙事风格，根据选择完善
                            if (selectedOption.includes("1") || selectedOption.toLowerCase().includes("视角")) {
                                promptContent = "请优化小说的叙事视角设计，包括视角类型、多视角切换策略和视角限制。"
                            } else if (selectedOption.includes("2") || selectedOption.toLowerCase().includes("语言")) {
                                promptContent = "请完善小说的语言风格，包括词汇选择、句式结构和修辞手法等特点。"
                            } else if (selectedOption.includes("3") || selectedOption.toLowerCase().includes("节奏")) {
                                promptContent = "请调整小说的叙事节奏，包括快慢节奏的变化、紧张感的构建和松弛感的设计。"
                            } else if (selectedOption.includes("4") || selectedOption.toLowerCase().includes("情感")) {
                                promptContent = "请设计小说的情感表达方式，包括如何传递人物情绪和营造特定的情感氛围。"
                            } else if (selectedOption.includes("5") || selectedOption.toLowerCase().includes("场景")) {
                                promptContent = "请构建小说的场景描写风格，包括环境描写的详略取舍和感官描写的侧重点。"
                            } else if (selectedOption.includes("6") || selectedOption.toLowerCase().includes("对话")) {
                                promptContent = "请设计小说的对话风格特点，包括对话的节奏、口语化程度和对话标记的使用。"
                            } else {
                                promptContent = "请全面改进叙事风格，使风格更加鲜明、一致和有吸引力。"
                            }
                        } else {
                            // 尚未有叙事风格，根据选择创建
                            if (selectedOption.includes("1") || selectedOption.toLowerCase().includes("标准")) {
                                promptContent = "请创建标准叙事风格，包括视角选择和基础语言风格特点。"
                            } else if (selectedOption.includes("2") || selectedOption.toLowerCase().includes("实验性")) {
                                promptContent = "请创建实验性叙事风格，可以包含非线性叙事、意识流或其他创新叙事技巧。"
                            } else if (selectedOption.includes("3") || selectedOption.toLowerCase().includes("文学性")) {
                                promptContent = "请创建文学性叙事风格，注重语言的艺术性、比喻象征和内在情感的细腻表达。"
                            } else if (selectedOption.includes("4") || selectedOption.toLowerCase().includes("流畅")) {
                                promptContent = "请创建流畅简洁型叙事风格，注重直接有力的表达和故事节奏的流畅性。"
                            } else if (selectedOption.includes("5") || selectedOption.toLowerCase().includes("戏剧性")) {
                                promptContent = "请创建戏剧性强调型叙事风格，注重情感冲突和戏剧化场景的塑造。"
                            } else if (selectedOption.includes("6") || selectedOption.toLowerCase().includes("多层次")) {
                                promptContent = "请创建多层次综合叙事风格，包含多种风格元素的灵活运用。"
                            } else {
                                promptContent = "请创建完整的叙事风格设计，包括视角选择、语言特点和节奏设计。"
                            }
                        }
                        
                        // 准备系统提示
                        const systemPrompt = `你是一位专业的小说叙事风格设计专家。${
                            styleSectionPosition.found ? 
                            "请根据现有叙事风格进行改进和完善。" : 
                            "请创建一个新的叙事风格部分。"
                        }
                        
                        ${promptContent}
                        
                        请确保叙事风格设计：
                        1. 风格鲜明且一致
                        2. 风格与故事类型和主题相符
                        3. 风格能增强故事的表达效果
                        4. 风格有特色但不至于过分干扰阅读
                        5. 风格的各个要素相互协调
                        
                        ${styleSectionPosition.found ? "以下是现有的叙事风格内容：" : "请创建以下格式的叙事风格："}
                        
                        ## 叙事风格
                        
                        ### 叙事视角
                        *叙事视角的描述*
                        
                        ### 语言风格
                        *语言风格的特点*
                        
                        ### 节奏与结构
                        *叙事节奏和结构的特点*
                        
                        ### 表现手法
                        *特殊的表现手法和技巧*
                        
                        请直接给出完整的Markdown格式叙事风格内容，以"## 叙事风格"或类似标题开头。`;
                        
                        // 当前内容
                        let currentContent = ""
                        if (styleSectionPosition.found) {
                            const contentLines = frameworkContent.split("\n")
                            currentContent = contentLines.slice(styleSectionPosition.startLine, styleSectionPosition.endLine + 1).join("\n")
                        }
                        
                        // 请求AI助手生成叙事风格
                        const response = await cline.ask("style_design", `${systemPrompt}\n\n${styleSectionPosition.found ? currentContent : ""}`, false)
                        
                        if (!response.text) {
                            pushToolResult("未能生成有效的叙事风格内容。")
                            success = false
                            return
                        }
                        
                        // 提取叙事风格内容
                        let newContent = response.text
                        
                        // 确保以"## 叙事风格"开头
                        if (!newContent.includes("## 叙事风格") && !newContent.includes("## 风格") && !newContent.includes("## 写作风格")) {
                            newContent = "## 叙事风格\n\n" + newContent
                        }
                        
                        // 更新框架文件
                        let updatedContent = ""
                        if (styleSectionPosition.found) {
                            // 替换现有部分
                            updatedContent = prepareReplaceDiff(
                                frameworkContent, 
                                styleSectionPosition.startLine, 
                                styleSectionPosition.endLine,
                                newContent
                            )
                        } else {
                            // 添加新部分
                            updatedContent = prepareAppendDiff(frameworkContent, "\n\n" + newContent)
                        }
                        
                        // 写入文件
                        await updateFrameworkFile(fullPath, updatedContent)
                        success = true
                        
                        pushToolResult(`已${styleSectionPosition.found ? "更新" : "添加"}叙事风格内容。`)
                        
                        // 询问是否继续完善叙事风格
                        const continueQuestionBlock = {
            type: "tool_use" as const,
            name: "ask_followup_question" as const,
            params: {
                                question: "您希望如何继续？\n\n" +
                                    "1. 继续深入完善叙事风格\n" +
                                    "2. 添加更多风格细节\n" +
                                    "3. 调整风格与内容的平衡\n" +
                                    "4. 增强风格的一致性\n" +
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
        pushToolResult(`处理叙事风格时出错: ${error.message || "未知错误"}`)
        return false
    }
} 