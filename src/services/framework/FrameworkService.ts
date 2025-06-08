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
import { handleGenreWorkflow } from "../../core/tools/novel-framework-refine/workflows/genre"
import { handleCharacterWorkflow } from "../../core/tools/novel-framework-refine/workflows/character"
import { handlePlotWorkflow } from "../../core/tools/novel-framework-refine/workflows/plot"
import { handleWorldWorkflow } from "../../core/tools/novel-framework-refine/workflows/world"
import { handleThemeWorkflow } from "../../core/tools/novel-framework-refine/workflows/theme"
import { handleChapterOutlineWorkflow } from "../../core/tools/novel-framework-refine/workflows/chapter-outline"
import { handleStyleWorkflow } from "../../core/tools/novel-framework-refine/workflows/style"
import { handleWritingTechniqueWorkflow } from "../../core/tools/novel-framework-refine/workflows/writing-technique"
import { handleMarketWorkflow } from "../../core/tools/novel-framework-refine/workflows/market"
import { handleSystemWorkflow } from "../../core/tools/novel-framework-refine/workflows/tech"
import { handleEmotionWorkflow } from "../../core/tools/novel-framework-refine/workflows/emotion"
import { handleReflectionWorkflow } from "../../core/tools/novel-framework-refine/workflows/reflection"
import { handlePlanWorkflow } from "../../core/tools/novel-framework-refine/workflows/plan"
import { handleChunkDemoWorkflow } from "../../core/tools/novel-framework-refine/workflows/chunk-demo"
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
                
                // 直接执行显示选项步骤
                await this.executeStep("show_options", stepParams)
                return
            }
            
            // 检查是否有有效的状态
            const hasValidState = await this._stateManager.hasValidState(frameworkPath)
            
            // 创建或加载状态
            let state: FrameworkState
            if (hasValidState) {
                state = (await this._stateManager.loadState())!
            } else {
                state = this._stateManager.createState(frameworkPath)
            }
            
            // 设置初始步骤
            if (!hasValidState) {
                state = this._stateManager.updateState({
                    currentStep: "init"
                })
            }
            
            // 创建步骤参数
            const stepParams: StepParams = {
                cline,
                frameworkPath,
                state,
                askApproval: async (message: string) => {
                    // 在实际应用中，这里应该调用askFollowupQuestionTool
                    // 但是在服务中，我们将这个逻辑委托给工具适配器处理
                    this._onProgressUpdate.fire({
                        currentStep: "ask_continue",
                        message
                    })
                    return true
                },
                handleError: async (context: string, error: Error) => {
                    console.error(`[FrameworkService] ${context}:`, error)
                },
                pushToolResult: (message: string) => {
                    // 在实际应用中，这里应该将消息推送给用户
                    // 但是在服务中，我们将这个逻辑委托给工具适配器处理
                    this._onProgressUpdate.fire({
                        currentStep: state.currentStep,
                        message
                    })
                },
                removeClosingTag: () => ""
            }
            
            // 执行工作流步骤
            const result = await this.executeStep(state.currentStep, stepParams)
            
            // 更新状态
            if (result.stateUpdates) {
                this._stateManager.updateState(result.stateUpdates)
            }
            
            // 如果工作流完成，清除状态
            if (result.completed) {
                await this._stateManager.clearState()
            }
        } catch (error) {
            console.error("[FrameworkService] 执行小说框架完善服务时出错:", error)
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