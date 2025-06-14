import * as vscode from "vscode"

/**
 * 去AI化处理策略
 */
export enum DeAIStrategy {
    STYLE_DIVERSIFICATION = "style_diversification", // 风格多样化
    HUMANIZATION = "humanization", // 人文化处理
    POST_PROCESSING = "post_processing" // 后处理优化
}

/**
 * 去AI化处理配置
 */
export interface DeAIConfig {
    strategies: DeAIStrategy[] // 使用的策略
    intensity: number // 处理强度 (0-1)
    preserveStructure: boolean // 是否保留原文结构
    preserveKeyInfo: boolean // 是否保留关键信息
}

/**
 * 去AI化处理服务接口
 */
export interface IDeAIService {
    /**
     * 处理内容
     * @param content 原始内容
     * @param mode 当前模式
     * @returns 处理后的内容
     */
    processContent(content: string, mode: string): Promise<string>

    /**
     * 获取当前配置
     * @returns 去AI化处理配置
     */
    getConfig(): DeAIConfig

    /**
     * 更新配置
     * @param config 新配置
     */
    updateConfig(config: Partial<DeAIConfig>): void
}

/**
 * 去AI化处理服务实现
 */
export class DeAIService implements IDeAIService {
    private static instance: DeAIService
    private config: DeAIConfig = {
        strategies: [
            DeAIStrategy.STYLE_DIVERSIFICATION,
            DeAIStrategy.HUMANIZATION,
            DeAIStrategy.POST_PROCESSING
        ],
        intensity: 0.7,
        preserveStructure: true,
        preserveKeyInfo: true
    }

    private constructor() {}

    /**
     * 获取去AI化处理服务实例
     */
    public static getInstance(): DeAIService {
        if (!DeAIService.instance) {
            DeAIService.instance = new DeAIService()
        }
        return DeAIService.instance
    }

    /**
     * 处理内容
     * @param content 原始内容
     * @param mode 当前模式
     * @returns 处理后的内容
     */
    public async processContent(content: string, mode: string): Promise<string> {
        if (!content) return content

        let processedContent = content

        // 根据配置的策略进行处理
        for (const strategy of this.config.strategies) {
            switch (strategy) {
                case DeAIStrategy.STYLE_DIVERSIFICATION:
                    processedContent = this.applyStyleDiversification(processedContent, mode)
                    break
                case DeAIStrategy.HUMANIZATION:
                    processedContent = this.applyHumanization(processedContent, mode)
                    break
                case DeAIStrategy.POST_PROCESSING:
                    processedContent = this.applyPostProcessing(processedContent, mode)
                    break
            }
        }

        return processedContent
    }

    /**
     * 获取当前配置
     * @returns 去AI化处理配置
     */
    public getConfig(): DeAIConfig {
        return { ...this.config }
    }

    /**
     * 更新配置
     * @param config 新配置
     */
    public updateConfig(config: Partial<DeAIConfig>): void {
        this.config = { ...this.config, ...config }
    }

    /**
     * 应用风格多样化策略
     * @param content 内容
     * @param mode 模式
     * @returns 处理后的内容
     */
    private applyStyleDiversification(content: string, mode: string): string {
        // 在实际实现中，这里应该调用AI模型进行风格多样化处理
        // 由于我们没有直接访问AI的能力，这里只进行一些简单的文本替换作为示例

        // 替换一些常见的AI固定表达
        let processedContent = content
            .replace(/首先，/g, "")
            .replace(/其次，/g, "")
            .replace(/最后，/g, "")
            .replace(/总的来说，/g, "")
            .replace(/总而言之，/g, "")
            .replace(/值得注意的是，/g, "")
            .replace(/需要指出的是，/g, "")
            .replace(/不得不说，/g, "")

        // 根据模式进行特定处理
        if (mode === "writer" || mode === "expand") {
            // 为小说内容添加更多随机性和变化
            processedContent = this.addRandomVariations(processedContent)
        }

        return processedContent
    }

    /**
     * 应用人文化处理策略
     * @param content 内容
     * @param mode 模式
     * @returns 处理后的内容
     */
    private applyHumanization(content: string, mode: string): string {
        // 在实际实现中，这里应该调用AI模型进行人文化处理
        // 由于我们没有直接访问AI的能力，这里只进行一些简单的文本替换作为示例

        let processedContent = content

        // 添加一些情感波动和思维跳跃的标记
        // 这些标记在实际实现中应该被真实的内容替换
        if (mode === "writer") {
            // 在段落之间添加一些思维跳跃的标记
            const paragraphs = processedContent.split("\n\n")
            if (paragraphs.length > 3) {
                // 在20%的概率下，在段落之间添加思维跳跃
                const randomIndex = Math.floor(Math.random() * (paragraphs.length - 2)) + 1
                if (Math.random() < 0.2) {
                    paragraphs[randomIndex] = this.addThoughtJump(paragraphs[randomIndex])
                }
            }
            processedContent = paragraphs.join("\n\n")
        }

        return processedContent
    }

    /**
     * 应用后处理优化策略
     * @param content 内容
     * @param mode 模式
     * @returns 处理后的内容
     */
    private applyPostProcessing(content: string, mode: string): string {
        // 在实际实现中，这里应该调用AI模型进行后处理优化
        // 由于我们没有直接访问AI的能力，这里只进行一些简单的文本替换作为示例

        let processedContent = content

        // 移除多余的空行
        processedContent = processedContent.replace(/\n{3,}/g, "\n\n")

        // 根据模式进行特定处理
        if (mode === "writer" || mode === "optimize") {
            // 优化段落结构
            processedContent = this.optimizeParagraphStructure(processedContent)
        }

        return processedContent
    }

    /**
     * 添加随机变化
     * @param content 内容
     * @returns 处理后的内容
     */
    private addRandomVariations(content: string): string {
        // 这里只是一个示例，实际实现应该更加复杂
        // 在真实实现中，应该使用AI模型生成更自然的变化

        return content
    }

    /**
     * 添加思维跳跃
     * @param paragraph 段落
     * @returns 处理后的段落
     */
    private addThoughtJump(paragraph: string): string {
        // 这里只是一个示例，实际实现应该更加复杂
        // 在真实实现中，应该使用AI模型生成更自然的思维跳跃

        return paragraph
    }

    /**
     * 优化段落结构
     * @param content 内容
     * @returns 处理后的内容
     */
    private optimizeParagraphStructure(content: string): string {
        // 这里只是一个示例，实际实现应该更加复杂
        // 在真实实现中，应该使用AI模型优化段落结构

        return content
    }
}

// 导出实例
export const deAIService = DeAIService.getInstance() 