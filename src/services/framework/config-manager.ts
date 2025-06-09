import * as vscode from "vscode"

/**
 * 框架服务配置
 */
export interface FrameworkConfig {
    /**
     * 是否启用框架服务
     */
    enabled: boolean
    
    /**
     * 是否使用预定义模板
     */
    useTemplate: boolean
    
    /**
     * 是否简化任务结构
     */
    simplifyTasks: boolean
    
    /**
     * 默认关注区域
     */
    defaultArea: string
}

/**
 * 框架服务配置管理器
 */
export class FrameworkConfigManager {
    private static instance: FrameworkConfigManager
    
    // 配置项
    private _enabled: boolean = true
    private _useTemplate: boolean = true
    private _simplifyTasks: boolean = true
    private _defaultArea: string = "all"
    
    /**
     * 获取配置管理器实例（单例模式）
     */
    public static getInstance(): FrameworkConfigManager {
        if (!FrameworkConfigManager.instance) {
            FrameworkConfigManager.instance = new FrameworkConfigManager()
        }
        return FrameworkConfigManager.instance
    }
    
    /**
     * 私有构造函数，确保单例模式
     */
    private constructor() {
        // 私有构造函数，防止外部直接实例化
    }
    
    /**
     * 初始化配置管理器
     */
    public initialize(): void {
        this.loadConfiguration()
    }
    
    /**
     * 加载配置
     */
    public loadConfiguration(): void {
        const config = vscode.workspace.getConfiguration("roo.framework")
        
        this._enabled = config.get<boolean>("enabled", true)
        this._useTemplate = config.get<boolean>("useTemplate", true)
        this._simplifyTasks = config.get<boolean>("simplifyTasks", true)
        this._defaultArea = config.get<string>("defaultArea", "all")
    }
    
    /**
     * 获取当前配置
     */
    public getConfig(): FrameworkConfig {
        return {
            enabled: this._enabled,
            useTemplate: this._useTemplate,
            simplifyTasks: this._simplifyTasks,
            defaultArea: this._defaultArea
        }
    }
    
    /**
     * 更新配置
     * @param config 要更新的配置
     */
    public async updateConfig(config: Partial<FrameworkConfig>): Promise<void> {
        const vscodeConfig = vscode.workspace.getConfiguration("roo.framework")
        
        if (config.enabled !== undefined) {
            await vscodeConfig.update("enabled", config.enabled, true)
            this._enabled = config.enabled
        }
        
        if (config.useTemplate !== undefined) {
            await vscodeConfig.update("useTemplate", config.useTemplate, true)
            this._useTemplate = config.useTemplate
        }
        
        if (config.simplifyTasks !== undefined) {
            await vscodeConfig.update("simplifyTasks", config.simplifyTasks, true)
            this._simplifyTasks = config.simplifyTasks
        }
        
        if (config.defaultArea !== undefined) {
            await vscodeConfig.update("defaultArea", config.defaultArea, true)
            this._defaultArea = config.defaultArea
        }
    }
    
    /**
     * 服务是否启用
     * 只有在小说框架模式下才启用此服务
     */
    public get isEnabled(): boolean {
        // 检查当前模式是否为小说框架模式
        const currentMode = this.getCurrentMode()
        // 只要在小说框架模式下就自动启用服务
        return currentMode === "planner"
    }
    
    /**
     * 获取当前模式
     * @returns 当前模式的slug
     */
    private getCurrentMode(): string {
        try {
            // 从全局状态获取当前模式
            const globalState = vscode.workspace.getConfiguration("roo-ainovel").get("globalState") as any
            if (globalState && globalState.mode) {
                return globalState.mode
            }
            
            // 从扩展状态获取当前模式
            const extensionState = vscode.workspace.getConfiguration("roo-ainovel").get("extensionState") as any
            if (extensionState && extensionState.mode) {
                return extensionState.mode
            }
        } catch (error) {
            console.error("获取当前模式失败:", error)
        }
        
        return ""
    }
    
    /**
     * 是否使用预定义模板
     */
    public get useTemplate(): boolean {
        return this._useTemplate
    }
    
    /**
     * 是否简化任务结构
     */
    public get simplifyTasks(): boolean {
        return this._simplifyTasks
    }
    
    /**
     * 默认关注区域
     */
    public get defaultArea(): string {
        return this._defaultArea
    }
} 