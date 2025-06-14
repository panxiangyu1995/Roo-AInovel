import * as path from "path"
import * as fs from "fs/promises"
import {prepareReplaceDiff, prepareAppendDiff, displayFileContent, updateFrameworkFile} from "../utils/common"
import { findSectionPosition } from "../utils/position"
import { safeExecute } from "../utils/error-handler"
import { WorkflowSpecialResult } from "../interfaces"

/**
 * 处理角色设计工作流
 */
export async function handleCharacterWorkflow(params: any): Promise<boolean | WorkflowSpecialResult> {
    const { cline, frameworkPath, frameworkContent, askApproval, handleError, pushToolResult, removeClosingTag } = params
    
    try {
        pushToolResult("正在分析角色设计情况...")
        
        // 获取工作区根路径
        const rootPath = cline.cwd || process.cwd()
        
        // 构建完整文件路径
        const fullPath = path.isAbsolute(frameworkPath) ? frameworkPath : path.join(rootPath, frameworkPath)
        
        // 检查角色设计部分是否存在
        const characterSectionPosition = findSectionPosition(frameworkContent, ["## 主要角色", "## 角色设计", "## 角色"])
        
        // 初始化状态
        let continueInCurrentSection = false
        let success = false
        
        // 获取当前角色设计内容
        let currentContent = ""
        if (characterSectionPosition.found) {
            const contentLines = frameworkContent.split("\n")
            currentContent = contentLines.slice(characterSectionPosition.startLine, characterSectionPosition.endLine + 1).join("\n")
        }
        
        // 步骤1: 询问用户希望如何改进角色设计
        const initialOption = await askUserForInitialOption(cline, characterSectionPosition, askApproval, handleError, removeClosingTag)
        if (!initialOption) {
            pushToolResult("未能获取用户选择。")
            return false
        }
        
        // 步骤2: 根据用户选择生成角色设计内容
        const newContent = await generateCharacterContent(cline, initialOption, characterSectionPosition, currentContent)
        if (!newContent) {
            pushToolResult("未能生成有效的角色设计内容。")
            return false
        }
        
        // 步骤3: 更新框架文件
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
        await updateFrameworkFile(fullPath, updatedContent)
        success = true
        
        pushToolResult(`已${characterSectionPosition.found ? "更新" : "添加"}角色设计内容。`)
        
        // 步骤4: 询问用户下一步操作
        const nextAction = await askUserForNextAction(
            cline, 
            askApproval, 
            handleError, 
            removeClosingTag, 
            pushToolResult,
            currentContent,
            fullPath,
            frameworkContent,
            characterSectionPosition
        )
        
        // 处理特殊返回值
        if (typeof nextAction === 'object' && nextAction.type === 'optimize_all_sections') {
            return nextAction
        }
        
        // 处理普通返回值
        continueInCurrentSection = nextAction === 'continue'
        
        return success || continueInCurrentSection
    } catch (error) {
        handleError(error)
        pushToolResult(`处理角色设计时出错: ${error.message || "未知错误"}`)
        return false
    }
}

/**
 * 询问用户希望如何改进角色设计
 */
async function askUserForInitialOption(
    cline: any, 
    characterSectionPosition: any, 
    askApproval: any, 
    handleError: any, 
    removeClosingTag: any
): Promise<string> {
    return new Promise((resolve) => {
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
        
        cline.toolManager.askFollowupQuestionTool(
            cline,
            characterQuestionBlock,
            askApproval,
            handleError,
            (result: unknown) => {
                if (result && typeof result === "string") {
                    resolve(result.trim())
                } else {
                    resolve("")
                }
            },
            removeClosingTag
        )
    })
}

/**
 * 根据用户选择生成角色设计内容
 */
async function generateCharacterContent(
    cline: any, 
    selectedOption: string, 
    characterSectionPosition: any, 
    currentContent: string
): Promise<string> {
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
    
    // 请求AI助手生成角色设计
    const response = await cline.ask("character_design", `${systemPrompt}\n\n${characterSectionPosition.found ? currentContent : ""}`, false)
    
    if (!response.text) {
        return ""
    }
    
    // 提取角色设计内容
    let newContent = response.text
    
    // 确保以"## 主要角色"开头
    if (!newContent.includes("## 主要角色") && !newContent.includes("## 角色设计") && !newContent.includes("## 角色")) {
        newContent = "## 主要角色\n\n" + newContent
    }
    
    return newContent
}

/**
 * 询问用户下一步操作
 */
async function askUserForNextAction(
    cline: any, 
    askApproval: any, 
    handleError: any, 
    removeClosingTag: any,
    pushToolResult: any,
    currentContent: string,
    fullPath: string,
    frameworkContent: string,
    characterSectionPosition: any
): Promise<'continue' | 'next' | 'complete' | WorkflowSpecialResult> {
    return new Promise((resolve) => {
        const continueQuestionBlock = {
            type: "tool_use" as const,
            name: "ask_followup_question" as const,
            params: {
                question: "您希望如何继续？\n\n" +
                    "1. 继续深入完善角色设计\n" +
                    "2. 添加更多角色细节\n" +
                    "3. 调整角色关系\n" +
                    "4. 设计角色对白特点\n" +
                    "5. 一次性优化所有角色内容\n" +
                    "6. 跳到下一个部分（固定选项）\n" +
                    "7. 优化所有架构内容\n" +
                    "8. 结束框架完善，切换到文字生成模式开始写作\n"
            },
            partial: false,
        }
        
        cline.toolManager.askFollowupQuestionTool(
            cline,
            continueQuestionBlock,
            askApproval,
            handleError,
            async (result: unknown) => {
                if (result && typeof result === "string") {
                    const continueChoice = result.trim()
                    
                    if (continueChoice.includes("1") || continueChoice.toLowerCase().includes("继续深入")) {
                        resolve('continue')
                    } else if (continueChoice.includes("2") || continueChoice.toLowerCase().includes("添加更多")) {
                        resolve('continue')
                    } else if (continueChoice.includes("3") || continueChoice.toLowerCase().includes("调整角色关系")) {
                        resolve('continue')
                    } else if (continueChoice.includes("4") || continueChoice.toLowerCase().includes("设计角色对白")) {
                        resolve('continue')
                    } else if (continueChoice.includes("5") || continueChoice.toLowerCase().includes("一次性优化所有角色")) {
                        // 一次性优化所有角色内容
                        pushToolResult("您选择了一次性优化所有角色内容。")
                        
                        // 处理一次性优化所有角色内容
                        const optimized = await optimizeAllCharacters(
                            cline, 
                            pushToolResult, 
                            currentContent,
                            fullPath,
                            frameworkContent,
                            characterSectionPosition
                        )
                        
                        resolve(optimized ? 'continue' : 'next')
                    } else if (continueChoice.includes("6") || continueChoice.toLowerCase().includes("跳到下一个")) {
                        // 跳到下一个部分（固定选项）
                        pushToolResult("您选择了跳到下一个部分。")
                        resolve('next')
                    } else if (continueChoice.includes("7") || continueChoice.toLowerCase().includes("优化所有架构")) {
                        // 优化所有架构内容
                        pushToolResult("您选择了优化所有架构内容。")
                        
                        // 返回特殊值请求执行优化所有部分步骤
                        resolve({
                            type: "optimize_all_sections",
                            message: "用户选择了优化所有架构内容"
                        })
                    } else if (continueChoice.includes("8") || continueChoice.toLowerCase().includes("结束框架")) {
                        // 用户选择结束框架完善
                        pushToolResult("您选择了结束框架完善。框架已保存。")
                        
                        // 询问是否切换到writer模式
                        await askSwitchToWriterMode(cline, askApproval, handleError, removeClosingTag, pushToolResult)
                        
                        resolve('complete')
                    } else {
                        // 默认情况
                        pushToolResult("未能识别您的选择，请重新选择。")
                        resolve('continue')
                    }
                } else {
                    resolve('next')
                }
            },
            removeClosingTag
        )
    })
}

/**
 * 一次性优化所有角色内容
 */
async function optimizeAllCharacters(
    cline: any,
    pushToolResult: any,
    currentContent: string,
    fullPath: string,
    frameworkContent: string,
    characterSectionPosition: any
): Promise<boolean> {
    try {
        // 准备系统提示
        const optimizeAllPrompt = `你是一位专业的小说角色设计专家。请全面优化以下角色设计内容，使其更加丰满、立体和有深度。
        
        请确保优化后的角色设计：
        1. 角色有清晰的动机和目标
        2. 角色有独特的性格特点和缺陷
        3. 主要角色之间有明确的关系和互动
        4. 角色设计支持故事的主题和情节发展
        5. 角色有成长和变化的潜力
        6. 角色对白和行为方式具有一致性
        7. 角色背景故事丰富且与主线相关
        8. 角色形象鲜明且易于识别
        
        以下是当前的角色设计内容：
        
        ${currentContent}
        
        请直接给出完整的优化后的Markdown格式角色设计内容，以"## 主要角色"开头。`;
        
        // 请求AI助手优化所有角色内容
        const optimizeResponse = await cline.ask("optimize_all_characters", optimizeAllPrompt, false)
        
        if (!optimizeResponse.text) {
            pushToolResult("未能生成有效的优化内容。")
            return false
        }
        
        // 提取优化后的内容
        let optimizedContent = optimizeResponse.text
        
        // 确保以"## 主要角色"开头
        if (!optimizedContent.includes("## 主要角色") && !optimizedContent.includes("## 角色设计") && !optimizedContent.includes("## 角色")) {
            optimizedContent = "## 主要角色\n\n" + optimizedContent
        }
        
        // 更新框架文件
        let updatedContent = prepareReplaceDiff(
            frameworkContent, 
            characterSectionPosition.startLine, 
            characterSectionPosition.endLine,
            optimizedContent
        )
        
        // 写入文件
        await updateFrameworkFile(fullPath, updatedContent)
        
        pushToolResult("已成功优化所有角色内容！")
        return true
    } catch (error) {
        pushToolResult(`优化过程中出错: ${(error as Error).message}`)
        return false
    }
}

/**
 * 询问是否切换到writer模式
 */
async function askSwitchToWriterMode(
    cline: any, 
    askApproval: any, 
    handleError: any, 
    removeClosingTag: any,
    pushToolResult: any
): Promise<void> {
    return new Promise((resolve) => {
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
        
        cline.toolManager.askFollowupQuestionTool(
            cline,
            switchQuestionBlock,
            askApproval,
            handleError,
            async (result: unknown) => {
                if (result && typeof result === "string") {
                    const switchChoice = result.trim()
                    
                    if (switchChoice.includes("1") || switchChoice.toLowerCase().includes("是")) {
                        // 使用switch_mode工具切换到writer模式
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
                    
                    resolve()
                } else {
                    resolve()
                }
            },
            removeClosingTag
        )
    })
} 