import { Task } from "../../../core/task/Task"
import { AskApproval, HandleError, PushToolResult, RemoveClosingTag } from "../../../shared/tools"

/**
 * 框架完善选项类型
 */
export interface RefinementOption {
    id: string
    area: string
    title: string
    description: string
}

/**
 * 工作流处理函数的通用参数类型
 */
export type WorkflowParams = {
    cline: any
    frameworkPath: string
    frameworkContent: string
    askApproval: (message: string) => Promise<boolean>
    handleError: (error: any) => void
    pushToolResult: (message: string) => void
    removeClosingTag: () => string
}

/**
 * 章节配置类型
 */
export interface ChapterConfig {
    chapterCount: number
    volumeCount: number
    wordsPerChapter?: number
}

/**
 * 主题配置类型
 */
export interface ThemeConfig {
    genres?: string[]
    themes?: string[]
}

/**
 * 风格配置类型
 */
export interface StyleConfig {
    perspectives?: string[]
    styles?: string[]
}

/**
 * 市场配置类型
 */
export interface MarketConfig {
    readers?: string[]
    adaptations?: string[]
}

/**
 * 计划配置类型
 */
export interface PlanConfig {
    timeRange?: string
    frequency?: string
    goals?: string[]
}

/**
 * 技术元素配置类型
 */
export interface TechConfig {
    techniques?: string[]
    suspense?: string[]
    symbolDescription?: string
}

/**
 * 系统设定配置类型
 */
export interface SystemConfig {
    systemType?: string
    coreRules?: string[]
    levels?: string[]
    abilities?: string[]
    limitations?: string[]
}

/**
 * 情感设计配置类型
 */
export interface EmotionConfig {
    tones?: string[]
    conflicts?: string[]
    language?: string
}

/**
 * 自我反思配置类型
 */
export interface ReflectionConfig {
    intentions?: string[]
    styles?: string[]
    innovations?: string[]
}

/**
 * 注意事项配置类型
 */
export interface GuidelinesConfig {
    taboos?: string[]
    styles?: string[]
    platformRules?: string[]
}

/**
 * 节段位置信息类型
 */
export interface SectionPosition {
    hasExistingSection: boolean
    startLine: number
    endLine: number
} 