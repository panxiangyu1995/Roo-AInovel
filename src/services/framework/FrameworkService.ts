import * as vscode from "vscode"
import * as path from "path"
import * as fs from "fs/promises"
import { IFrameworkService, FrameworkState, StepParams, StepResult, WorkflowParams } from "./interfaces"
import { FrameworkStateManager } from "./state-manager"
import { WorkflowManager } from "./workflow-manager"
import { FrameworkConfigManager } from "./config-manager"
import { getWorkspacePath } from "../../utils/path"
import { formatResponse } from "../../core/prompts/responses"
import { fileExistsAtPath } from "../../utils/fs"
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
import { handleChunkDemoWorkflow } from "./workflows/chunk-demo"
import { handleGuidelinesWorkflow } from "./workflows/guidelines"
import { generateBasicFramework } from "./utils/common"

/**
 * 框架服务
 * 提供小说框架完善的核心功能
 */
export class FrameworkService implements IFrameworkService {
    private static instance: FrameworkService
    
    // 事件发射器
    private readonly _onProgressUpdate = new vscode.EventEmitter<{
        currentStep: string
        message?: string
    }>()
    
    // 服务组件
    private _stateManager: FrameworkStateManager
    private _workflowManager: WorkflowManager
    private _configManager: FrameworkConfigManager
    
    // 状态
    private _initialized: boolean = false
    private _context: vscode.ExtensionContext | null = null
    private _workspacePath: string = ""
    
    /**
     * 获取框架服务实例（单例模式）
     */
    public static getInstance(): FrameworkService {
        if (!FrameworkService.instance) {
            FrameworkService.instance = new FrameworkService()
        }
        return FrameworkService.instance
    }
    
    /**
     * 私有构造函数，确保单例模式
     */
    private constructor() {
        this._stateManager = FrameworkStateManager.getInstance()
        this._workflowManager = WorkflowManager.getInstance()
        this._configManager = FrameworkConfigManager.getInstance()
    }
    
    /**
     * 事件：当进度更新时触发
     */
    public get onProgressUpdate(): vscode.Event<{
        currentStep: string
        message?: string
    }> {
        return this._onProgressUpdate.event
    }
    
    /**
     * 初始化服务
     * @param context VSCode扩展上下文
     */
    public async initialize(context: vscode.ExtensionContext): Promise<void> {
        if (this._initialized) {
            return
        }
        
        this._context = context
        this._workspacePath = getWorkspacePath() || ""
        
        // 初始化配置管理器
        this._configManager.initialize()
        
        // 初始化状态管理器
        this._stateManager.initialize(context, this._workspacePath)
        
        // 注册工作流
        this.registerWorkflows()
        
        this._initialized = true
    }
    
    /**
     * 注册工作流处理函数
     */
    private registerWorkflows(): void {
        this._workflowManager.registerWorkflow("genre", handleGenreWorkflow)
        this._workflowManager.registerWorkflow("character", handleCharacterWorkflow)
        this._workflowManager.registerWorkflow("plot", handlePlotWorkflow)
        this._workflowManager.registerWorkflow("world", handleWorldWorkflow)
        this._workflowManager.registerWorkflow("theme", handleThemeWorkflow)
        this._workflowManager.registerWorkflow("chapter-outline", handleChapterOutlineWorkflow)
        this._workflowManager.registerWorkflow("style", handleStyleWorkflow)
        this._workflowManager.registerWorkflow("writing-technique", handleWritingTechniqueWorkflow)
        this._workflowManager.registerWorkflow("market", handleMarketWorkflow)
        this._workflowManager.registerWorkflow("tech", handleSystemWorkflow)
        this._workflowManager.registerWorkflow("emotion", handleEmotionWorkflow)
        this._workflowManager.registerWorkflow("reflection", handleReflectionWorkflow)
        this._workflowManager.registerWorkflow("plan", handlePlanWorkflow)
        this._workflowManager.registerWorkflow("chunk-demo", handleChunkDemoWorkflow)
        this._workflowManager.registerWorkflow("guidelines", handleGuidelinesWorkflow)
    }
    
    /**
     * 处理框架完善请求
     * @param cline 任务对象
     * @param path 框架文件路径
     * @param area 关注区域
     * @param template 是否使用模板
     * @param simplify_tasks 是否简化任务
     */
    public async processFrameworkRefine(
        cline: any,
        path: string, 
        area?: string,
        template?: boolean,
        simplify_tasks?: boolean
    ): Promise<void> {
        if (!this._initialized) {
            throw new Error("框架服务未初始化")
        }
        
        try {
            // 获取工作区根路径
            const rootPath = cline.cwd || process.cwd()
            
            // 构建完整文件路径
            const frameworkPath = path
            const fullPath = require('path').isAbsolute(frameworkPath) ? frameworkPath : require('path').join(rootPath, frameworkPath)
            
            // 检查文件是否存在
            const fileExists = await fileExistsAtPath(fullPath)
            
            // 如果文件不存在，则创建基本框架
            if (!fileExists) {
                await this.createFrameworkFile(
                    cline,
                    frameworkPath,
                    fullPath,
                    template !== undefined ? template : this._configManager.useTemplate,
                    simplify_tasks !== undefined ? simplify_tasks : this._configManager.simplifyTasks
                )
                
                // 创建框架文件后，创建一个基本状态
                const state = this._stateManager.createState(frameworkPath)
                
                // 创建步骤参数
                const stepParams: StepParams = {
                    cline,
                    frameworkPath,
                    state,
                    askApproval: async (message: string) => {
                        // 这里需要调用工具适配器中传入的askApproval函数
                        // 但由于服务中无法直接访问，我们通过事件发送消息
                        this._onProgressUpdate.fire({
                            currentStep: "ask_continue",
                            message: "是否继续完善框架内容？"
                        })
                        return true // 默认返回true，实际决定权在工具适配器中
                    },
                    handleError: async (context: string, error: Error) => {
                        console.error(`[FrameworkService] ${context}:`, error)
                    },
                    pushToolResult: (message: string) => {
                        this._onProgressUpdate.fire({
                            currentStep: "message",
                            message
                        })
                    },
                    removeClosingTag: () => ""
                }
                
                // 通知用户框架已创建
                await stepParams.pushToolResult(`已成功创建小说框架文件：${frameworkPath}`)
                
                // 使用askFollowupQuestion工具询问用户是否继续完善框架
                const continueQuestionBlock = {
                    type: "tool_use" as const,
                    name: "ask_followup_question" as const,
                    params: {
                        question: "框架已创建，您希望如何继续？\n\n" +
                            "1. 继续完善框架内容\n" +
                            "2. 结束框架完善"
                    },
                    partial: false,
                }
                
                let shouldContinue = false
                
                await cline.toolManager.askFollowupQuestionTool(
                    cline,
                    continueQuestionBlock,
                    stepParams.askApproval,
                    (context: string, error: Error) => stepParams.handleError(context, error),
                    async (result: unknown) => {
                        if (result && typeof result === "string") {
                            const userChoice = result.trim()
                            shouldContinue = userChoice.includes("1") || userChoice.toLowerCase().includes("继续")
                        }
                        return true
                    },
                    stepParams.removeClosingTag
                )
                
                if (shouldContinue) {
                    // 直接执行显示选项步骤
                    await this.executeStep("show_options", stepParams)
                } else {
                    await stepParams.pushToolResult("您选择了结束框架完善。框架已保存。")
                    
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
                        stepParams.askApproval,
                        (context: string, error: Error) => stepParams.handleError(context, error),
                        async (result: unknown) => {
                            if (result && typeof result === "string") {
                                const switchChoice = result.trim()
                                
                                if (switchChoice.includes("1") || switchChoice.toLowerCase().includes("是")) {
                                    // 使用switch_mode工具切换到writer模式
                                    stepParams.pushToolResult("正在切换到文字生成模式...")
                                    
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
                                        
                                        stepParams.pushToolResult("已切换到文字生成模式。您现在可以开始根据框架创作小说内容了。")
                                    } catch (error) {
                                        stepParams.pushToolResult("模式切换失败，请手动切换到文字生成模式。错误: " + error)
                                    }
                                }
                            }
                            return true
                        },
                        stepParams.removeClosingTag
                    )
                }
                
                return
            }
            
            // 检查是否有有效的状态
            const hasValidState = await this._stateManager.hasValidState(frameworkPath)
            
            // 创建或加载状态
            let state: FrameworkState
            
            if (hasValidState) {
                // 加载现有状态
                state = (await this._stateManager.loadState())!
            } else {
                // 创建新状态
                state = this._stateManager.createState(frameworkPath)
            }
            
            // 创建步骤参数
            const stepParams: StepParams = {
                cline,
                frameworkPath,
                state,
                askApproval: async (message: string) => {
                    // 通过事件发送消息
                    this._onProgressUpdate.fire({
                        currentStep: "ask_approval",
                        message
                    })
                    
                    // 这里应该等待用户响应，但由于架构限制，我们默认返回true
                    return true
                },
                handleError: async (context: string, error: Error) => {
                    console.error(`[FrameworkService] ${context}:`, error)
                },
                pushToolResult: (message: string) => {
                    this._onProgressUpdate.fire({
                        currentStep: "message",
                        message
                    })
                },
                removeClosingTag: () => ""
            }
            
            // 执行初始化步骤
            await this.executeStep("init", stepParams)
        } catch (error) {
            console.error("[FrameworkService] 处理框架完善请求时出错:", error)
            throw error
        }
    }
    
    /**
     * 执行工作流步骤
     * @param stepName 步骤名称
     * @param params 步骤参数
     * @returns 步骤执行结果
     */
    public async executeStep(stepName: string, params: StepParams): Promise<StepResult> {
        if (!this._initialized) {
            throw new Error("框架服务未初始化")
        }
        
        try {
            // 发布进度更新事件
            this._onProgressUpdate.fire({
                currentStep: stepName
            })
            
            // 执行步骤
            const result = await this._workflowManager.executeStep(stepName, params)
            
            // 如果有消息，发布进度更新事件
            if (result.message) {
                this._onProgressUpdate.fire({
                    currentStep: result.nextStep,
                    message: result.message
                })
            }
            
            return result
        } catch (error) {
            console.error(`[FrameworkService] 执行步骤 ${stepName} 时出错:`, error)
            throw error
        }
    }
    
    /**
     * 执行特定工作流
     * @param workflowName 工作流名称
     * @param params 工作流参数
     * @returns 工作流执行结果
     */
    public async executeWorkflow(workflowName: string, params: WorkflowParams): Promise<boolean> {
        if (!this._initialized) {
            throw new Error("框架服务未初始化")
        }
        
        try {
            // 发布进度更新事件
            this._onProgressUpdate.fire({
                currentStep: `workflow:${workflowName}`,
                message: `正在执行工作流: ${workflowName}`
            })
            
            // 执行工作流
            const result = await this._workflowManager.executeWorkflow(workflowName, params)
            
            // 发布进度更新事件
            this._onProgressUpdate.fire({
                currentStep: `workflow:${workflowName}`,
                message: result ? `工作流 ${workflowName} 执行成功` : `工作流 ${workflowName} 执行失败`
            })
            
            return result
        } catch (error) {
            console.error(`[FrameworkService] 执行工作流 ${workflowName} 时出错:`, error)
            throw error
        }
    }
    
    /**
     * 创建框架文件
     * @param cline 任务对象
     * @param frameworkPath 框架文件路径
     * @param fullPath 完整文件路径
     * @param useTemplate 是否使用模板
     * @param simplifyTasks 是否简化任务
     */
    private async createFrameworkFile(
        cline: any,
        frameworkPath: string,
        fullPath: string,
        useTemplate: boolean,
        simplifyTasks: boolean
    ): Promise<void> {
        try {
            // 创建目录
            const dir = require('path').dirname(fullPath)
            await fs.mkdir(dir, { recursive: true })
            
            // 生成基本框架内容
            const content = generateBasicFramework(useTemplate ? "true" : "false", simplifyTasks ? "true" : "false")
            
            // 写入文件
            await fs.writeFile(fullPath, content, "utf8")
            
            // 发布进度更新事件
            this._onProgressUpdate.fire({
                currentStep: "create",
                message: `已创建框架文件: ${frameworkPath}`
            })
        } catch (error) {
            console.error("[FrameworkService] 创建框架文件时出错:", error)
            throw error
        }
    }
    
    /**
     * 清理服务资源
     */
    public dispose(): void {
        this._onProgressUpdate.dispose()
    }
} 