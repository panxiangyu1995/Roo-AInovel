import * as vscode from "vscode"
import { ruleService, RuleFile } from "./RuleService"
import { DeAIService } from "./deai/DeAIService"

/**
 * 规则应用流程阶段
 */
export enum RuleApplicationStage {
    STUDY_RULES = "study_rules", // 研究规则
    PLAN_CONTENT = "plan_content", // 规划内容
    GENERATE_CONTENT = "generate_content", // 生成内容
    DEAI_PROCESSING = "deai_processing" // 去AI化处理
}

/**
 * 规则应用上下文
 */
export interface RuleApplicationContext {
    mode: string // 当前模式
    rules: RuleFile[] // 适用的规则
    originalPrompt: string // 原始提示词
    enhancedPrompt: string // 增强后的提示词
    contentPlan?: string // 内容规划
    generatedContent?: string // 生成的内容
    processedContent?: string // 处理后的内容
    chapterTitle?: string // 章节标题
    previousChapterSummary?: string // 上一章总结
    currentStage: RuleApplicationStage // 当前阶段
}

/**
 * 规则应用流程服务接口
 */
export interface IRuleApplicationFlow {
    /**
     * 开始规则应用流程
     * @param mode 当前模式
     * @param originalPrompt 原始提示词
     * @param filePath 当前文件路径
     * @returns 应用规则后的提示词
     */
    startFlow(mode: string, originalPrompt: string, filePath?: string): Promise<string>

    /**
     * 获取当前上下文
     * @returns 规则应用上下文
     */
    getCurrentContext(): RuleApplicationContext | null

    /**
     * 应用去AI化处理
     * @param content 内容
     * @returns 处理后的内容
     */
    applyDeAIProcessing(content: string): Promise<string>
}

/**
 * 规则应用流程服务实现
 */
export class RuleApplicationFlow implements IRuleApplicationFlow {
    private static instance: RuleApplicationFlow
    private context: RuleApplicationContext | null = null
    private deAIService: DeAIService

    private constructor() {
        this.deAIService = DeAIService.getInstance()
    }

    /**
     * 获取规则应用流程服务实例
     */
    public static getInstance(): RuleApplicationFlow {
        if (!RuleApplicationFlow.instance) {
            RuleApplicationFlow.instance = new RuleApplicationFlow()
        }
        return RuleApplicationFlow.instance
    }

    /**
     * 开始规则应用流程
     * @param mode 当前模式
     * @param originalPrompt 原始提示词
     * @param filePath 当前文件路径
     * @returns 应用规则后的提示词
     */
    public async startFlow(mode: string, originalPrompt: string, filePath?: string): Promise<string> {
        // 初始化上下文
        this.context = {
            mode,
            rules: [],
            originalPrompt,
            enhancedPrompt: originalPrompt,
            currentStage: RuleApplicationStage.STUDY_RULES
        }

        try {
            // 1. 研究规则阶段
            await this.studyRulesStage(filePath)

            // 2. 规划内容阶段
            if (mode === "writer" || mode === "expand") {
                await this.planContentStage(filePath)
            }

            // 3. 生成内容阶段 - 这一步主要是增强提示词，实际生成由调用方完成
            this.generateContentStage()

            // 返回增强后的提示词
            return this.context.enhancedPrompt
        } catch (error) {
            console.error("规则应用流程执行出错:", error)
            // 出错时返回原始提示词
            return originalPrompt
        }
    }

    /**
     * 获取当前上下文
     * @returns 规则应用上下文
     */
    public getCurrentContext(): RuleApplicationContext | null {
        return this.context
    }

    /**
     * 研究规则阶段
     * @param filePath 当前文件路径
     */
    private async studyRulesStage(filePath?: string): Promise<void> {
        if (!this.context) return

        // 更新阶段
        this.context.currentStage = RuleApplicationStage.STUDY_RULES

        // 获取适用于当前模式的规则
        this.context.rules = await ruleService.getRulesForMode(this.context.mode)

        // 如果是章节文件，获取上一章总结
        if (filePath && this.isChapterFile(filePath)) {
            this.context.chapterTitle = this.extractChapterTitle(filePath)
            this.context.previousChapterSummary = await ruleService.getPreviousChapterSummary(filePath)
        }
    }

    /**
     * 规划内容阶段
     * @param filePath 当前文件路径
     */
    private async planContentStage(filePath?: string): Promise<void> {
        if (!this.context) return

        // 更新阶段
        this.context.currentStage = RuleApplicationStage.PLAN_CONTENT

        // 如果是章节文件且有标题和上一章总结，生成内容规划
        if (filePath && this.isChapterFile(filePath) && 
            this.context.chapterTitle && 
            this.context.previousChapterSummary) {
            
            this.context.contentPlan = await ruleService.planChapterContent(
                this.context.rules,
                this.context.previousChapterSummary,
                this.context.chapterTitle
            )
        }
    }

    /**
     * 生成内容阶段
     */
    private generateContentStage(): void {
        if (!this.context) return

        // 更新阶段
        this.context.currentStage = RuleApplicationStage.GENERATE_CONTENT

        // 增强提示词
        let enhancedPrompt = this.context.originalPrompt

        // 添加规则内容
        enhancedPrompt = ruleService.applyRulesToPrompt(enhancedPrompt, this.context.rules)

        // 如果有内容规划，添加到提示词中
        if (this.context.contentPlan) {
            enhancedPrompt = `${enhancedPrompt}\n\n## 内容规划\n${this.context.contentPlan}`
        }

        // 添加RIPER-5格式要求
        enhancedPrompt = this.addRIPER5Format(enhancedPrompt, this.context.mode)

        // 更新上下文
        this.context.enhancedPrompt = enhancedPrompt
    }

    /**
     * 应用去AI化处理
     * @param content 内容
     * @returns 处理后的内容
     */
    public async applyDeAIProcessing(content: string): Promise<string> {
        if (!this.context) return content

        // 更新阶段
        this.context.currentStage = RuleApplicationStage.DEAI_PROCESSING
        this.context.generatedContent = content

        // 应用去AI化处理
        const processedContent = await this.deAIService.processContent(content, this.context.mode)
        
        // 更新上下文
        this.context.processedContent = processedContent

        return processedContent
    }

    /**
     * 判断文件是否为章节文件
     * @param filePath 文件路径
     * @returns 是否为章节文件
     */
    private isChapterFile(filePath: string): boolean {
        const fileName = filePath.toLowerCase()
        return fileName.includes("章") || fileName.includes("chapter")
    }

    /**
     * 提取章节标题
     * @param filePath 文件路径
     * @returns 章节标题
     */
    private extractChapterTitle(filePath: string): string {
        const fileName = filePath.split("/").pop() || filePath.split("\\").pop() || ""
        return fileName.replace(/\.md$/i, "")
    }

    /**
     * 添加RIPER-5格式要求
     * @param prompt 提示词
     * @param mode 模式
     * @returns 添加格式要求后的提示词
     */
    private addRIPER5Format(prompt: string, mode: string): string {
        // 根据模式添加不同的RIPER-5格式要求
        let formatRequirements = ""

        switch (mode) {
            case "writer":
                formatRequirements = `
## 写作要求
请使用RIPER-5格式进行创作，遵循以下原则：
1. 系统思维：从整体架构到具体实现进行分析
2. 辩证思维：评估多种解决方案及其利弊
3. 创新思维：打破常规模式，寻求创造性解决方案
4. 批判性思维：从多个角度验证和优化解决方案

写作时请注意：
- 风格多样化：引入随机性和变化，避免固定模式
- 人文化处理：添加情感波动、思维跳跃等人类写作特征
- 局部重写：关键段落需要特别注意细节和表达
- 混合生成：结合多种风格和表达方式
- 后处理优化：对生成内容进行"去AI化"处理

请确保内容质量，注重：
- 连贯性：故事情节是否连贯
- 一致性：人物、设定是否一致
- 创造性：是否有新颖的想法和表达
- 可读性：语言是否流畅自然
- 情感共鸣：是否能引起读者情感反应`
                break
            case "expand":
                formatRequirements = `
## 扩写要求
请使用RIPER-5格式进行扩写，遵循以下原则：
1. 系统思维：理解原文整体结构和目的
2. 辩证思维：评估多种扩展方向及其效果
3. 创新思维：在保持原意的基础上添加创造性内容
4. 批判性思维：确保扩写内容与原文风格一致

扩写时请注意：
- 保持原文风格：扩写内容应与原文风格保持一致
- 丰富细节：添加场景描写、人物心理、对话细节等
- 深化主题：强化原文主题和情感表达
- 结构平衡：保持扩写后内容的结构平衡
- 去AI化处理：避免机械化、公式化的表达`
                break
            case "optimize":
                formatRequirements = `
## 优化要求
请使用RIPER-5格式进行内容优化，遵循以下原则：
1. 系统思维：全面分析文本优缺点
2. 辩证思维：权衡不同优化方向的利弊
3. 创新思维：提出创新的表达和结构改进
4. 批判性思维：从读者角度评估优化效果

优化时请注意：
- 提升表达：改进用词、句式和段落结构
- 增强连贯性：优化段落和章节间的过渡
- 突出重点：强化关键情节和主题表达
- 调整节奏：优化叙事节奏和情感起伏
- 去AI化处理：消除机械化、重复性表达`
                break
            case "script":
                formatRequirements = `
## 剧本要求
请使用RIPER-5格式进行剧本创作，遵循以下原则：
1. 系统思维：构建完整的剧本结构
2. 辩证思维：平衡对话、动作和场景描述
3. 创新思维：创造引人入胜的场景和对话
4. 批判性思维：评估剧本的可视化和表演效果

剧本创作时请注意：
- 标准格式：遵循专业剧本格式规范
- 简洁指示：场景和动作指示简明扼要
- 自然对话：对话应自然、有个性、推动情节
- 视觉思维：内容应易于视觉化呈现
- 去AI化处理：避免对话和描述的公式化`
                break
            default:
                // 对于其他模式，不添加特殊格式要求
                return prompt
        }

        // 将格式要求添加到提示词末尾
        return `${prompt}\n\n${formatRequirements}`
    }
}

// 导出单例实例
export const ruleApplicationFlow = RuleApplicationFlow.getInstance() 