import * as fs from "fs/promises"
import * as path from "path"
import * as vscode from "vscode"
import { RefinementOption } from "./types"

/**
 * 小说框架完善工具的状态类型
 */
export type FrameworkState = {
    // 基本信息
    frameworkPath: string
    currentStep: string
    previousStep?: string
    
    // 当前工作流程状态
    currentWorkflow?: string
    workflowStep?: number
    
    // 框架分析结果
    existingSections: string[]
    missingSections: string[]
    
    // 用户选择
    selectedOption?: RefinementOption
    userChoice?: string
    
    // 其他状态
    isOptimizeOrComplete?: boolean
    continueInCurrentSection?: boolean
    
    // 时间戳
    lastUpdated: number
}

/**
 * 小说框架完善工具的状态管理器
 * 负责保存和恢复工作流程的状态
 */
export class FrameworkStateManager {
    private static instance: FrameworkStateManager
    private _state: FrameworkState | null = null
    private _stateFile: string = ""
    private _context: vscode.ExtensionContext | null = null
    
    /**
     * 获取状态管理器实例（单例模式）
     */
    public static getInstance(): FrameworkStateManager {
        if (!FrameworkStateManager.instance) {
            FrameworkStateManager.instance = new FrameworkStateManager()
        }
        return FrameworkStateManager.instance
    }
    
    /**
     * 初始化状态管理器
     * @param context VSCode扩展上下文
     * @param workspacePath 工作区路径
     */
    public initialize(context: vscode.ExtensionContext, workspacePath: string): void {
        this._context = context
        
        // 创建状态文件路径
        const stateDir = path.join(workspacePath, ".roo", "framework-states")
        this._stateFile = path.join(stateDir, "current-state.json")
        
        // 确保目录存在
        this.ensureDirectoryExists(stateDir).catch(err => {
            console.error("创建状态目录失败:", err)
        })
    }
    
    /**
     * 确保目录存在
     * @param dir 目录路径
     */
    private async ensureDirectoryExists(dir: string): Promise<void> {
        try {
            await fs.mkdir(dir, { recursive: true })
        } catch (error) {
            console.error("创建目录失败:", error)
        }
    }
    
    /**
     * 创建新的状态
     * @param frameworkPath 框架文件路径
     * @returns 新创建的状态
     */
    public createState(frameworkPath: string): FrameworkState {
        this._state = {
            frameworkPath,
            currentStep: "init",
            existingSections: [],
            missingSections: [],
            lastUpdated: Date.now()
        }
        
        return this._state
    }
    
    /**
     * 获取当前状态
     * @returns 当前状态，如果不存在则返回null
     */
    public getState(): FrameworkState | null {
        return this._state
    }
    
    /**
     * 更新状态
     * @param updates 要更新的状态字段
     * @returns 更新后的状态
     */
    public updateState(updates: Partial<FrameworkState>): FrameworkState {
        if (!this._state) {
            throw new Error("状态未初始化，请先调用createState或loadState")
        }
        
        // 更新状态
        this._state = {
            ...this._state,
            ...updates,
            lastUpdated: Date.now()
        }
        
        // 保存状态
        this.saveState().catch(err => {
            console.error("保存状态失败:", err)
        })
        
        return this._state
    }
    
    /**
     * 保存状态到文件
     */
    public async saveState(): Promise<void> {
        if (!this._state || !this._stateFile) {
            return
        }
        
        try {
            // 确保目录存在
            await this.ensureDirectoryExists(path.dirname(this._stateFile))
            
            // 写入文件
            await fs.writeFile(this._stateFile, JSON.stringify(this._state, null, 2), "utf8")
            
            // 同时保存到VSCode扩展上下文
            if (this._context) {
                this._context.workspaceState.update("frameworkState", this._state)
            }
        } catch (error) {
            console.error("保存状态失败:", error)
        }
    }
    
    /**
     * 从文件加载状态
     * @returns 加载的状态，如果加载失败则返回null
     */
    public async loadState(): Promise<FrameworkState | null> {
        try {
            // 首先尝试从VSCode扩展上下文加载
            if (this._context) {
                const contextState = this._context.workspaceState.get<FrameworkState>("frameworkState")
                if (contextState) {
                    this._state = contextState
                    return this._state
                }
            }
            
            // 如果上下文中没有，尝试从文件加载
            if (this._stateFile) {
                const data = await fs.readFile(this._stateFile, "utf8")
                this._state = JSON.parse(data) as FrameworkState
                return this._state
            }
        } catch (error) {
            console.error("加载状态失败:", error)
        }
        
        return null
    }
    
    /**
     * 清除状态
     */
    public async clearState(): Promise<void> {
        this._state = null
        
        // 清除VSCode扩展上下文中的状态
        if (this._context) {
            this._context.workspaceState.update("frameworkState", undefined)
        }
        
        // 删除状态文件
        if (this._stateFile) {
            try {
                await fs.unlink(this._stateFile)
            } catch (error) {
                // 忽略文件不存在的错误
                if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
                    console.error("删除状态文件失败:", error)
                }
            }
        }
    }
    
    /**
     * 检查是否有有效的状态
     * @param frameworkPath 框架文件路径
     * @returns 如果有有效的状态且匹配指定的框架文件路径，则返回true
     */
    public async hasValidState(frameworkPath: string): Promise<boolean> {
        // 加载状态
        const state = await this.loadState()
        
        // 检查状态是否有效
        if (!state) {
            return false
        }
        
        // 检查框架文件路径是否匹配
        if (state.frameworkPath !== frameworkPath) {
            return false
        }
        
        // 检查状态是否过期（24小时）
        const now = Date.now()
        const expireTime = 24 * 60 * 60 * 1000 // 24小时
        if (now - state.lastUpdated > expireTime) {
            return false
        }
        
        return true
    }
} 