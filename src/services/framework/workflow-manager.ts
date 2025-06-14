import * as path from "path"
import * as fs from "fs/promises"
import { FrameworkState, StepHandler, StepParams, StepResult, WorkflowHandler, WorkflowParams, WorkflowSpecialResult } from "./interfaces"
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
        
        // 优化所有部分步骤
        this._steps.set("optimize_all_sections", this.handleOptimizeAllSectionsStep)
        
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
    public async executeWorkflow(workflowName: string, params: WorkflowParams): Promise<boolean | WorkflowSpecialResult> {
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
            const result = await this.executeWorkflow(currentWorkflow, workflowParams)
            
            // 检查是否有特殊返回值
            if (result && typeof result === 'object' && result.type === 'optimize_all_sections') {
                // 工作流请求优化所有部分
                return {
                    nextStep: "optimize_all_sections",
                    message: "准备一次性优化所有框架部分..."
                }
            }
            
            // 处理普通的布尔返回值
            if (result === true) {
                // 成功完成工作流
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
            { id: "genre", title: "小说题材", workflow: "genre" },
            { id: "character", title: "角色设计", workflow: "character" },
            { id: "plot", title: "情节大纲", workflow: "plot" },
            { id: "world", title: "世界观设定", workflow: "world" },
            { id: "theme", title: "主题元素", workflow: "theme" },
            { id: "chapter-outline", title: "章节规划", workflow: "chapter-outline" },
            { id: "style", title: "叙事风格", workflow: "style" },
            { id: "writing-technique", title: "写作手法", workflow: "writing-technique" },
            { id: "market", title: "市场定位", workflow: "market" },
            { id: "tech", title: "系统设定", workflow: "tech" },
            { id: "emotion", title: "情感设计", workflow: "emotion" },
            { id: "reflection", title: "自我反思", workflow: "reflection" },
            { id: "plan", title: "创作计划", workflow: "plan" },
            { id: "guidelines", title: "创作注意事项", workflow: "guidelines" }
        ]
        
        // 获取当前工作流索引
        let currentIndex = state.currentWorkflowIndex !== undefined ? state.currentWorkflowIndex : 0
        
        // 如果索引超出范围，回到第一个
        if (currentIndex < 0 || currentIndex >= frameworkSections.length) {
            currentIndex = 0
        }
        
        // 获取当前要处理的部分
        const currentSection = frameworkSections[currentIndex]
        
        // 构建选项列表 - 初始阶段的选项
        const options = [
            "完善此部分", 
            "跳过此部分"
        ]
        
        // 只有在工作流开始时才显示这些选项，避免重复显示
        if (!state.hasEnteredWorkflow) {
            options.push("跳到指定部分")
            options.push("优化所有架构内容")
            options.push("结束框架完善并切换到写作模式")
            options.push("结束框架完善")
        }
        
        // 使用askUser方法询问用户是否要完善当前部分
        const userChoice = await params.askUser(
            `现在将完善"${currentSection.title}"部分，您希望如何继续？\n\n这是第 ${currentIndex + 1}/${frameworkSections.length} 个部分。`,
            options
        )
        
        // 处理用户选择
        if (userChoice.includes("1") || userChoice.toLowerCase().includes("完善此部分")) {
            // 用户选择完善当前部分
            const selectedOption = {
                id: currentSection.id,
                title: currentSection.title,
                description: `完善${currentSection.title}部分`,
                area: currentSection.workflow
            }
            
            pushToolResult(`您选择了完善: ${selectedOption.title}`)
            
            return {
                nextStep: "execute_workflow",
                message: `您选择了完善: ${selectedOption.title}`,
                stateUpdates: {
                    selectedOption,
                    currentWorkflow: selectedOption.area,
                    currentWorkflowIndex: currentIndex,
                    hasEnteredWorkflow: true // 标记已进入工作流
                }
            }
        } else if (userChoice.includes("2") || userChoice.toLowerCase().includes("跳过")) {
            // 用户选择跳过当前部分
            pushToolResult(`您选择了跳过${currentSection.title}部分`)
            
            // 移动到下一个部分
            return {
                nextStep: "ordered_workflow",
                stateUpdates: {
                    currentWorkflowIndex: currentIndex + 1,
                    hasEnteredWorkflow: true // 标记已进入工作流
                }
            }
        } else if ((userChoice.includes("3") || userChoice.toLowerCase().includes("跳到指定")) && !state.hasEnteredWorkflow) {
            // 用户选择跳到指定部分
            // 构建部分选项列表
            const sectionOptions = frameworkSections.map((section, idx) => 
                `${section.title} (${idx + 1}/${frameworkSections.length})`
            )
            
            // 询问用户想跳到哪个部分
            const sectionChoice = await params.askUser(
                "请选择您想要跳转到的部分：",
                sectionOptions
            )
            
            // 确定选择的索引
            let targetIndex = 0
            for (let i = 0; i < sectionOptions.length; i++) {
                if (sectionChoice.includes(`${i + 1}`) || sectionChoice.includes(frameworkSections[i].title)) {
                    targetIndex = i
                    break
                }
            }
            
            pushToolResult(`您选择了跳转到: ${frameworkSections[targetIndex].title}`)
            
            // 跳转到选定部分
            return {
                nextStep: "ordered_workflow",
                stateUpdates: {
                    currentWorkflowIndex: targetIndex,
                    hasEnteredWorkflow: true // 标记已进入工作流
                }
            }
        } else if ((userChoice.includes("4") || userChoice.toLowerCase().includes("优化所有")) && !state.hasEnteredWorkflow) {
            // 用户选择优化所有架构内容
            pushToolResult("您选择了优化所有架构内容，将一次性优化所有部分。")
            
            // 调用优化所有部分步骤
            return {
                nextStep: "optimize_all_sections",
                message: "准备一次性优化所有框架部分...",
                stateUpdates: {
                    hasEnteredWorkflow: true // 标记已进入工作流
                }
            }
        } else if ((userChoice.includes("5") || userChoice.toLowerCase().includes("切换到写作")) && !state.hasEnteredWorkflow) {
            // 用户选择结束框架完善并切换到写作模式
            pushToolResult("您选择了结束框架完善并切换到写作模式。")
            
            return {
                nextStep: "complete",
                message: "准备切换到写作模式。",
                completed: true,
                stateUpdates: {
                    switchToWriterMode: true
                }
            }
        } else {
            // 用户选择结束框架完善
            pushToolResult("您选择了结束框架完善。框架已保存。")
            
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
        
        // 获取当前工作流信息
        const currentWorkflow = state.currentWorkflow
        const selectedOption = state.selectedOption
        
        // 定义框架的标准部分
        const frameworkSections = [
            { id: "genre", title: "小说题材", workflow: "genre" },
            { id: "character", title: "角色设计", workflow: "character" },
            { id: "plot", title: "情节大纲", workflow: "plot" },
            { id: "world", title: "世界观设定", workflow: "world" },
            { id: "theme", title: "主题元素", workflow: "theme" },
            { id: "chapter-outline", title: "章节规划", workflow: "chapter-outline" },
            { id: "style", title: "叙事风格", workflow: "style" },
            { id: "writing-technique", title: "写作手法", workflow: "writing-technique" },
            { id: "market", title: "市场定位", workflow: "market" },
            { id: "tech", title: "系统设定", workflow: "tech" },
            { id: "emotion", title: "情感设计", workflow: "emotion" },
            { id: "reflection", title: "自我反思", workflow: "reflection" },
            { id: "plan", title: "创作计划", workflow: "plan" },
            { id: "guidelines", title: "创作注意事项", workflow: "guidelines" }
        ]
        
        // 获取当前工作流索引
        let currentIndex = state.currentWorkflowIndex !== undefined ? state.currentWorkflowIndex : 0
        
        // 构建选项提示信息
        let promptMessage = ""
        if (selectedOption) {
            promptMessage = `您已完成"${selectedOption.title}"部分的完善。\n\n`
        }
        
        promptMessage += `这是第 ${currentIndex + 1}/${frameworkSections.length} 个部分。\n\n您希望如何继续？`
        
        // 构建选项列表 - 后续阶段的选项
        const continueOptions = [
            "继续完善当前部分",
            "移动到下一个部分"
        ]
        
        // 只有在完成一个部分的工作流后才显示这些高级选项
        if (state.hasEnteredWorkflow) {
            continueOptions.push("跳到指定部分")
            continueOptions.push("优化所有架构内容")
            continueOptions.push("结束框架完善并切换到写作模式")
            continueOptions.push("结束框架完善")
        }
        
        // 使用askUser方法询问用户
        const userChoice = await params.askUser(
            promptMessage, 
            continueOptions
        )
        
        // 处理用户选择
        if (userChoice.includes("1") || userChoice.toLowerCase().includes("继续完善当前")) {
            // 用户选择继续完善当前部分
            pushToolResult("您选择了继续完善当前部分。")
            return {
                nextStep: "execute_workflow",
                stateUpdates: {
                    continueInCurrentSection: true
                }
            }
        } else if (userChoice.includes("2") || userChoice.toLowerCase().includes("移动到下一个")) {
            // 用户选择移动到下一个部分
            pushToolResult("您选择了移动到下一个部分。")
            
            // 如果已经是最后一个部分，询问是否切换到写作模式
            if (currentIndex >= frameworkSections.length - 1) {
                const switchChoice = await params.askUser(
                    "您已完成所有部分的完善。是否要切换到文字生成模式开始写作？",
                    ["是，开始写作", "否，结束框架完善"]
                )
                
                if (switchChoice.includes("1") || switchChoice.toLowerCase().includes("是")) {
                    return {
                        nextStep: "complete",
                        message: "准备切换到写作模式。",
                        completed: true,
                        stateUpdates: {
                            switchToWriterMode: true
                        }
                    }
                } else {
                    return {
                        nextStep: "complete",
                        message: "框架完善已结束。",
                        completed: true
                    }
                }
            }
            
            return {
                nextStep: "ordered_workflow",
                stateUpdates: {
                    continueInCurrentSection: false,
                    currentWorkflowIndex: currentIndex + 1
                }
            }
        } else if ((userChoice.includes("3") || userChoice.toLowerCase().includes("跳到指定")) && state.hasEnteredWorkflow) {
            // 用户选择跳到指定部分
            // 构建部分选项列表
            const sectionOptions = frameworkSections.map((section, idx) => 
                `${section.title} (${idx + 1}/${frameworkSections.length})`
            )
            
            // 询问用户想跳到哪个部分
            const sectionChoice = await params.askUser(
                "请选择您想要跳转到的部分：",
                sectionOptions
            )
            
            // 确定选择的索引
            let targetIndex = 0
            for (let i = 0; i < sectionOptions.length; i++) {
                if (sectionChoice.includes(`${i + 1}`) || sectionChoice.includes(frameworkSections[i].title)) {
                    targetIndex = i
                    break
                }
            }
            
            pushToolResult(`您选择了跳转到: ${frameworkSections[targetIndex].title}`)
            
            // 跳转到选定部分
            return {
                nextStep: "ordered_workflow",
                stateUpdates: {
                    currentWorkflowIndex: targetIndex
                }
            }
        } else if ((userChoice.includes("4") || userChoice.toLowerCase().includes("优化所有")) && state.hasEnteredWorkflow) {
            // 用户选择优化所有架构内容
            pushToolResult("您选择了优化所有架构内容，将一次性优化所有部分。")
            
            // 调用优化所有部分步骤
            return {
                nextStep: "optimize_all_sections",
                message: "准备一次性优化所有框架部分..."
            }
        } else if ((userChoice.includes("5") || userChoice.toLowerCase().includes("切换到写作")) && state.hasEnteredWorkflow) {
            // 用户选择结束框架完善并切换到写作模式
            pushToolResult("您选择了结束框架完善并切换到写作模式。")
            
            return {
                nextStep: "complete",
                message: "准备切换到写作模式。",
                completed: true,
                stateUpdates: {
                    switchToWriterMode: true
                }
            }
        } else {
            // 用户选择结束框架完善
            pushToolResult("您选择了结束框架完善。")
            return {
                nextStep: "complete",
                message: "框架完善已结束。",
                completed: true
            }
        }
    }
    
    /**
     * 处理优化所有部分步骤
     */
    private handleOptimizeAllSectionsStep = async (params: StepParams): Promise<StepResult> => {
        const { cline, frameworkPath, state, askApproval, handleError, pushToolResult, removeClosingTag } = params
        
        // 定义框架的标准部分
        const frameworkSections = [
            { id: "genre", title: "小说题材", workflow: "genre" },
            { id: "character", title: "角色设计", workflow: "character" },
            { id: "plot", title: "情节大纲", workflow: "plot" },
            { id: "world", title: "世界观设定", workflow: "world" },
            { id: "theme", title: "主题元素", workflow: "theme" },
            { id: "chapter-outline", title: "章节规划", workflow: "chapter-outline" },
            { id: "style", title: "叙事风格", workflow: "style" },
            { id: "writing-technique", title: "写作手法", workflow: "writing-technique" },
            { id: "market", title: "市场定位", workflow: "market" },
            { id: "tech", title: "系统设定", workflow: "tech" },
            { id: "emotion", title: "情感设计", workflow: "emotion" },
            { id: "reflection", title: "自我反思", workflow: "reflection" },
            { id: "plan", title: "创作计划", workflow: "plan" },
            { id: "guidelines", title: "创作注意事项", workflow: "guidelines" }
        ]
        
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
        
        // 通知用户开始优化所有部分
        pushToolResult("开始一次性优化所有框架部分，这可能需要一些时间...")
        
        // 构建提示词
        const prompt = `
请分析并优化以下小说框架的所有部分。这个框架包含14个标准部分，请一次性优化所有部分，使其更加完整、连贯和有创意。

当前框架内容：
${frameworkContent}

请提供优化后的完整框架内容，保持原有的Markdown格式和部分标题。
`
        
        try {
            // 调用AI优化所有部分
            const response = await cline.say(
                "user",
                prompt,
                {
                    system: "你是一位专业的小说框架优化专家，擅长分析和优化小说框架的各个部分，使其更加完整、连贯和有创意。"
                }
            )
            
            // 获取AI回复内容
            const optimizedContent = response?.content?.parts?.[0]?.text || ""
            
            // 如果回复内容为空，返回错误
            if (!optimizedContent) {
                pushToolResult("优化失败，未能获取优化结果。")
                return {
                    nextStep: "ordered_workflow",
                    message: "优化失败，请尝试逐个部分进行优化。",
                    stateUpdates: {
                        currentWorkflowIndex: 0
                    }
                }
            }
            
            // 写入优化后的内容
            try {
                await fs.writeFile(fullPath, optimizedContent, "utf8")
                pushToolResult("所有框架部分已一次性优化完成！")
            } catch (error) {
                pushToolResult(`写入文件时出错: ${(error as Error).message}`)
                return {
                    nextStep: "ordered_workflow",
                    message: "写入文件失败，请尝试逐个部分进行优化。",
                    stateUpdates: {
                        currentWorkflowIndex: 0
                    }
                }
            }
            
            // 询问用户下一步操作
            const nextChoice = await params.askUser(
                "所有框架部分已一次性优化完成！您希望如何继续？",
                ["继续逐个完善部分", "结束框架完善并切换到写作模式", "结束框架完善"]
            )
            
            if (nextChoice.includes("1") || nextChoice.toLowerCase().includes("继续")) {
                // 用户选择继续逐个完善部分
                return {
                    nextStep: "ordered_workflow",
                    stateUpdates: {
                        currentWorkflowIndex: 0
                    }
                }
            } else if (nextChoice.includes("2") || nextChoice.toLowerCase().includes("切换到写作")) {
                // 用户选择结束框架完善并切换到写作模式
                return {
                    nextStep: "complete",
                    message: "准备切换到写作模式。",
                    completed: true,
                    stateUpdates: {
                        switchToWriterMode: true
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
        } catch (error) {
            pushToolResult(`优化过程中出错: ${(error as Error).message}`)
            return {
                nextStep: "ordered_workflow",
                message: "优化过程中出错，请尝试逐个部分进行优化。",
                stateUpdates: {
                    currentWorkflowIndex: 0
                }
            }
        }
    }
    
    /**
     * 处理完成步骤
     */
    private handleCompleteStep = async (params: StepParams): Promise<StepResult> => {
        const { pushToolResult } = params
        
        // 显示完成消息
        pushToolResult("框架完善已完成。您可以随时使用novel-framework-refine工具继续完善框架。")
        
        // 清除状态
        await this._stateManager.clearState()
        
        // 询问是否切换到写作模式
        const switchChoice = await params.askUser(
            "是否要切换到文字生成模式开始写作？",
            ["是，开始写作", "否，稍后再写"]
        )
        
        if (switchChoice.includes("1") || switchChoice.toLowerCase().includes("是")) {
            // 用户选择切换到写作模式
            return {
                nextStep: "complete",
                message: "准备切换到写作模式。",
                completed: true,
                stateUpdates: {
                    switchToWriterMode: true
                }
            }
        }
        
        return {
            nextStep: "complete",
            message: "框架完善已完成。",
            completed: true
        }
    }
} 