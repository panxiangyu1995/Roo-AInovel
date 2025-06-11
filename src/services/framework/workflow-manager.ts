import * as path from "path"
import * as fs from "fs/promises"
import { FrameworkState, StepHandler, StepParams, StepResult, WorkflowHandler, WorkflowParams } from "./interfaces"
import { FrameworkStateManager } from "./state-manager"
import { analyzeFramework } from "./utils/analysis"
import { RefinementOption } from "./novel-framework-refine/types"
import { handleGuidelinesWorkflow } from "./workflows/guidelines"

/**
 * 工作流管理器
 * 负责定义和处理工作流的各个步骤
 */
export class WorkflowManager {
    private static instance: WorkflowManager
    private _steps: Map<string, StepHandler> = new Map()
    private _workflows: Map<string, WorkflowHandler> = new Map()
    private _stateManager: FrameworkStateManager
    
    /**
     * 获取工作流管理器实例（单例模式）
     */
    public static getInstance(): WorkflowManager {
        if (!WorkflowManager.instance) {
            WorkflowManager.instance = new WorkflowManager()
        }
        return WorkflowManager.instance
    }
    
    /**
     * 私有构造函数，确保单例模式
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
        
        // 有序工作流步骤
        this._steps.set("ordered_workflow", this.handleOrderedWorkflowStep)
        
        // 完成步骤
        this._steps.set("complete", this.handleCompleteStep)
    }
    
    /**
     * 注册工作流处理函数
     * @param name 工作流名称
     * @param handler 工作流处理函数
     */
    public registerWorkflow(name: string, handler: WorkflowHandler): void {
        this._workflows.set(name, handler)
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
     * 执行工作流
     * @param workflowName 工作流名称
     * @param params 工作流参数
     * @returns 工作流执行结果
     */
    public async executeWorkflow(workflowName: string, params: WorkflowParams): Promise<boolean> {
        const handler = this._workflows.get(workflowName)
        
        if (!handler) {
            throw new Error(`未知的工作流: ${workflowName}`)
        }
        
        try {
            return await handler(params)
        } catch (error) {
            await params.handleError(error)
            return false
        }
    }
    
    /**
     * 检查基本框架元素是否都已存在
     * @param content 框架内容
     * @returns 缺失的基本元素列表
     */
    public checkEssentialSections(content: string): string[] {
        const essentialSections = [
            '小说题材', '角色设计', '情节大纲', '世界观设定'
        ]
        
        const missing: string[] = []
        
        for (const section of essentialSections) {
            if (!content.includes(`## ${section}`) && !content.includes(`#${section}`)) {
                missing.push(section)
            }
        }
        
        return missing
    }
    
    // ========== 步骤处理函数 ==========
    
    /**
     * 处理初始化步骤
     */
    private handleInitStep = async (params: StepParams): Promise<StepResult> => {
        const { frameworkPath, state } = params
        
        // 检查框架文件是否存在
        const rootPath = params.cline.cwd || process.cwd()
        const fullPath = path.isAbsolute(frameworkPath) ? frameworkPath : path.join(rootPath, frameworkPath)
        
        let fileExists = false
        try {
            await fs.access(fullPath)
            fileExists = true
        } catch (error) {
            // 文件不存在
        }
        
        if (fileExists) {
            // 文件存在，进入分析步骤
            return {
                nextStep: "analyze",
                message: `正在分析框架文件: ${frameworkPath}`,
                stateUpdates: {
                    frameworkPath
                }
            }
        } else {
            // 文件不存在，返回错误
            return {
                nextStep: "complete",
                message: `框架文件不存在: ${frameworkPath}`,
                completed: true
            }
        }
    }
    
    /**
     * 处理分析框架步骤
     */
    private handleAnalyzeStep = async (params: StepParams): Promise<StepResult> => {
        const { frameworkPath } = params
        
        // 获取工作区根路径
        const rootPath = params.cline.cwd || process.cwd()
        
        // 构建完整文件路径
        const fullPath = path.isAbsolute(frameworkPath) ? frameworkPath : path.join(rootPath, frameworkPath)
        
        // 读取框架文件内容
        let frameworkContent = ""
        try {
            frameworkContent = await fs.readFile(fullPath, "utf8")
        } catch (error) {
            return {
                nextStep: "complete",
                message: `读取文件时出错: ${(error as Error).message}`,
                completed: true
            }
        }
        
        // 分析框架内容，确定可完善的方向
        const refinementOptions = analyzeFramework(frameworkContent)
        
        // 检查基本框架元素是否都已存在
        const missingSections = this.checkEssentialSections(frameworkContent)
        
        return {
            nextStep: "next_step",
            message: `框架分析完成，找到 ${refinementOptions.length} 个可完善的方向。`,
            stateUpdates: {
                missingSections
            }
        }
    }
    
    /**
     * 处理显示选项步骤
     */
    private handleShowOptionsStep = async (params: StepParams): Promise<StepResult> => {
        const { frameworkPath, pushToolResult } = params
        
        // 获取工作区根路径
        const rootPath = params.cline.cwd || process.cwd()
        
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
        
        // 构建选项消息
        let optionsMessage = "框架分析完成，以下是可以完善的方向："
        
        // 构建选项数组，用于askUser方法
        const options = refinementOptions.map(option => `${option.title}: ${option.description}`)
        
        // 使用askUser方法询问用户
        const userChoice = await params.askUser(optionsMessage, options)
        
        // 如果用户没有做出选择，提示并返回到选项步骤
        if (!userChoice) {
            pushToolResult("未收到您的选择，请重新选择。")
            return {
                nextStep: "show_options"
            }
        }
        
        return {
            nextStep: "process_choice",
            stateUpdates: {
                userChoice
            }
        }
    }
    
    /**
     * 处理用户选择步骤
     */
    private handleProcessChoiceStep = async (params: StepParams): Promise<StepResult> => {
        const { state, pushToolResult } = params
        
        const userChoice = state.userChoice || ""
        
        // 检查用户是否选择结束框架完善
        if (userChoice.includes("结束") || userChoice.includes("完成") || userChoice.toLowerCase().includes("end") || userChoice.toLowerCase().includes("finish")) {
            return {
                nextStep: "complete",
                message: "框架完善已结束。",
                completed: true
            }
        }
        
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
        
        // 如果没有通过选项ID匹配到，尝试通过关键词匹配
        if (!selectedOption) {
            // 尝试匹配标题
            selectedOption = refinementOptions.find(option => 
                userChoice.toLowerCase().includes(option.title.toLowerCase())
            )
            
            // 尝试匹配描述
            if (!selectedOption) {
                selectedOption = refinementOptions.find(option => 
                    userChoice.toLowerCase().includes(option.description.toLowerCase())
                )
            }
            
            // 尝试匹配ID
            if (!selectedOption) {
                selectedOption = refinementOptions.find(option => 
                    userChoice.toLowerCase().includes(option.id.toLowerCase())
                )
            }
        }
        
        // 如果仍然没有匹配到，返回错误
        if (!selectedOption) {
            pushToolResult("未能识别您的选择，请重新选择。")
            return {
                nextStep: "show_options"
            }
        }
        
        // 确定工作流名称
        const workflowName = selectedOption.area
        
        // 更新状态
        return {
            nextStep: "execute_workflow",
            message: `您选择了: ${selectedOption.title}`,
            stateUpdates: {
                selectedOption,
                currentWorkflow: workflowName
            }
        }
    }
    
    /**
     * 执行工作流步骤
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
        
        // 执行工作流
        const workflowParams = {
            cline, 
            frameworkPath, 
            frameworkContent, 
            askApproval, 
            handleError: (error: any) => handleError("refining framework", error as Error),
            pushToolResult, 
            removeClosingTag
        }
        
        try {
            const success = await this.executeWorkflow(currentWorkflow, workflowParams)
            
            if (success) {
                // 无论成功与否，都进入下一步选项步骤，而不是直接完成
                return {
                    nextStep: "next_step",
                    message: `${selectedOption.title} 完善成功！`
                }
            } else {
                // 即使失败也继续询问用户下一步操作，而不是直接结束
                return {
                    nextStep: "next_step",
                    message: `${selectedOption.title} 完善可能未完全成功，您可以选择继续完善或尝试其他部分。`
                }
            }
        } catch (error) {
            // 出错时也继续询问用户下一步操作，而不是直接结束
            return {
                nextStep: "next_step",
                message: `执行工作流时出现一些问题: ${(error as Error).message}，但您可以继续完善其他部分。`
            }
        }
    }
    
    /**
     * 处理有序工作流步骤
     */
    private handleOrderedWorkflowStep = async (params: StepParams): Promise<StepResult> => {
        const { state, pushToolResult } = params
        
        // 定义框架的标准部分
        const frameworkSections = [
            { id: "basic_info", title: "基本信息", workflow: "basic_info" },
            { id: "theme", title: "主题与中心思想", workflow: "theme" },
            { id: "characters", title: "角色设计", workflow: "characters" },
            { id: "setting", title: "世界观设定", workflow: "setting" },
            { id: "plot", title: "情节发展", workflow: "plot" },
            { id: "outline", title: "故事大纲", workflow: "outline" },
            { id: "conflict", title: "冲突设计", workflow: "conflict" },
            { id: "climax", title: "高潮安排", workflow: "climax" },
            { id: "pov", title: "视角选择", workflow: "pov" },
            { id: "tone", title: "语调与风格", workflow: "tone" },
            { id: "dialogue", title: "对话设计", workflow: "dialogue" },
            { id: "symbolism", title: "象征与隐喻", workflow: "symbolism" },
            { id: "structure", title: "结构组织", workflow: "structure" },
            { id: "ending", title: "结局设计", workflow: "ending" }
        ]
        
        // 获取当前工作流索引
        let currentIndex = state.currentWorkflowIndex !== undefined ? state.currentWorkflowIndex : 0
        
        // 如果索引超出范围，回到第一个
        if (currentIndex < 0 || currentIndex >= frameworkSections.length) {
            currentIndex = 0
        }
        
        // 获取当前要处理的部分
        const currentSection = frameworkSections[currentIndex]
        
        // 使用askUser方法询问用户是否要完善当前部分
        const userChoice = await params.askUser(
            `现在将完善"${currentSection.title}"部分，您希望如何继续？`,
            ["完善此部分", "跳过此部分", "结束框架完善"]
        )
        
        // 处理用户选择
        if (userChoice.includes("1") || userChoice.toLowerCase().includes("完善")) {
            // 用户选择完善当前部分
            const selectedOption = {
                id: currentSection.id,
                title: currentSection.title,
                description: `完善${currentSection.title}部分`,
                area: currentSection.workflow
            }
            
            return {
                nextStep: "execute_workflow",
                message: `您选择了完善: ${selectedOption.title}`,
                stateUpdates: {
                    selectedOption,
                    currentWorkflow: selectedOption.area,
                    currentWorkflowIndex: currentIndex
                }
            }
        } else if (userChoice.includes("2") || userChoice.toLowerCase().includes("跳过")) {
            // 用户选择跳过当前部分
            pushToolResult(`您选择了跳过${currentSection.title}部分`)
            
            // 移动到下一个部分
            return {
                nextStep: "ordered_workflow",
                stateUpdates: {
                    currentWorkflowIndex: currentIndex + 1
                }
            }
        } else {
            // 用户选择结束框架完善
            return {
                nextStep: "complete",
                message: "框架完善已结束。",
                completed: true
            }
        }
    }
    
    /**
     * 处理下一步选项步骤
     */
    private handleNextStepOptionsStep = async (params: StepParams): Promise<StepResult> => {
        const { state, pushToolResult } = params
        
        // 是否继续在当前部分深入
        const continueOptions = [
            "继续完善当前部分",
            "移动到下一个部分",
            "结束框架完善"
        ]
        
        // 使用askUser方法询问用户
        const userChoice = await params.askUser(
            "您希望如何继续？", 
            continueOptions
        )
        
        // 处理用户选择
        if (userChoice.includes("1") || userChoice.toLowerCase().includes("继续完善当前")) {
            // 用户选择继续完善当前部分
            return {
                nextStep: "execute_workflow",
                stateUpdates: {
                    continueInCurrentSection: true
                }
            }
        } else if (userChoice.includes("2") || userChoice.toLowerCase().includes("移动到下一个")) {
            // 用户选择移动到下一个部分
            return {
                nextStep: "ordered_workflow",
                stateUpdates: {
                    continueInCurrentSection: false
                }
            }
        } else {
            // 用户选择结束框架完善
            return {
                nextStep: "complete",
                message: "框架完善已结束。",
                completed: true
            }
        }
    }
    
    /**
     * 处理完成步骤
     */
    private handleCompleteStep = async (params: StepParams): Promise<StepResult> => {
        // 清除状态
        await this._stateManager.clearState()
        
        return {
            nextStep: "complete",
            message: "框架完善已完成。",
            completed: true
        }
    }
} 