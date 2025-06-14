import * as vscode from "vscode"
import { RefinementOption } from "../novel-framework-refine/types"

/**
 * 框架服务状态类型
 */
export type FrameworkState = {
    // 基本信息
    frameworkPath: string
    currentStep: string
    previousStep?: string
    
    // 当前工作流程状态
    currentWorkflow?: string
    currentWorkflowIndex?: number
    workflowStep?: number
    hasEnteredWorkflow?: boolean
    
    // 框架分析结果
    existingSections: string[]
    missingSections: string[]
    
    // 用户选择
    selectedOption?: RefinementOption
    userChoice?: string
    
    // 其他状态
    isOptimizeOrComplete?: boolean
    continueInCurrentSection?: boolean
    switchToWriterMode?: boolean
    optimizeAll?: boolean
    
    // 时间戳
    lastUpdated: number
}

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
    
    /**
     * 直接询问用户问题的方法，替代askFollowupQuestionTool
     * @param question 问题内容
     * @param options 可选的回答选项
     * @returns 用户回答的内容
     */
    askUser: (question: string, options?: string[]) => Promise<string>
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
 * 工作流处理参数
 */
export interface WorkflowParams {
    cline: any
    frameworkPath: string
    frameworkContent: string
    askApproval: (message: string) => Promise<boolean>
    handleError: (error: any) => Promise<void>
    pushToolResult: (message: string) => void
    removeClosingTag: () => string
}

/**
 * 特殊工作流返回值类型
 */
export interface WorkflowSpecialResult {
    type: string
    message?: string
    [key: string]: any
}

/**
 * 工作流处理函数类型
 */
export type WorkflowHandler = (params: WorkflowParams) => Promise<boolean | WorkflowSpecialResult>

/**
 * 工作流步骤处理函数类型
 */
export type StepHandler = (params: StepParams) => Promise<StepResult>

/**
 * 框架服务接口
 */
export interface IFrameworkService {
    /**
     * 事件：当进度更新时触发
     */
    onProgressUpdate: vscode.Event<{
        currentStep: string
        message?: string
    }>

    /**
     * 初始化服务
     * @param context VSCode扩展上下文
     * @returns 初始化结果
     */
    initialize(context: vscode.ExtensionContext): Promise<void>

    /**
     * 处理框架完善请求
     * @param params 处理参数
     * @returns 处理结果
     */
    processFrameworkRefine(
        cline: any,
        path: string, 
        area?: string,
        template?: boolean,
        simplify_tasks?: boolean
    ): Promise<void>

    /**
     * 执行工作流步骤
     * @param stepName 步骤名称
     * @param params 步骤参数
     * @returns 步骤执行结果
     */
    executeStep(stepName: string, params: StepParams): Promise<StepResult>

    /**
     * 执行特定工作流
     * @param workflowName 工作流名称
     * @param params 工作流参数
     * @returns 工作流执行结果或特殊返回值
     */
    executeWorkflow(workflowName: string, params: WorkflowParams): Promise<boolean | WorkflowSpecialResult>

    /**
     * 清理服务资源
     */
    dispose(): void
} 