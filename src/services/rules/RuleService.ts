import * as vscode from "vscode"
import * as fs from "fs/promises"
import * as path from "path"
import { fileExistsAtPath } from "../../utils/fs"
import { getWorkspacePath } from "../../utils/path"
import { loadRuleFiles, processNovelFramework } from "../../core/prompts/sections/custom-instructions"

/**
 * 规则文件类型
 */
export enum RuleType {
    FRAMEWORK = "framework", // 框架规则
    WRITING_GUIDE = "writing_guide", // 写作指南
    CHARACTER = "character", // 角色规则
    WORLD = "world", // 世界观规则
    PLOT = "plot", // 情节规则
    CUSTOM = "custom" // 自定义规则
}

/**
 * 规则文件信息
 */
export interface RuleFile {
    path: string
    type: RuleType
    content: string
    name: string
}

/**
 * 应用规则的模式
 */
export enum RuleApplicableMode {
    WRITER = "writer", // 文字生成模式
    EXPAND = "expand", // 扩写模式
    OPTIMIZE = "optimize", // 优化模式
    SCRIPT = "script", // 剧本模式
    ALL = "all" // 所有模式
}

/**
 * 规则服务接口
 */
export interface IRuleService {
    /**
     * 初始化服务
     */
    initialize(): Promise<void>

    /**
     * 获取适用于指定模式的规则
     * @param mode 模式名称
     * @returns 规则文件列表
     */
    getRulesForMode(mode: string): Promise<RuleFile[]>

    /**
     * 加载规则文件
     * @param filePath 文件路径
     * @returns 规则文件内容
     */
    loadRuleFile(filePath: string): Promise<RuleFile | null>

    /**
     * 应用规则到提示词
     * @param prompt 原始提示词
     * @param rules 规则文件列表
     * @returns 应用规则后的提示词
     */
    applyRulesToPrompt(prompt: string, rules: RuleFile[]): string

    /**
     * 获取上一章的总结内容
     * @param currentChapterPath 当前章节路径
     * @returns 上一章的总结内容
     */
    getPreviousChapterSummary(currentChapterPath: string): Promise<string>

    /**
     * 规划章节内容
     * @param rules 规则文件列表
     * @param previousChapterSummary 上一章的总结内容
     * @param chapterTitle 章节标题
     * @returns 章节内容规划
     */
    planChapterContent(rules: RuleFile[], previousChapterSummary: string, chapterTitle: string): Promise<string>
}

/**
 * 规则服务实现
 */
export class RuleService implements IRuleService {
    private static instance: RuleService
    private rulesCache: Map<string, RuleFile> = new Map()
    private applicableRules: Map<string, RuleFile[]> = new Map()

    private constructor() {}

    /**
     * 获取规则服务实例
     */
    public static getInstance(): RuleService {
        if (!RuleService.instance) {
            RuleService.instance = new RuleService()
        }
        return RuleService.instance
    }

    /**
     * 初始化服务
     */
    public async initialize(): Promise<void> {
        // 清空缓存
        this.rulesCache.clear()
        this.applicableRules.clear()

        // 预加载常用规则
        const workspacePath = getWorkspacePath()
        if (!workspacePath) return

        try {
            // 查找规则文件
            const rulesDir = path.join(workspacePath, ".rules")
            try {
                await fs.mkdir(rulesDir, { recursive: true })
            } catch (error) {
                // 目录可能已存在，忽略错误
            }

            // 加载.rules目录中的规则文件
            try {
                const files = await fs.readdir(rulesDir)
                for (const file of files) {
                    if (file.endsWith(".md")) {
                        const filePath = path.join(rulesDir, file)
                        const ruleFile = await this.loadRuleFile(filePath)
                        if (ruleFile) {
                            this.rulesCache.set(filePath, ruleFile)
                        }
                    }
                }
            } catch (error) {
                console.error("加载规则文件时出错:", error)
            }
            
            // 查找工作区根目录中的规则文件（.rules.开头的文件）
            try {
                const rootFiles = await fs.readdir(workspacePath)
                for (const file of rootFiles) {
                    if (file.startsWith(".rules.") && file.endsWith(".md")) {
                        const filePath = path.join(workspacePath, file)
                        const ruleFile = await this.loadRuleFile(filePath)
                        if (ruleFile) {
                            this.rulesCache.set(filePath, ruleFile)
                        }
                    }
                }
            } catch (error) {
                console.error("加载根目录规则文件时出错:", error)
            }
            
            // 如果没有找到任何规则文件，添加默认规则
            if (this.rulesCache.size === 0) {
                console.log("未找到规则文件，添加默认规则")
                await this.addDefaultRules()
            }

            // 初始化适用规则映射
            this.initializeApplicableRules()
        } catch (error) {
            console.error("初始化规则服务时出错:", error)
        }
    }
    
    /**
     * 添加默认规则
     */
    private async addDefaultRules(): Promise<void> {
        // 创建默认框架规则
        const defaultFrameworkRule: RuleFile = {
            path: "default-framework",
            type: RuleType.FRAMEWORK,
            name: "默认小说框架",
            content: `# 默认小说框架

## 基本结构
- 开端：引入主要角色和背景设定
- 发展：冲突逐渐展开和升级
- 高潮：冲突达到顶点
- 结局：冲突得到解决

## 角色设计
- 主角：有明确目标和动机
- 配角：辅助或阻碍主角
- 反派：与主角形成对立

## 情节发展
- 起因：引发故事的事件
- 经过：角色为达成目标而采取的行动
- 结果：行动的后果和影响

## 叙事技巧
- 视角：选择合适的叙述视角
- 节奏：控制故事的快慢节奏
- 悬念：保持读者兴趣

## 写作风格
- 保持语言流畅自然
- 避免过度使用形容词
- 通过对话和行动展示角色性格`
        }
        
        // 创建默认写作指南规则
        const defaultWritingGuideRule: RuleFile = {
            path: "default-writing-guide",
            type: RuleType.WRITING_GUIDE,
            name: "默认写作指南",
            content: `# 默认写作指南

## 语言风格
- 使用简洁明了的语言
- 避免冗长的句子
- 保持语言的一致性

## 场景描写
- 使用多种感官描写
- 重点突出关键细节
- 通过环境反映角色情绪

## 对话技巧
- 对话应推动情节发展
- 展现角色个性和关系
- 避免无意义的对话

## 人物刻画
- 通过行动展示性格
- 设置内在冲突和成长
- 保持角色行为的一致性

## 去AI化技巧
- 增加语言的多样性和情感波动
- 适当添加思维跳跃和人文化表达
- 避免过于完美和理性的角色
- 创造具有缺陷和矛盾的真实角色`
        }
        
        // 将默认规则添加到缓存中
        this.rulesCache.set(defaultFrameworkRule.path, defaultFrameworkRule)
        this.rulesCache.set(defaultWritingGuideRule.path, defaultWritingGuideRule)
    }

    /**
     * 初始化适用规则映射
     */
    private initializeApplicableRules(): void {
        // 清空映射
        this.applicableRules.clear()

        // 为每种模式创建空数组
        this.applicableRules.set(RuleApplicableMode.WRITER, [])
        this.applicableRules.set(RuleApplicableMode.EXPAND, [])
        this.applicableRules.set(RuleApplicableMode.OPTIMIZE, [])
        this.applicableRules.set(RuleApplicableMode.SCRIPT, [])

        // 将规则分配到适用的模式
        for (const ruleFile of this.rulesCache.values()) {
            // 所有类型的规则都适用于四个指定模式
            for (const mode of Object.values(RuleApplicableMode)) {
                if (mode !== RuleApplicableMode.ALL) {
                    const rules = this.applicableRules.get(mode) || []
                    rules.push(ruleFile)
                    this.applicableRules.set(mode, rules)
                }
            }
        }
    }

    /**
     * 获取适用于指定模式的规则
     * @param mode 模式名称
     * @returns 规则文件列表
     */
    public async getRulesForMode(mode: string): Promise<RuleFile[]> {
        // 如果没有缓存，尝试初始化
        if (this.applicableRules.size === 0) {
            await this.initialize()
        }

        // 将mode转换为RuleApplicableMode
        let applicableMode: RuleApplicableMode
        switch (mode) {
            case "writer":
                applicableMode = RuleApplicableMode.WRITER
                break
            case "expand":
                applicableMode = RuleApplicableMode.EXPAND
                break
            case "optimize":
                applicableMode = RuleApplicableMode.OPTIMIZE
                break
            case "script":
                applicableMode = RuleApplicableMode.SCRIPT
                break
            default:
                return [] // 不支持的模式返回空数组
        }

        return this.applicableRules.get(applicableMode) || []
    }

    /**
     * 加载规则文件
     * @param filePath 文件路径
     * @returns 规则文件内容
     */
    public async loadRuleFile(filePath: string): Promise<RuleFile | null> {
        try {
            // 检查文件是否存在
            if (!(await fileExistsAtPath(filePath))) {
                return null
            }

            // 读取文件内容
            const content = await fs.readFile(filePath, "utf8")
            if (!content) {
                return null
            }

            // 确定规则类型
            let type = RuleType.CUSTOM
            const fileName = path.basename(filePath).toLowerCase()

            if (fileName.includes("framework") || fileName.includes("框架")) {
                type = RuleType.FRAMEWORK
            } else if (fileName.includes("guide") || fileName.includes("指南")) {
                type = RuleType.WRITING_GUIDE
            } else if (fileName.includes("character") || fileName.includes("角色")) {
                type = RuleType.CHARACTER
            } else if (fileName.includes("world") || fileName.includes("世界")) {
                type = RuleType.WORLD
            } else if (fileName.includes("plot") || fileName.includes("情节")) {
                type = RuleType.PLOT
            }
            
            // 处理框架内容，提取结构化信息
            let processedContent = content
            if (type === RuleType.FRAMEWORK) {
                try {
                    // 使用processNovelFramework处理框架内容
                    processedContent = await processNovelFramework(content)
                } catch (error) {
                    console.error("处理框架内容时出错:", error)
                    // 出错时保留原始内容
                }
            }

            // 创建规则文件对象
            const ruleFile: RuleFile = {
                path: filePath,
                type,
                content: processedContent,
                name: path.basename(filePath)
            }

            // 缓存规则文件
            this.rulesCache.set(filePath, ruleFile)

            return ruleFile
        } catch (error) {
            console.error(`加载规则文件 ${filePath} 时出错:`, error)
            return null
        }
    }

    /**
     * 应用规则到提示词
     * @param prompt 原始提示词
     * @param rules 规则文件列表
     * @returns 应用规则后的提示词
     */
    public applyRulesToPrompt(prompt: string, rules: RuleFile[]): string {
        if (!rules || rules.length === 0) {
            return prompt
        }

        // 构建规则内容
        let rulesContent = "## 创作规则和指南\n\n"
        for (const rule of rules) {
            rulesContent += `### ${rule.name}\n\n`
            
            // 处理框架文件内容
            if (rule.type === RuleType.FRAMEWORK) {
                try {
                    const processedContent = processNovelFramework(rule.content)
                    rulesContent += processedContent + "\n\n"
                } catch (error) {
                    rulesContent += rule.content + "\n\n"
                }
            } else {
                rulesContent += rule.content + "\n\n"
            }
        }

        // 将规则内容添加到提示词中
        return `${rulesContent}\n\n${prompt}`
    }

    /**
     * 获取上一章的总结内容
     * @param currentChapterPath 当前章节路径
     * @returns 上一章的总结内容
     */
    public async getPreviousChapterSummary(currentChapterPath: string): Promise<string> {
        try {
            // 获取当前章节的目录和文件名
            const dir = path.dirname(currentChapterPath)
            const currentFileName = path.basename(currentChapterPath)
            
            // 提取章节序号
            const chapterMatch = currentFileName.match(/第(\d+)章/)
            if (!chapterMatch || chapterMatch.length < 2) {
                return "未找到上一章节信息。"
            }
            
            const currentChapterNum = parseInt(chapterMatch[1])
            if (isNaN(currentChapterNum) || currentChapterNum <= 1) {
                return "这是第一章，没有上一章内容。"
            }
            
            // 查找上一章文件
            const previousChapterNum = currentChapterNum - 1
            const files = await fs.readdir(dir)
            
            let previousChapterFile = null
            for (const file of files) {
                const prevMatch = file.match(/第(\d+)章/)
                if (prevMatch && prevMatch.length >= 2) {
                    const chapterNum = parseInt(prevMatch[1])
                    if (chapterNum === previousChapterNum) {
                        previousChapterFile = file
                        break
                    }
                }
            }
            
            if (!previousChapterFile) {
                return "未找到上一章文件。"
            }
            
            // 读取上一章内容
            const previousChapterPath = path.join(dir, previousChapterFile)
            const content = await fs.readFile(previousChapterPath, "utf8")
            
            // 如果内容太长，返回摘要
            if (content.length > 5000) {
                return content.substring(0, 5000) + "...\n\n[内容过长，已截断]"
            }
            
            return content
        } catch (error) {
            console.error("获取上一章总结时出错:", error)
            return "获取上一章内容时出错。"
        }
    }

    /**
     * 规划章节内容
     * @param rules 规则文件列表
     * @param previousChapterSummary 上一章的总结内容
     * @param chapterTitle 章节标题
     * @returns 章节内容规划
     */
    public async planChapterContent(
        rules: RuleFile[],
        previousChapterSummary: string,
        chapterTitle: string
    ): Promise<string> {
        // 构建规划提示词
        const planningPrompt = `
# 章节内容规划

## 参考资料
### 上一章内容摘要
${previousChapterSummary}

### 适用规则
${rules.map(rule => `- ${rule.name}`).join("\n")}

## 任务
请为章节《${chapterTitle}》制定详细的内容规划。

## 规划要求
1. 确保与上一章内容的连贯性
2. 遵循所有适用的规则和指南
3. 设计合理的情节发展
4. 保持角色行为一致性
5. 创建引人入胜的场景和对话

## 规划格式
1. 章节主题和目标
2. 主要情节点（3-5个）
3. 场景设置（2-3个）
4. 关键对话（1-2段）
5. 角色发展
6. 伏笔和悬念
7. 与上一章的连接点
8. 为下一章的铺垫
`

        // 这里应该调用AI生成规划内容
        // 由于我们没有直接访问AI的能力，这里返回提示词作为示例
        return planningPrompt
    }
}

// 导出实例
export const ruleService = RuleService.getInstance() 