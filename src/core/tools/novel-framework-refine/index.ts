import * as path from "path"
import * as fs from "fs/promises"
import * as vscode from 'vscode'

import { formatResponse } from "../../prompts/responses"
import { RecordSource } from "../../context-tracking/FileContextTrackerTypes"
import { fileExistsAtPath } from "../../../utils/fs"
import { askFollowupQuestionTool } from "../askFollowupQuestionTool"
import { RefinementOption } from "./types"
import { analyzeFramework } from "./utils/analysis"
import { formatOptionsMessage, generateBasicFramework, displayFileContent } from "./utils/common"
import { handleGenreWorkflow } from "./workflows/genre"
import { handleCharacterWorkflow } from "./workflows/character"
import { handlePlotWorkflow } from "./workflows/plot"
import { handleWorldWorkflow } from "./workflows/world"
import { handleThemeWorkflow } from "./workflows/theme"
import { handleChapterOutlineWorkflow } from "./workflows/chapter-outline"
import { handleStyleWorkflow } from "./workflows/style"
import { handleWritingTechniqueWorkflow } from "./workflows/writing-technique"
import { handleMarketWorkflow } from "./workflows/market"
import { handleSystemWorkflow } from "./workflows/tech"
import { handleEmotionWorkflow } from "./workflows/emotion"
import { handleReflectionWorkflow } from "./workflows/reflection"
import { handlePlanWorkflow } from "./workflows/plan"
import { handleApiError, isFatalError, safeExecute } from './utils/error-handler'
import { handleChunkDemoWorkflow } from "./workflows/chunk-demo"
import { FrameworkStateManager } from "./state-manager"
import { WorkflowStepManager, StepParams } from "./workflow-steps"

// 导出主要的工具函数
export { handleGenreWorkflow } from "./workflows/genre"
export { handleCharacterWorkflow } from "./workflows/character"
export { handlePlotWorkflow } from "./workflows/plot"
export { handleWorldWorkflow } from "./workflows/world"
export { handleThemeWorkflow } from "./workflows/theme"
export { handleChapterOutlineWorkflow } from "./workflows/chapter-outline"
export { handleStyleWorkflow } from "./workflows/style"
export { handleWritingTechniqueWorkflow } from "./workflows/writing-technique"
export { handleMarketWorkflow } from "./workflows/market"
export { handleSystemWorkflow } from "./workflows/tech"
export { handleEmotionWorkflow } from "./workflows/emotion"
export { handleReflectionWorkflow } from "./workflows/reflection"
export { handlePlanWorkflow } from "./workflows/plan"

// 工作流映射表
export const workflowMap: Record<string, (params: any) => Promise<boolean>> = {
    'genre': handleGenreWorkflow,
    'character': handleCharacterWorkflow,
    'plot': handlePlotWorkflow,
    'world': handleWorldWorkflow,
    'theme': handleThemeWorkflow,
    'chapter-outline': handleChapterOutlineWorkflow,
    'style': handleStyleWorkflow,
    'writing-technique': handleWritingTechniqueWorkflow,
    'market': handleMarketWorkflow,
    'tech': handleSystemWorkflow,
    'emotion': handleEmotionWorkflow,
    'reflection': handleReflectionWorkflow,
    'plan': handlePlanWorkflow,
    'chunk-demo': handleChunkDemoWorkflow,
    'comprehensive': async () => true // 全面审查暂时返回成功
}

// 导出必要的函数，供workflow-steps.ts使用
export { checkEssentialSections, createGenericOption }

/**
 * 小说框架完善工具
 * 提供框架完善方向和内容选项，帮助用户选择需要完善的框架部分
 */
export async function novelFrameworkRefineTool(
    cline: any,
    block: any,
    askApproval: (message: string) => Promise<boolean>,
    handleError: (context: string, error: Error) => Promise<void>,
    pushToolResult: (message: string) => void,
    removeClosingTag: () => string,
) {
    try {
        pushToolResult('正在启动小说框架完善工具...')
        
        // 安全获取当前模式
        let currentMode = ''
        try {
            currentMode = await cline.get_current_mode()
        } catch (error) {
            pushToolResult(`获取当前模式时出错：${handleApiError(error)}。继续使用默认设置。`)
            currentMode = 'default'
        }
        
        if (currentMode !== "planner" && currentMode !== "") {
            await cline.say("text", "请先切换到小说框架模式(planner)再使用此工具。").catch(() => {})
            pushToolResult(formatResponse.toolError("此工具只能在小说框架模式下使用。"))
            return
        }

        // 提取参数
        const frameworkPath = block.params?.path || ""
        const targetArea = block.params?.area || "all" // 完善的目标区域：character, plot, world, theme, style, market, all
        const stepName = block.params?.step || "init" // 工作流步骤名称，默认为init

        // 如果是部分工具使用，直接返回
        if (block.partial) {
            return
        }

        // 初始化状态管理器
        const stateManager = FrameworkStateManager.getInstance()
        
        // 初始化工作流步骤管理器
        const stepManager = WorkflowStepManager.getInstance()
        
        // 获取或创建状态
        let state = stateManager.getState()
        if (!state) {
            state = stateManager.createState(frameworkPath)
        }
        
        // 更新状态
        state = stateManager.updateState({
            frameworkPath,
            currentStep: stepName
        })
        
        // 创建步骤参数
        const stepParams: StepParams = {
                    cline,
            frameworkPath,
            state,
                    askApproval,
                    handleError,
            pushToolResult,
                    removeClosingTag
        }
        
        // 执行工作流步骤
        const result = await stepManager.executeStep(state.currentStep, stepParams)
        
        // 更新状态
        if (result.stateUpdates) {
            stateManager.updateState(result.stateUpdates)
        }
        
        // 输出消息
        if (result.message) {
            pushToolResult(result.message)
        }
        
        // 如果工作流完成，清除状态
        if (result.completed) {
            await stateManager.clearState()
        }
        
            return
    } catch (error) {
        await handleError("执行小说框架完善工具时出错", error as Error)
        pushToolResult(formatResponse.toolError(`执行过程中出错: ${handleApiError(error)}`))
    }
}

/**
 * 检查框架中是否包含所有基本部分
 */
function checkEssentialSections(content: string): { 
    allSectionsExist: boolean, 
    existingSections: string[],
    missingSections: string[]
} {
    const essentialSections = [
        { name: "小说题材", patterns: ["## 小说题材", "## 题材", "## 类型"] },
        { name: "角色设计", patterns: ["## 主要角色", "## 角色设计", "## 角色"] },
        { name: "情节与大纲", patterns: ["## 故事大纲", "## 主要情节线", "## 情节", "## 大纲"] },
        { name: "世界观", patterns: ["## 世界观", "## 世界观设定", "## 世界设定"] },
        { name: "主题元素", patterns: ["## 主题", "## 主题元素", "## 题材"] },
        { name: "叙事风格", patterns: ["## 叙事风格", "## 叙事视角", "## 视角设计"] },
        { name: "章节规划", patterns: ["## 章节规划", "## 章节大纲", "## 章节设计"] },
        { name: "市场定位", patterns: ["## 市场定位", "## 目标读者", "## 市场分析"] },
        { name: "创作计划", patterns: ["## 创作计划", "## 写作计划", "## 进度规划"] },
        { name: "系统设定", patterns: ["## 系统设定", "## 特殊系统", "## 世界规则", "## 修仙系统", "## 武功系统"] },
        { name: "情感设计", patterns: ["## 情感设计", "## 情感元素", "## 情感架构"] },
        { name: "自我反思", patterns: ["## 自我反思", "## 创作反思", "## 写作挑战"] },
        { name: "写作手法", patterns: ["## 写作手法", "## 叙事技巧", "## 表达技法"] }
    ]
    
    const existingSections: string[] = []
    const missingSections: string[] = []
    
    for (const section of essentialSections) {
        const exists = section.patterns.some(pattern => content.includes(pattern))
        if (exists) {
            existingSections.push(section.name)
        } else {
            missingSections.push(section.name)
        }
    }
    
    return {
        allSectionsExist: missingSections.length === 0,
        existingSections,
        missingSections
    }
}

/**
 * 为没有具体选项的区域创建通用选项
 */
function createGenericOption(area: string, areaName: string): RefinementOption {
    switch (area) {
        case "genre":
            return {
                id: "add_genre",
                area: "genre",
                title: "添加小说题材",
                description: "选择和设计小说的题材类型（如修仙、武侠、科幻等）"
            }
        case "character":
            return {
                id: "add_characters",
                area: "character",
                title: "添加角色设计",
                description: "创建主要角色、配角和反派的基本设定"
            }
        case "plot":
            return {
                id: "add_plot",
                area: "plot",
                title: "添加情节大纲",
                description: "设计故事的主要情节线和发展脉络"
            }
        case "chapter-outline":
            return {
                id: "add_chapter_outline",
                area: "chapter-outline",
                title: "添加章节规划",
                description: "规划小说的章节结构和内容分布"
            }
        case "world":
            return {
                id: "add_world",
                area: "world",
                title: "添加世界观设定",
                description: "创建故事发生的世界背景和基本规则"
            }
        case "theme":
            return {
                id: "add_themes",
                area: "theme",
                title: "添加主题元素",
                description: "确定小说要探讨的核心主题和思想"
            }
        case "style":
            return {
                id: "add_style",
                area: "style",
                title: "添加叙事风格",
                description: "设定小说的叙事视角和语言风格"
            }
        case "market":
            return {
                id: "add_market",
                area: "market",
                title: "添加市场定位",
                description: "分析目标读者群体和市场竞争情况"
            }
        case "plan":
            return {
                id: "add_plan",
                area: "plan",
                title: "添加创作计划",
                description: "制定写作进度和里程碑计划"
            }
        case "tech":
            return {
                id: "add_system",
                area: "tech",
                title: "添加系统设定",
                description: "设计小说中的特殊系统和世界规则"
            }
        case "emotion":
            return {
                id: "add_emotion",
                area: "emotion",
                title: "添加情感设计",
                description: "规划故事的情感发展和冲突"
            }
        case "reflection":
            return {
                id: "add_reflection",
                area: "reflection",
                title: "添加自我反思",
                description: "思考创作过程中的挑战和成长"
            }
        case "writing-technique":
            return {
                id: "add_writing_technique",
                area: "writing-technique",
                title: "添加写作手法",
                description: "规划使用的描写技巧、对话设计和特殊表现手法"
            }
        default:
            return {
                id: `add_${area}`,
                area: area,
                title: `添加${areaName}`,
                description: `完善${areaName}相关内容`
            }
    }
}

/**
 * 询问用户是否要切换到writer模式开始写作
 */
async function askSwitchToWriterMode(
    cline: any,
    askApproval: (message: string) => Promise<boolean>,
    handleError: (context: string, error: Error) => Promise<void>,
    pushToolResult: (message: string) => void,
    removeClosingTag: () => string
): Promise<void> {
    try {
        // 创建一个用于ask_followup_question的工具使用块
        const followupBlock = {
            type: "tool_use" as const,
            name: "ask_followup_question" as const,
            params: {
                question: "您的框架已经完成了。是否要切换到文字生成模式开始写作？\n\n1. 是，开始写作\n2. 否，继续完善框架",
            },
            partial: false,
        }

            await askFollowupQuestionTool(
                cline,
                followupBlock,
                askApproval,
                handleError,
                async (result: unknown) => {
                    if (result && typeof result === "string") {
                    const choice = result.trim()
                    
                    if (choice.includes("1") || choice.toLowerCase().includes("是") || choice.toLowerCase().includes("开始写作")) {
                        await switchToWriterMode(cline, handleError, pushToolResult)
                        } else {
                        pushToolResult("您选择继续完善框架。您可以随时使用novel_framework_refine工具继续完善框架。")
                    }
                }
            },
                removeClosingTag
            )
    } catch (error) {
        handleError("asking switch to writer mode", error as Error)
    }
}

/**
 * 切换到writer模式
 */
async function switchToWriterMode(
    cline: any,
    handleError: (context: string, error: Error) => Promise<void>,
    pushToolResult: (message: string) => void
): Promise<void> {
    try {
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
        
        // 直接调用cline的递归请求方法执行模式切换
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
    } catch (error) {
        handleError("switching to writer mode", error as Error)
    }
}

/**
 * 处理用户选择的完善选项
 */
async function processOption(
    option: RefinementOption, 
    frameworkContent: string, 
    frameworkPath: string,
    cline: any,
    askApproval: (message: string) => Promise<boolean>,
    handleError: (context: string, error: Error) => Promise<void>,
    pushToolResult: (message: string) => void,
    removeClosingTag: () => string
): Promise<void> {
    const workflowParams = {
        cline, 
        frameworkPath, 
        frameworkContent, 
        askApproval, 
        handleError: (error: any) => handleError("refining framework", error as Error),
        pushToolResult, 
        removeClosingTag
    };
    
    let workflowSucceeded = false;
    
    switch (option.id) {
        // 小说题材相关选项
        case "genre_type":
        case "genre_uniqueness":
        case "genre_rules":
        case "genre_fusion":
        case "add_genre_section":
            workflowSucceeded = await handleGenreWorkflow(workflowParams)
            break
            
        // 角色相关选项
        case "character_detail":
        case "character_relations":
        case "character_voice":
        case "add_characters":
            workflowSucceeded = await handleCharacterWorkflow(workflowParams)
            break
            
        // 情节相关选项
        case "plot_timeline":
        case "plot_structure":
        case "subplots":
        case "add_plot":
            workflowSucceeded = await handlePlotWorkflow(workflowParams)
            break
            
        // 章节大纲相关选项
        case "chapter_outline":
        case "add_chapter_outline":
            workflowSucceeded = await handleChapterOutlineWorkflow(workflowParams)
            break
            
        // 世界观相关选项
        case "world_society":
        case "world_geography":
        case "world_history":
        case "world_culture":
        case "add_world":
            workflowSucceeded = await handleWorldWorkflow(workflowParams)
            break
            
        // 主题相关选项
        case "theme_core":
        case "theme_symbols":
        case "add_theme_section":
        case "add_themes":
            workflowSucceeded = await handleThemeWorkflow(workflowParams)
            break

        // 叙事风格相关选项
        case "add_narrative_perspective":
        case "perspective_switching":
        case "add_writing_style":
        case "rhetoric_techniques":
        case "add_pacing":
        case "add_style":
            workflowSucceeded = await handleStyleWorkflow(workflowParams)
            break

        // 市场定位相关选项
        case "add_market_positioning":
        case "target_readers":
        case "competitive_analysis":
        case "add_multimedia_adaptation":
        case "add_market":
            workflowSucceeded = await handleMarketWorkflow(workflowParams)
            break
            
        // 创作计划相关选项
        case "add_creation_plan":
        case "writing_schedule":
        case "writing_milestones":
        case "add_plan":
            workflowSucceeded = await handlePlanWorkflow(workflowParams)
            break
            
        // 系统设定相关选项
        case "system_core_rules":
        case "system_levels":
        case "system_abilities":
        case "system_limitations":
        case "add_system":
            workflowSucceeded = await handleSystemWorkflow(workflowParams)
            break
            
        // 情感设计相关选项
        case "add_emotional_design":
        case "emotional_conflicts":
        case "emotional_pacing":
        case "add_emotion":
            workflowSucceeded = await handleEmotionWorkflow(workflowParams)
            break
            
        // 自我反思相关选项
        case "add_self_reflection":
        case "creative_challenges":
        case "growth_goals":
        case "add_reflection":
            workflowSucceeded = await handleReflectionWorkflow(workflowParams)
            break
            
        // 写作手法相关选项
        case "description_techniques":
        case "dialogue_design":
        case "pacing_control":
        case "special_techniques":
        case "add_writing_technique_section":
            workflowSucceeded = await handleWritingTechniqueWorkflow(workflowParams)
            break
            
        // 综合评估选项
        case "comprehensive_review":
            pushToolResult(`正在对整个框架进行全面审查...`)
            // 这里可以添加综合评估的逻辑
            pushToolResult(`暂不支持综合评估功能，将在后续版本中添加。`)
            break
            
        // 分块生成示例
        case "chunk-demo":
            workflowSucceeded = await handleChunkDemoWorkflow(workflowParams)
            break
            
        default:
            pushToolResult(`暂不支持 ${option.id} 选项的处理。`)
            break
    }
    
    // 如果工作流成功完成并保存了内容，继续下一步
    if (workflowSucceeded) {
        await handleNextStep(
            cline,
            frameworkPath,
            frameworkContent,
            askApproval,
            handleError,
            pushToolResult,
            removeClosingTag
        )
    }
}

/**
 * 处理创建新框架的流程
 */
async function handleCreateNewFramework(
    cline: any,
    askApproval: (message: string) => Promise<boolean>,
    handleError: (context: string, error: Error) => Promise<void>,
    pushToolResult: (message: string) => void,
    removeClosingTag: () => string
): Promise<void> {
    try {
        // 询问框架文件路径
        const pathQuestion = {
            type: "tool_use" as const,
            name: "ask_followup_question" as const,
            params: {
                question: "请输入新框架文件的路径 (例如：novel-framework.md 或 frameworks/my-novel.md)："
            },
            partial: false,
        }
        
        let frameworkPath = ""
        
        await askFollowupQuestionTool(
            cline,
            pathQuestion,
            askApproval,
            handleError,
            async (result: unknown) => {
                if (result && typeof result === "string") {
                    frameworkPath = result.trim()
                }
            },
            removeClosingTag
        )
        
        if (!frameworkPath) {
            pushToolResult("未提供有效的文件路径，取消创建框架文件。")
            return
        }
        
        // 如果路径没有.md扩展名，添加它
        if (!frameworkPath.toLowerCase().endsWith('.md')) {
            frameworkPath += '.md'
        }
        
        // 获取工作区根路径
        const rootPath = cline.cwd
        
        // 构建完整文件路径
        const fullPath = path.isAbsolute(frameworkPath) ? frameworkPath : path.join(rootPath, frameworkPath)
        
        // 检查文件是否已存在
        if (await fileExistsAtPath(fullPath)) {
            const overwriteQuestion = {
                type: "tool_use" as const,
                name: "ask_followup_question" as const,
                params: {
                    question: `文件 "${frameworkPath}" 已存在。是否要覆盖它？\n\n1. 是，覆盖文件\n2. 否，取消操作`
                },
                partial: false,
            }
            
            let shouldOverwrite = false
            
            await askFollowupQuestionTool(
                cline,
                overwriteQuestion,
                askApproval,
                handleError,
                async (result: unknown) => {
                    if (result && typeof result === "string") {
                        shouldOverwrite = result.includes("是") || result.includes("覆盖")
                    }
                },
                removeClosingTag
            )
            
            if (!shouldOverwrite) {
                pushToolResult("已取消创建框架文件。")
                return
            }
        }
        
        // 创建框架文件
        await createFrameworkFile(cline, frameworkPath, fullPath, askApproval, handleError, pushToolResult, removeClosingTag)
    } catch (error) {
        handleError("creating new framework", error as Error)
    }
}

/**
 * 创建框架文件
 */
async function createFrameworkFile(
    cline: any,
    frameworkPath: string,
    fullPath: string,
    askApproval: (message: string) => Promise<boolean>,
    handleError: (context: string, error: Error) => Promise<void>,
    pushToolResult: (message: string) => void,
    removeClosingTag: () => string
): Promise<void> {
    try {
        // 询问小说标题
        const titleQuestion = {
            type: "tool_use" as const,
            name: "ask_followup_question" as const,
            params: {
                question: "请输入小说标题："
            },
            partial: false,
        }
        
        let title = ""
        
        await askFollowupQuestionTool(
            cline,
            titleQuestion,
            askApproval,
            handleError,
            async (result: unknown) => {
                if (result && typeof result === "string") {
                    title = result.trim()
                }
                return true;
            },
            removeClosingTag
        )
        
        if (!title) {
            title = "未命名小说"
        }
        
        // 询问小说概念
        const conceptQuestion = {
            type: "tool_use" as const,
            name: "ask_followup_question" as const,
            params: {
                question: "请简要描述小说的核心概念："
            },
            partial: false,
        }
        
        let concept = ""
        
        await askFollowupQuestionTool(
            cline,
            conceptQuestion,
            askApproval,
            handleError,
            async (result: unknown) => {
                if (result && typeof result === "string") {
                    concept = result.trim()
                }
                return true;
            },
            removeClosingTag
        )
        
        if (!concept) {
            concept = "待补充"
        }
        
        // 生成基础框架内容
        const frameworkContent = generateBasicFramework(title, concept)
        
        // 确保目录存在
        const dirPath = path.dirname(fullPath)
        await fs.mkdir(dirPath, { recursive: true })
        
        // 写入文件
        await fs.writeFile(fullPath, frameworkContent, "utf8")
        
        // 记录文件访问
        await cline.fileContextTracker.trackFileContext(fullPath, "roo_write" as RecordSource)
        
        // 通知用户文件已创建并保存
        pushToolResult(`已成功创建框架文件: ${frameworkPath}`)
        
        // 打开文件供用户查看和编辑
        try {
            await cline.vscode.postMessage({
                type: "openFile",
                path: fullPath
            });
            pushToolResult(`已打开框架文件供您查看和编辑。`)
        } catch (error) {
            pushToolResult(`文件已创建，但无法自动打开。您可以手动打开 ${frameworkPath} 进行查看和编辑。`)
        }
        
        // 询问是否需要进一步修改或完善
        const continueQuestion = {
            type: "tool_use" as const,
            name: "ask_followup_question" as const,
            params: {
                question: "框架已创建并保存为文件，包含了所有13个标准部分的基础内容。您希望接下来做什么？\n\n" +
                          "1. 修改某个特定部分\n" +
                          "2. 使用分块生成模式（适合长内容）\n" +
                          "3. 将此框架设置为全局规则文件\n" +
                          "0. 暂不修改，稍后再做"
            },
            partial: false,
        }
        
        await askFollowupQuestionTool(
            cline,
            continueQuestion,
            askApproval,
            handleError,
            async (result: unknown) => {
                if (result && typeof result === "string") {
                    // 根据用户选择执行相应的操作
                    const choice = result.trim()
                    
                    if (choice.includes("1") || choice.includes("修改")) {
                        // 询问用户想修改哪个部分
                        const modifyQuestion = {
                            type: "tool_use" as const,
                            name: "ask_followup_question" as const,
                            params: {
                                question: "您想修改哪个部分？\n\n" +
                                          "1. 小说题材\n" +
                                          "2. 章节划分\n" +
                                          "3. 主要角色\n" +
                                          "4. 世界观设定\n" +
                                          "5. 情节线索\n" +
                                          "6. 关键场景\n" +
                                          "7. 潜在冲突\n" +
                                          "8. 主题探索\n" +
                                          "9. 写作风格\n" +
                                          "10. 市场定位\n" +
                                          "11. 创作目标\n" +
                                          "12. 参考作品\n" +
                                          "13. 注意事项"
                            },
                            partial: false,
                        }
                        
                        await askFollowupQuestionTool(
                            cline,
                            modifyQuestion,
                            askApproval,
                            handleError,
                            async (areaResult: unknown) => {
                                if (areaResult && typeof areaResult === "string") {
                                    const areaChoice = areaResult.trim()
                                    // 读取最新的框架内容
                                    const updatedContent = await fs.readFile(fullPath, "utf8")
                                    
                                    // 根据用户选择的区域创建选项
                                    let option: RefinementOption | null = null
                                    
                                    if (areaChoice.includes("1") || areaChoice.includes("题材")) {
                                        option = createGenericOption("genre", "小说题材")
                                    } else if (areaChoice.includes("2") || areaChoice.includes("章节")) {
                                        option = createGenericOption("chapter-outline", "章节划分")
                                    } else if (areaChoice.includes("3") || areaChoice.includes("角色")) {
                                        option = createGenericOption("character", "主要角色")
                                    } else if (areaChoice.includes("4") || areaChoice.includes("世界")) {
                                        option = createGenericOption("world", "世界观设定")
                                    } else if (areaChoice.includes("5") || areaChoice.includes("情节")) {
                                        option = createGenericOption("plot", "情节线索")
                                    } else if (areaChoice.includes("6") || areaChoice.includes("场景")) {
                                        option = {
                                            id: "key_scenes",
                                            area: "plot",
                                            title: "完善关键场景",
                                            description: "详细描述故事中的关键场景"
                                        }
                                    } else if (areaChoice.includes("7") || areaChoice.includes("冲突")) {
                                        option = {
                                            id: "conflicts",
                                            area: "plot",
                                            title: "完善潜在冲突",
                                            description: "深入探讨故事中的冲突元素"
                                        }
                                    } else if (areaChoice.includes("8") || areaChoice.includes("主题")) {
                                        option = createGenericOption("theme", "主题探索")
                                    } else if (areaChoice.includes("9") || areaChoice.includes("风格")) {
                                        option = createGenericOption("style", "写作风格")
                                    } else if (areaChoice.includes("10") || areaChoice.includes("市场")) {
                                        option = createGenericOption("market", "市场定位")
                                    } else if (areaChoice.includes("11") || areaChoice.includes("创作目标")) {
                                        option = createGenericOption("plan", "创作目标")
                                    } else if (areaChoice.includes("12") || areaChoice.includes("参考")) {
                                        option = {
                                            id: "references",
                                            area: "reflection",
                                            title: "完善参考作品",
                                            description: "补充更多参考作品及其影响"
                                        }
                                    } else if (areaChoice.includes("13") || areaChoice.includes("注意")) {
                                        option = {
                                            id: "notes",
                                            area: "reflection",
                                            title: "完善注意事项",
                                            description: "补充更多创作注意事项"
                                        }
                                    }
                                    
                                    if (option) {
                                        // 直接处理选项，不再嵌套调用handleNextStep
                                        await processOption(
                                            option,
                                            updatedContent,
                                            frameworkPath,
                                            cline,
                                            askApproval,
                                            handleError,
                                            pushToolResult,
                                            removeClosingTag
                                        )
                                    }
                                }
                                return true;
                            },
                            removeClosingTag
                        )
                    }
                    else if (choice.includes("2") || choice.includes("分块") || choice.includes("模板")) {
                        // 读取最新的框架内容
                        const updatedContent = await fs.readFile(fullPath, "utf8")
                        
                        // 启动分块生成模式
                        const workflowParams = {
                            cline,
                            frameworkPath,
                            frameworkContent: updatedContent,
                            askApproval,
                            handleError: (error: any) => handleError("chunk generation", error as Error),
                            pushToolResult,
                            removeClosingTag
                        }
                        
                        await handleChunkDemoWorkflow(workflowParams)
                    }
                    else if (choice.includes("3") || choice.includes("全局") || choice.includes("规则")) {
                        // 将框架设置为全局规则文件
                        try {
                            await cline.vscode.postMessage({
                                type: "activateNovelFramework",
                                path: frameworkPath
                            });
                            pushToolResult(`已将 ${frameworkPath} 设置为全局规则文件。`)
                        } catch (error) {
                            pushToolResult(`无法自动设置为全局规则文件。您可以在聊天界面使用"设为框架"按钮手动设置。`)
                        }
                    }
                    else {
                        pushToolResult("您可以随时使用小说框架完善工具来继续修改和完善框架。")
                    }
                }
                return true;
            },
            removeClosingTag
        )
    } catch (error) {
        await handleError("creating framework file", error as Error)
        pushToolResult(formatResponse.toolError(`创建框架文件时出错: ${error}`))
    }
}

/**
 * 处理工作流完成后的下一步操作
 */
async function handleNextStep(
    cline: any,
    frameworkPath: string,
    frameworkContent: string,
    askApproval: (message: string) => Promise<boolean>,
    handleError: (context: string, error: Error) => Promise<void>,
    pushToolResult: (message: string) => void,
    removeClosingTag: () => string
): Promise<void> {
    try {
        pushToolResult('框架已更新，正在分析当前进度...')
        
        // 读取最新的框架内容
        const fullPath = path.isAbsolute(frameworkPath) ? frameworkPath : path.join(cline.cwd, frameworkPath)
        const updatedContent = await fs.readFile(fullPath, "utf8")
        
        // 显示更新后的文件内容
        await displayFileContent(cline, frameworkPath, pushToolResult)
        
        // 检查基本框架元素是否都已存在
        const essentialSections = checkEssentialSections(updatedContent)
        
        // 区域名称映射
        const areaNames: {[key: string]: string} = {
            character: "角色设计",
            plot: "情节与大纲",
            "chapter-outline": "章节规划",
            world: "世界观",
            theme: "主题元素", 
            style: "叙事风格",
            market: "市场定位",
            plan: "创作计划",
            tech: "系统设定",
            emotion: "情感设计",
            reflection: "自我反思",
            "writing-technique": "写作手法",
            "genre": "小说题材"
        }
        
        // 标准区域顺序
        const standardOrder = [
            'genre', 'character', 'plot', 'world', 'theme', 
            'chapter-outline', 'style', 'writing-technique', 'market', 
            'tech', 'emotion', 'reflection', 'plan'
        ]
        
        // 获取所有缺失的部分
        const missingAreas = standardOrder.filter(area => 
            !essentialSections.existingSections.includes(areaNames[area])
        )
        
        // 构建选项消息
        let message = ""
        
        // 提示缺失部分（如果有）
        if (missingAreas.length > 0) {
            message = `您的框架还缺少这些部分：${missingAreas.map(area => areaNames[area]).join("、")}。\n\n`
                    } else {
            message = `您已完成所有基本框架部分。\n\n`
        }
        
        message += `您希望接下来做什么？\n\n`
        
        // 构建选项列表
        let options = []
        
        // 如果有缺失部分，添加完善缺失部分的选项
        if (missingAreas.length > 0) {
            options.push(`1. 添加缺失部分（${missingAreas.map(area => areaNames[area]).join("、")}）`)
        }
        
        // 添加其他常用选项
        const nextOptionIndex = options.length + 1
        options.push(`${nextOptionIndex}. 修改现有部分`)
        options.push(`${nextOptionIndex + 1}. 使用分块生成模式（适合长内容）`)
        options.push(`${nextOptionIndex + 2}. 对整个框架进行全面审查`)
        options.push(`${nextOptionIndex + 3}. 结束框架完善，切换到文字生成模式开始写作`)
        
        // 将选项添加到消息中
        message += options.join("\n")
        message += "\n\n请选择操作（输入对应的序号或直接描述您的需求）："
        
        // 创建一个用于ask_followup_question的工具使用块
        const followupBlock = {
            type: "tool_use" as const,
            name: "ask_followup_question" as const,
            params: {
                question: message,
            },
            partial: false,
        }
        
        // 调用askFollowupQuestionTool
        await askFollowupQuestionTool(
                            cline,
            followupBlock,
            askApproval,
            handleError,
            async (result: unknown) => {
                if (result && typeof result === "string") {
                    const choice = result.trim().toLowerCase()
                    
                    // 检查用户是否在请求中指定了特定区域
                    let userSpecifiedArea = null
                    for (const area in areaNames) {
                        if (choice.includes(areaNames[area].toLowerCase())) {
                            userSpecifiedArea = area
                            break
                        }
                    }
                    
                    // 处理用户选择
                    // 1. 添加缺失部分
                    if ((missingAreas.length > 0 && choice.includes("1")) || choice.includes("缺失") || choice.includes("添加缺失")) {
                        // 如果用户指定了特定区域，优先处理该区域
                        if (userSpecifiedArea && missingAreas.includes(userSpecifiedArea)) {
                            const genericOption = createGenericOption(userSpecifiedArea, areaNames[userSpecifiedArea])
                            await processOption(
                                genericOption,
                                updatedContent,
                            frameworkPath,
                                cline,
                            askApproval,
                            handleError,
                            pushToolResult,
                            removeClosingTag
                        )
                        } 
                        // 否则，询问用户想要添加哪个缺失部分
                        else {
                            const missingQuestion = {
                                type: "tool_use" as const,
                                name: "ask_followup_question" as const,
                                params: {
                                    question: `您想要添加哪个缺失部分？\n\n${missingAreas.map((area, index) => 
                                        `${index + 1}. ${areaNames[area]}`).join("\n")}\n\n请选择（输入序号或名称）：`
                                },
                                partial: false,
                            }
                            
                            await askFollowupQuestionTool(
                                cline,
                                missingQuestion,
                                askApproval,
                                handleError,
                                async (missingResult: unknown) => {
                                    if (missingResult && typeof missingResult === "string") {
                                        const missingChoice = missingResult.trim().toLowerCase()
                                        
                                        // 确定用户选择的区域
                                        let selectedArea = null
                                        
                                        // 通过序号选择
                                        const numberMatch = missingChoice.match(/^\d+/)
                                        if (numberMatch) {
                                            const index = parseInt(numberMatch[0]) - 1
                                            if (index >= 0 && index < missingAreas.length) {
                                                selectedArea = missingAreas[index]
                                            }
                                        }
                                        
                                        // 通过名称选择
                                        if (!selectedArea) {
                                            for (const area of missingAreas) {
                                                if (missingChoice.includes(areaNames[area].toLowerCase())) {
                                                    selectedArea = area
                                                    break
                                                }
                                            }
                                        }
                                        
                                        // 如果找到了选择的区域，处理它
                                        if (selectedArea) {
                                            const genericOption = createGenericOption(selectedArea, areaNames[selectedArea])
                                            await processOption(
                                                genericOption,
                                                updatedContent,
                                                frameworkPath,
                                                cline,
                                                askApproval,
                                                handleError,
                                                pushToolResult,
                                                removeClosingTag
                                            )
                                        } else {
                                            pushToolResult("未能识别您选择的区域，请重新尝试。")
                                        }
                                    }
                                },
                                removeClosingTag
                            )
                        }
                    }
                    // 修改现有部分
                    else if (choice.includes(`${missingAreas.length > 0 ? 2 : 1}`) || choice.includes("修改") || userSpecifiedArea) {
                        // 如果用户已经指定了区域，直接处理
                        if (userSpecifiedArea) {
                            const options = analyzeFramework(updatedContent)
                            const areaOptions = options.filter(option => option.area === userSpecifiedArea)
                            
                            if (areaOptions.length > 0) {
                                await processOption(
                                    areaOptions[0],
                                    updatedContent,
                                    frameworkPath,
                                    cline,
                                    askApproval,
                                    handleError,
                                    pushToolResult,
                                    removeClosingTag
                                )
                            } else {
                                const genericOption = createGenericOption(userSpecifiedArea, areaNames[userSpecifiedArea])
                                await processOption(
                                    genericOption,
                                    updatedContent,
                                    frameworkPath,
                                    cline,
                                    askApproval,
                                    handleError,
                                    pushToolResult,
                                    removeClosingTag
                                )
                            }
                        }
                        // 否则，询问用户想要修改哪个部分
                        else {
                            const existingAreas = standardOrder.filter(area => 
                                essentialSections.existingSections.includes(areaNames[area])
                            )
                            
                            const modifyQuestion = {
                                type: "tool_use" as const,
                                name: "ask_followup_question" as const,
                                params: {
                                    question: `您想要修改哪个现有部分？\n\n${existingAreas.map((area, index) => 
                                        `${index + 1}. ${areaNames[area]}`).join("\n")}\n\n请选择（输入序号或名称）：`
                                },
                                partial: false,
                            }
                            
                            await askFollowupQuestionTool(
                                cline,
                                modifyQuestion,
                                askApproval,
                                handleError,
                                async (modifyResult: unknown) => {
                                    if (modifyResult && typeof modifyResult === "string") {
                                        const modifyChoice = modifyResult.trim().toLowerCase()
                                        
                                        // 确定用户选择的区域
                                        let selectedArea = null
                                        
                                        // 通过序号选择
                                        const numberMatch = modifyChoice.match(/^\d+/)
                                        if (numberMatch) {
                                            const index = parseInt(numberMatch[0]) - 1
                                            if (index >= 0 && index < existingAreas.length) {
                                                selectedArea = existingAreas[index]
                                            }
                                        }
                                        
                                        // 通过名称选择
                                        if (!selectedArea) {
                                            for (const area of existingAreas) {
                                                if (modifyChoice.includes(areaNames[area].toLowerCase())) {
                                                    selectedArea = area
                                                    break
                                                }
                                            }
                                        }
                                        
                                        // 如果找到了选择的区域，处理它
                                        if (selectedArea) {
                                            const options = analyzeFramework(updatedContent)
                                            const areaOptions = options.filter(option => option.area === selectedArea)
                                            
                                            if (areaOptions.length > 0) {
                                                await processOption(
                                                    areaOptions[0],
                                                    updatedContent,
                                                    frameworkPath,
                                                    cline,
                                                    askApproval,
                                                    handleError,
                                                    pushToolResult,
                                                    removeClosingTag
                                                )
                                            } else {
                                                const genericOption = createGenericOption(selectedArea, areaNames[selectedArea])
                                                await processOption(
                                                    genericOption,
                                                    updatedContent,
                                                    frameworkPath,
                                                    cline,
                                                    askApproval,
                                                    handleError,
                                                    pushToolResult,
                                                    removeClosingTag
                                                )
                                            }
                                        } else {
                                            pushToolResult("未能识别您选择的区域，请重新尝试。")
                                        }
                                    }
                                },
                                removeClosingTag
                            )
                        }
                    }
                    // 使用分块生成模式
                    else if (choice.includes(`${missingAreas.length > 0 ? 3 : 2}`) || choice.includes("分块") || choice.includes("模板")) {
                        const workflowParams = {
                            cline,
                            frameworkPath,
                            frameworkContent: updatedContent,
                            askApproval,
                            handleError: (error: any) => handleError("chunk generation", error as Error),
                            pushToolResult,
                            removeClosingTag
                        }
                        
                        await handleChunkDemoWorkflow(workflowParams)
                    }
                    // 全面审查
                    else if (choice.includes(`${missingAreas.length > 0 ? 4 : 3}`) || choice.includes("全面") || choice.includes("审查")) {
                        // 创建全面审查选项
                        const comprehensiveOption = {
                            id: "comprehensive_review",
                            area: "comprehensive",
                            title: "全面审查框架",
                            description: "对整个框架进行全面审查和优化"
                        }
                        
                        await processOption(
                            comprehensiveOption,
                            updatedContent,
                            frameworkPath,
                            cline,
                            askApproval,
                            handleError,
                            pushToolResult,
                            removeClosingTag
                        )
                    }
                    // 切换到写作模式
                    else if (choice.includes(`${missingAreas.length > 0 ? 5 : 4}`) || choice.includes("结束") || choice.includes("写作") || choice.includes("切换")) {
                        await askSwitchToWriterMode(
                            cline,
                            askApproval,
                            handleError,
                            pushToolResult,
                            removeClosingTag
                        )
                    }
                    else {
                        pushToolResult("未能识别您的选择，请重新尝试或使用提供的选项。")
                    }
                }
            },
            removeClosingTag
        )
    } catch (error) {
        handleError("handling next step", error as Error)
    }
} 