import * as path from "path"
import * as fs from "fs/promises"
import { prepareReplaceDiff, prepareAppendDiff, displayFileContent } from "../utils/common"
import { findSectionPosition } from "../utils/position"
import { safeExecute } from "../utils/error-handler"

/**
 * 处理角色设计工作流
 */
export async function handleCharacterWorkflow(params: any): Promise<boolean> {
    const { cline, frameworkPath, frameworkContent, askApproval, handleError, pushToolResult, removeClosingTag } = params
    
    try {
        pushToolResult("正在分析角色设计情况...")
        
        // 获取工作区根路径
        const rootPath = cline.cwd || process.cwd()
        
        // 构建完整文件路径
        const fullPath = path.isAbsolute(frameworkPath) ? frameworkPath : path.join(rootPath, frameworkPath)
        
        // 检查角色设计部分是否存在
        const characterSectionPosition = findSectionPosition(frameworkContent, ["## 主要角色", "## 角色设计", "## 角色"])
        
        // 询问用户希望如何改进角色设计
        const characterQuestionBlock = {
            type: "tool_use" as const,
            name: "ask_followup_question" as const,
            params: {
                question: characterSectionPosition.found ? 
                    "您希望如何改进角色设计？\n\n" +
                    "1. 完善主角设计\n" +
                    "2. 完善反派/对手设计\n" +
                    "3. 添加配角设计\n" +
                    "4. 优化角色关系\n" +
                    "5. 增强角色成长弧\n" +
                    "6. 设计角色对话风格\n" : 
                    "您的框架中尚未包含角色设计部分。您希望添加哪种类型的角色设计？\n\n" +
                    "1. 标准角色设计（主角、反派、配角）\n" +
                    "2. 详细角色心理分析\n" +
                    "3. 角色关系网络\n" +
                    "4. 角色成长轨迹\n" +
                    "5. 性格驱动的角色设计\n" +
                    "6. 多维度综合角色设计\n"
            },
            partial: false,
        }
        
        let selectedOption = ""
        let continueInCurrentSection = true
        let success = false
        
        await safeExecute(async () => {
            await cline.toolManager.askFollowupQuestionTool(
                cline,
                characterQuestionBlock,
                askApproval,
                handleError,
                async (result: unknown) => {
                    if (result && typeof result === "string") {
                        selectedOption = result.trim()
                        
                        let promptContent = ""
                        
                        // 根据用户选择设置提示内容
                        if (characterSectionPosition.found) {
                            // 已有角色设计，根据选择完善
                            if (selectedOption.includes("1") || selectedOption.toLowerCase().includes("主角")) {
                                promptContent = "请完善主角设计，包括背景故事、性格特点、外貌描述、内在动机和成长轨迹。"
                            } else if (selectedOption.includes("2") || selectedOption.toLowerCase().includes("反派")) {
                                promptContent = "请完善反派/对手设计，包括背景故事、性格特点、与主角的对立点以及独特的价值观。"
                            } else if (selectedOption.includes("3") || selectedOption.toLowerCase().includes("配角")) {
                                promptContent = "请添加重要配角设计，包括他们的性格特点、在故事中的作用以及与主角的关系。"
                            } else if (selectedOption.includes("4") || selectedOption.toLowerCase().includes("关系")) {
                                promptContent = "请优化角色之间的关系网络，明确各角色之间的情感连接、冲突和依赖关系。"
                            } else if (selectedOption.includes("5") || selectedOption.toLowerCase().includes("成长")) {
                                promptContent = "请增强角色的成长弧，设计角色如何随着故事发展而变化、成长或转变。"
                            } else if (selectedOption.includes("6") || selectedOption.toLowerCase().includes("对话")) {
                                promptContent = "请设计各角色独特的对话风格和语言特点，使角色在对话中更加鲜活和立体。"
                            } else {
                                promptContent = "请全面改进角色设计，使角色更加丰满、真实和有深度。"
                            }
                        } else {
                            // 尚未有角色设计，根据选择创建
                            if (selectedOption.includes("1") || selectedOption.toLowerCase().includes("标准")) {
                                promptContent = "请创建标准角色设计，包括主角、反派和重要配角的基本描述。"
                            } else if (selectedOption.includes("2") || selectedOption.toLowerCase().includes("心理")) {
                                promptContent = "请创建包含详细心理分析的角色设计，深入探讨角色的内心世界和心理动机。"
                            } else if (selectedOption.includes("3") || selectedOption.toLowerCase().includes("关系网络")) {
                                promptContent = "请创建以角色关系网络为中心的角色设计，详细描述角色之间的情感连接和互动。"
                            } else if (selectedOption.includes("4") || selectedOption.toLowerCase().includes("成长轨迹")) {
                                promptContent = "请创建侧重于角色成长轨迹的角色设计，规划角色在故事中的变化和发展。"
                            } else if (selectedOption.includes("5") || selectedOption.toLowerCase().includes("性格驱动")) {
                                promptContent = "请创建以性格为驱动的角色设计，让角色的独特性格特点主导他们的行为和决策。"
                            } else if (selectedOption.includes("6") || selectedOption.toLowerCase().includes("多维度")) {
                                promptContent = "请创建多维度综合的角色设计，全面考虑角色的背景、性格、关系、成长和对话等方面。"
                            } else {
                                promptContent = "请创建完整的角色设计，包括主角、反派和重要配角，以及他们之间的关系。"
                            }
                        }
                        
                        // 准备系统提示
                        const systemPrompt = `你是一位专业的小说角色设计专家。${
                            characterSectionPosition.found ? 
                            "请根据现有角色设计进行改进和完善。" : 
                            "请创建一个新的角色设计部分。"
                        }
                        
                        ${promptContent}
                        
                        请确保角色设计：
                        1. 角色有清晰的动机和目标
                        2. 角色有独特的性格特点和缺陷
                        3. 主要角色之间有明确的关系和互动
                        4. 角色设计支持故事的主题和情节发展
                        5. 角色有成长和变化的潜力
                        
                        ${characterSectionPosition.found ? "以下是现有的角色设计内容：" : "请创建以下格式的角色设计："}
                        
                        ## 主要角色
                        
                        ### 主角
                        *主角的详细描述*
                        
                        ### 反派/对手
                        *反派的详细描述*
                        
                        ### 重要配角
                        *配角的详细描述*
                        
                        ### 角色关系
                        *角色之间的关系描述*
                        
                        请直接给出完整的Markdown格式角色设计内容，以"## 主要角色"或类似标题开头。`;
                        
                        // 当前内容
                        let currentContent = ""
                        if (characterSectionPosition.found) {
                            const contentLines = frameworkContent.split("\n")
                            currentContent = contentLines.slice(characterSectionPosition.startLine, characterSectionPosition.endLine + 1).join("\n")
                        }
                        
                        // 请求AI助手生成角色设计
                        const response = await cline.ask("character_design", `${systemPrompt}\n\n${characterSectionPosition.found ? currentContent : ""}`, false)
                        
                        if (!response.text) {
                            pushToolResult("未能生成有效的角色设计内容。")
                            success = false
                            return
                        }
                        
                        // 提取角色设计内容
                        let newContent = response.text
                        
                        // 确保以"## 主要角色"开头
                        if (!newContent.includes("## 主要角色") && !newContent.includes("## 角色设计") && !newContent.includes("## 角色")) {
                            newContent = "## 主要角色\n\n" + newContent
                        }
                        
                        // 更新框架文件
                        let updatedContent = ""
                        if (characterSectionPosition.found) {
                            // 替换现有部分
                            updatedContent = prepareReplaceDiff(
                                frameworkContent, 
                                characterSectionPosition.startLine, 
                                characterSectionPosition.endLine,
                                newContent
                            )
                        } else {
                            // 添加新部分
                            updatedContent = prepareAppendDiff(frameworkContent, "\n\n" + newContent)
                        }
                        
                        // 写入文件
                        await fs.writeFile(fullPath, updatedContent, "utf8")
                        success = true
                        
                        pushToolResult(`已${characterSectionPosition.found ? "更新" : "添加"}角色设计内容。`)
                        
                        // 询问是否继续完善角色设计
                        const continueQuestionBlock = {
            type: "tool_use" as const,
            name: "ask_followup_question" as const,
            params: {
                                question: "您希望如何继续？\n\n" +
                                    "1. 继续深入完善角色设计\n" +
                                    "2. 添加更多角色细节\n" +
                                    "3. 调整角色关系\n" +
                                    "4. 设计角色对白特点\n" +
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
                                    } else if (continueChoice.includes("3") || continueChoice.toLowerCase().includes("调整角色关系")) {
                                        continueInCurrentSection = true
                                    } else if (continueChoice.includes("4") || continueChoice.toLowerCase().includes("设计角色对白")) {
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
        pushToolResult(`处理角色设计时出错: ${error.message || "未知错误"}`)
        return false
    }
} 