import * as fs from "fs/promises"
import * as path from "path"
import { RefinementOption } from "./types"
import { FrameworkState, FrameworkStateManager } from "./state-manager"
import { analyzeFramework } from "./utils/analysis"
import { formatOptionsMessage, displayFileContent } from "./utils/common"
import { askFollowupQuestionTool } from "../askFollowupQuestionTool"

// 从index.ts中导入需要的函数和类型
// 注意：这些函数需要在index.ts中导出
interface EssentialSectionsResult {
    allSectionsExist: boolean
    existingSections: string[]
    missingSections: string[]
}

/**
 * 工作流步骤处理函数类型
 */
export type StepHandler = (
    params: StepParams
) => Promise<StepResult>

/**
 * 工作流步骤参数
 */
export interface StepParams {
    cline: any
    frameworkPath: string
    state: FrameworkState
    askApproval: (message: string) => Promise<boolean>
    handleError: (context: string, error: Error) => Promise<void>
    pushToolResult: (message: string) => void
    removeClosingTag: () => string
}

/**
 * 工作流步骤结果
 */
export interface StepResult {
    nextStep: string
    message?: string
    stateUpdates?: Partial<FrameworkState>
    completed?: boolean
}

/**
 * 工作流步骤管理器
 * 负责定义和处理工作流的各个步骤
 */
export class WorkflowStepManager {
    private static instance: WorkflowStepManager
    private _steps: Map<string, StepHandler> = new Map()
    private _stateManager: FrameworkStateManager
    
    /**
     * 获取工作流步骤管理器实例（单例模式）
     */
    public static getInstance(): WorkflowStepManager {
        if (!WorkflowStepManager.instance) {
            WorkflowStepManager.instance = new WorkflowStepManager()
        }
        return WorkflowStepManager.instance
    }
    
    /**
     * 构造函数
     */
    private constructor() {
        this._stateManager = FrameworkStateManager.getInstance()
        this.registerSteps()
    }
    
    /**
     * 注册所有工作流步骤
     */
    private registerSteps(): void {
        // 初始化步骤
        this._steps.set("init", this.handleInitStep)
        
        // 分析框架步骤
        this._steps.set("analyze", this.handleAnalyzeStep)
        
        // 显示选项步骤
        this._steps.set("show_options", this.handleShowOptionsStep)
        
        // 处理用户选择步骤
        this._steps.set("process_choice", this.handleProcessChoiceStep)
        
        // 处理工作流步骤
        this._steps.set("execute_workflow", this.handleExecuteWorkflowStep)
        
        // 显示下一步选项步骤
        this._steps.set("next_step", this.handleNextStepOptionsStep)
        
        // 完成步骤
        this._steps.set("complete", this.handleCompleteStep)
    }
    
    /**
     * 执行工作流步骤
     * @param stepName 步骤名称
     * @param params 步骤参数
     * @returns 步骤执行结果
     */
    public async executeStep(stepName: string, params: StepParams): Promise<StepResult> {
        const handler = this._steps.get(stepName)
        
        if (!handler) {
            throw new Error(`未知的工作流步骤: ${stepName}`)
        }
        
        try {
            return await handler(params)
        } catch (error) {
            await params.handleError(`执行工作流步骤 ${stepName} 时出错`, error as Error)
            
            // 返回错误结果
            return {
                nextStep: "complete",
                message: `执行工作流步骤时出错: ${(error as Error).message}`,
                completed: true
            }
        }
    }
    
    /**
     * 初始化步骤
     * 检查框架文件是否存在，如果不存在则创建新框架
     */
    private handleInitStep = async (params: StepParams): Promise<StepResult> => {
        const { cline, frameworkPath, pushToolResult } = params
        
        pushToolResult('正在初始化小说框架完善工具...')
        
        // 获取工作区根路径
        const rootPath = cline.cwd || process.cwd()
        
        // 构建完整文件路径
        const fullPath = path.isAbsolute(frameworkPath) ? frameworkPath : path.join(rootPath, frameworkPath)
        
        // 检查文件是否存在
        let fileExists = false
        try {
            fileExists = await fs.access(fullPath).then(() => true).catch(() => false)
        } catch (error) {
            pushToolResult(`检查文件是否存在时出错。将假设文件不存在并创建新文件。`)
        }
        
        if (!fileExists) {
            pushToolResult(`文件不存在: ${frameworkPath}。需要创建新文件。`)
            
            return {
                nextStep: "create_framework",
                message: "需要创建新的框架文件。",
                stateUpdates: {
                    currentStep: "create_framework"
                }
            }
        }
        
        // 检查是否为Markdown文件
        if (!fullPath.toLowerCase().endsWith(".md")) {
            return {
                nextStep: "complete",
                message: "只支持Markdown格式的框架文件。",
                completed: true
            }
        }
        
        // 进入分析步骤
        return {
            nextStep: "analyze",
            stateUpdates: {
                currentStep: "analyze"
            }
        }
    }
    
    /**
     * 分析框架步骤
     * 读取框架内容并分析可完善的方向
     */
    private handleAnalyzeStep = async (params: StepParams): Promise<StepResult> => {
        const { cline, frameworkPath, pushToolResult } = params
        
        pushToolResult('正在分析框架内容...')
        
        // 获取工作区根路径
        const rootPath = cline.cwd || process.cwd()
        
        // 构建完整文件路径
        const fullPath = path.isAbsolute(frameworkPath) ? frameworkPath : path.join(rootPath, frameworkPath)
        
        // 读取框架文件内容
        let frameworkContent = ""
        try {
            frameworkContent = await fs.readFile(fullPath, "utf8")
        } catch (error) {
            return {
                nextStep: "complete",
                message: `读取文件时出错。需要创建新文件。`,
                completed: true
            }
        }
        
        // 分析框架内容，确定可完善的方向
        const refinementOptions = analyzeFramework(frameworkContent)
        
        // 检查基本框架元素是否都已存在
        const essentialSections = this.checkEssentialSections(frameworkContent)
        
        // 记录文件访问
        try {
            await cline.fileContextTracker.trackFileContext(fullPath, "roo_read")
        } catch (error) {
            // 忽略文件追踪错误，不影响主流程
            console.error("文件追踪错误:", error)
        }
        
        // 进入显示选项步骤
        return {
            nextStep: "show_options",
            stateUpdates: {
                currentStep: "show_options",
                existingSections: essentialSections.existingSections,
                missingSections: essentialSections.missingSections
            }
        }
    }
    
    /**
     * 显示选项步骤
     * 向用户展示可完善的选项
     */
    private handleShowOptionsStep = async (params: StepParams): Promise<StepResult> => {
        const { cline, frameworkPath, state, askApproval, handleError, pushToolResult, removeClosingTag } = params
        
        // 获取工作区根路径
        const rootPath = cline.cwd || process.cwd()
        
        // 构建完整文件路径
        const fullPath = path.isAbsolute(frameworkPath) ? frameworkPath : path.join(rootPath, frameworkPath)
        
        // 读取框架文件内容
        let frameworkContent = ""
        try {
            frameworkContent = await fs.readFile(fullPath, "utf8")
        } catch (error) {
            return {
                nextStep: "complete",
                message: `读取文件时出错。`,
                completed: true
            }
        }
        
        // 分析框架内容，确定可完善的方向
        const refinementOptions = analyzeFramework(frameworkContent)
        
        // 使用ask_followup_question工具提供选项给用户
        const optionsMessage = formatOptionsMessage(refinementOptions)
        
        // 创建一个用于ask_followup_question的工具使用块
        const followupBlock = {
            type: "tool_use" as const,
            name: "ask_followup_question" as const,
            params: {
                question: optionsMessage,
            },
            partial: false,
        }
        
        // 调用askFollowupQuestionTool
        let userChoice = ""
        try {
            await askFollowupQuestionTool(
                cline,
                followupBlock,
                askApproval,
                handleError,
                async (result: unknown) => {
                    if (result && typeof result === "string") {
                        userChoice = result
                    }
                },
                removeClosingTag
            )
        } catch (error) {
            return {
                nextStep: "complete",
                message: `获取用户选择时出错: ${(error as Error).message}`,
                completed: true
            }
        }
        
        // 进入处理用户选择步骤
        return {
            nextStep: "process_choice",
            stateUpdates: {
                currentStep: "process_choice",
                userChoice
            }
        }
    }
    
    /**
     * 处理用户选择步骤
     * 根据用户的选择确定要执行的工作流
     */
    private handleProcessChoiceStep = async (params: StepParams): Promise<StepResult> => {
        const { state, pushToolResult } = params
        
        const userChoice = state.userChoice || ""
        
        // 获取工作区根路径
        const rootPath = params.cline.cwd || process.cwd()
        
        // 构建完整文件路径
        const fullPath = path.isAbsolute(params.frameworkPath) ? params.frameworkPath : path.join(rootPath, params.frameworkPath)
        
        // 读取框架文件内容
        let frameworkContent = ""
        try {
            frameworkContent = await fs.readFile(fullPath, "utf8")
        } catch (error) {
            return {
                nextStep: "complete",
                message: `读取文件时出错。`,
                completed: true
            }
        }
        
        // 分析框架内容，确定可完善的方向
        const refinementOptions = analyzeFramework(frameworkContent)
        
        // 根据用户选择确定要执行的工作流
        let selectedOption: RefinementOption | undefined
        
        // 尝试通过选项ID匹配
        if (userChoice.includes("选项") && /\d+/.test(userChoice)) {
            const optionNumber = parseInt(/\d+/.exec(userChoice)![0])
            if (optionNumber > 0 && optionNumber <= refinementOptions.length) {
                selectedOption = refinementOptions[optionNumber - 1]
            }
        }
        
        // 如果没有匹配到选项ID，尝试通过选项标题或描述匹配
        if (!selectedOption) {
            for (const option of refinementOptions) {
                if (
                    userChoice.includes(option.title) ||
                    userChoice.includes(option.description) ||
                    (option.area && userChoice.toLowerCase().includes(option.area.toLowerCase()))
                ) {
                    selectedOption = option
                    break
                }
            }
        }
        
        // 如果仍然没有匹配到选项，使用默认选项
        if (!selectedOption && refinementOptions.length > 0) {
            selectedOption = refinementOptions[0]
            pushToolResult(`未能识别您的选择，将使用默认选项: ${selectedOption.title}`)
        } else if (!selectedOption) {
            return {
                nextStep: "complete",
                message: "未找到可完善的内容选项。",
                completed: true
            }
        }
        
        // 进入执行工作流步骤
        return {
            nextStep: "execute_workflow",
            stateUpdates: {
                currentStep: "execute_workflow",
                selectedOption,
                currentWorkflow: selectedOption.area
            }
        }
    }
    
    /**
     * 执行工作流步骤
     * 执行选定的工作流
     */
    private handleExecuteWorkflowStep = async (params: StepParams): Promise<StepResult> => {
        const { cline, frameworkPath, state, askApproval, handleError, pushToolResult, removeClosingTag } = params
        
        if (!state.selectedOption || !state.currentWorkflow) {
            return {
                nextStep: "complete",
                message: "未选择要执行的工作流。",
                completed: true
            }
        }
        
        const selectedOption = state.selectedOption
        const currentWorkflow = state.currentWorkflow
        
        // 获取工作区根路径
        const rootPath = cline.cwd || process.cwd()
        
        // 构建完整文件路径
        const fullPath = path.isAbsolute(frameworkPath) ? frameworkPath : path.join(rootPath, frameworkPath)
        
        // 读取框架文件内容
        let frameworkContent = ""
        try {
            frameworkContent = await fs.readFile(fullPath, "utf8")
        } catch (error) {
            return {
                nextStep: "complete",
                message: `读取文件时出错。`,
                completed: true
            }
        }
        
        // 导入对应的工作流处理函数
        // 注意：这里我们直接使用已知的工作流处理函数，而不是动态导入
        // 这需要在index.ts中导出workflowMap
        try {
            // 获取工作流处理函数
            const workflowHandler = this.getWorkflowHandler(currentWorkflow)
            
            if (!workflowHandler) {
                return {
                    nextStep: "complete",
                    message: `未找到工作流处理函数: ${currentWorkflow}`,
                    completed: true
                }
            }
            
            // 执行工作流
            const success = await workflowHandler({
                cline,
                frameworkPath,
                frameworkContent,
                option: selectedOption,
                askApproval,
                handleError,
                pushToolResult,
                removeClosingTag
            })
            
            if (!success) {
                return {
                    nextStep: "complete",
                    message: `工作流执行失败: ${currentWorkflow}`,
                    completed: true
                }
            }
        } catch (error) {
            return {
                nextStep: "complete",
                message: `执行工作流时出错: ${(error as Error).message}`,
                completed: true
            }
        }
        
        // 显示更新后的文件内容
        await displayFileContent(cline, frameworkPath, pushToolResult)
        
        // 进入下一步选项步骤
        return {
            nextStep: "next_step",
            stateUpdates: {
                currentStep: "next_step"
            }
        }
    }
    
    /**
     * 显示下一步选项步骤
     * 向用户展示下一步可执行的选项
     */
    private handleNextStepOptionsStep = async (params: StepParams): Promise<StepResult> => {
        const { cline, frameworkPath, state, askApproval, handleError, pushToolResult, removeClosingTag } = params
        
        // 获取工作区根路径
        const rootPath = cline.cwd || process.cwd()
        
        // 构建完整文件路径
        const fullPath = path.isAbsolute(frameworkPath) ? frameworkPath : path.join(rootPath, frameworkPath)
        
        // 读取框架文件内容
        let updatedContent = ""
        try {
            updatedContent = await fs.readFile(fullPath, "utf8")
        } catch (error) {
            return {
                nextStep: "complete",
                message: `读取文件时出错。`,
                completed: true
            }
        }
        
        // 检查基本框架元素是否都已存在
        const essentialSections = this.checkEssentialSections(updatedContent)
        
        // 确定当前正在处理的区域和下一个要处理的区域
        const standardOrder = [
            'genre', 'character', 'plot', 'world', 'theme', 
            'chapter-outline', 'style', 'writing-technique', 'market', 
            'tech', 'emotion', 'reflection', 'plan'
        ]
        
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
        
        // 获取所有缺失的部分
        const missingAreas = standardOrder.filter(area => 
            !essentialSections.existingSections.includes(areaNames[area])
        )
        
        // 当前完成的区域索引
        let currentAreaIndex = 0
        // 找到最后一个已完成的区域
        for (let i = standardOrder.length - 1; i >= 0; i--) {
            if (essentialSections.existingSections.includes(areaNames[standardOrder[i]])) {
                currentAreaIndex = i;
                break;
            }
        }
        
        // 确定下一个要处理的区域
        const nextAreaIndex = currentAreaIndex + 1 < standardOrder.length ? currentAreaIndex + 1 : 0
        const nextArea = standardOrder[nextAreaIndex]
        const nextAreaName = areaNames[nextArea]
        
        // 构建选项消息
        let message = ""
        
        // 无论是否有缺失部分，都提供同样的选项，但选项内容会根据是否有缺失而调整
        const currentArea = standardOrder[currentAreaIndex]
        const currentAreaName = areaNames[currentArea]
        
        // 确定下一个缺失的部分（如果有的话）
        const nextMissingArea = missingAreas.length > 0 ? missingAreas[0] : null
        const nextMissingAreaName = nextMissingArea ? areaNames[nextMissingArea] : "其它框架部分"
        
        // 构建消息，提醒用户缺失的部分
        if (missingAreas.length > 0) {
            message = `您的框架还缺少这些部分：${missingAreas.map(area => areaNames[area]).join(", ")}。\n\n`
        } else {
            message = `您已完成所有基本框架部分。\n\n`
        }
        
        message += `您当前正在完善${currentAreaName}。您希望接下来做什么？\n\n`
        message += `1. 继续深入完善${currentAreaName}内容\n`
        message += `2. 补充${currentAreaName}中的细节描述\n`
        message += `3. 拓展${currentAreaName}的更多可能性\n`
        message += `4. 跳转到${nextAreaName}部分\n`
        
        // 根据是否有缺失部分调整第5个选项
        if (missingAreas.length > 0) {
            message += `5. 添加缺失的${nextMissingAreaName}部分\n`
        } else {
            message += `5. 对整个框架进行全面审查\n`
        }
        
        message += `6. 结束框架完善，切换到文字生成模式开始写作\n`
        message += "\n请选择操作（输入对应的序号）："
        
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
        let nextChoice = ""
        try {
            await askFollowupQuestionTool(
                cline,
                followupBlock,
                askApproval,
                handleError,
                async (result: unknown) => {
                    if (result && typeof result === "string") {
                        nextChoice = result
                    }
                },
                removeClosingTag
            )
        } catch (error) {
            return {
                nextStep: "complete",
                message: `获取用户选择时出错: ${(error as Error).message}`,
                completed: true
            }
        }
        
        // 根据用户选择确定下一步
        // 这里我们只是记录用户的选择，实际处理会在下一次工具调用中完成
        return {
            nextStep: "complete",
            message: `您选择了: ${nextChoice}。请在下一次对话中继续完善框架。`,
            stateUpdates: {
                currentStep: "complete",
                userChoice: nextChoice,
                existingSections: essentialSections.existingSections,
                missingSections: missingAreas.map(area => areaNames[area])
            },
            completed: true
        }
    }
    
    /**
     * 完成步骤
     * 完成工作流程
     */
    private handleCompleteStep = async (params: StepParams): Promise<StepResult> => {
        const { pushToolResult } = params
        
        pushToolResult('框架完善工具执行完成。')
        
        return {
            nextStep: "complete",
            completed: true
        }
    }
    
    /**
     * 检查基本框架元素是否都已存在
     * 这个函数在原始代码中是从index.ts导入的，这里我们自己实现
     */
    private checkEssentialSections(content: string): EssentialSectionsResult {
        // 基本框架部分
        const essentialSections = [
            "角色设计", "情节与大纲", "章节规划", "世界观", "主题元素", 
            "叙事风格", "市场定位", "创作计划", "系统设定", "情感设计", 
            "自我反思", "写作手法", "小说题材"
        ]
        
        // 检查每个部分是否存在
        const existingSections: string[] = []
        const missingSections: string[] = []
        
        for (const section of essentialSections) {
            if (content.includes(`# ${section}`) || content.includes(`## ${section}`)) {
                existingSections.push(section)
            } else {
                missingSections.push(section)
            }
        }
        
        return {
            allSectionsExist: missingSections.length === 0,
            existingSections,
            missingSections
        }
    }
    
    /**
     * 创建通用选项
     * 这个函数在原始代码中是从index.ts导入的，这里我们自己实现
     */
    private createGenericOption(area: string, areaName: string): RefinementOption {
        return {
            id: `generic_${area}`,
            area: area,
            title: `完善${areaName}`,
            description: `深入完善${areaName}部分的内容`
        }
    }
    
    /**
     * 获取工作流处理函数
     * 这个函数在原始代码中是从index.ts导入workflowMap，这里我们自己实现
     */
    private getWorkflowHandler(area: string): ((params: any) => Promise<boolean>) | undefined {
        // 这里需要根据实际情况导入工作流处理函数
        // 在实际实现中，应该从index.ts中导入workflowMap
        // 这里我们返回一个模拟的处理函数
        return async (params: any) => {
            // 模拟成功处理
            return true
        }
    }
} 