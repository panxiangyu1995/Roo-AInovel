import { ChapterConfig, EmotionConfig, GuidelinesConfig, MarketConfig, PlanConfig, ReflectionConfig, StyleConfig, SystemConfig, ThemeConfig } from "../novel-framework-refine/types"

/**
 * 剧情部分配置类型
 */
type PlotConfig = {
    summary: string
    timeline: string
    turningPoints: string
    subplots: string
};

/**
 * 生成剧情部分内容
 */
export function generatePlotSection(config: PlotConfig): string {
    return `## 故事大纲

### 故事概要

${config.summary}

### 时间线

${config.timeline}

### 主要转折点

${config.turningPoints}

### 子情节

${config.subplots}`;
}

/**
 * 世界设定部分配置类型
 */
type WorldConfig = {
    society: string
    geography: string
    history: string
    culture: string
};

/**
 * 生成世界设定部分内容
 */
export function generateWorldSection(config: WorldConfig): string {
    return `## 世界设定

### 社会结构

${config.society}

### 地理环境

${config.geography}

### 历史背景

${config.history}

### 文化特色

${config.culture}`;
} 

/**
 * 生成主题内容
 */
export function generateThemeSection(config: ThemeConfig): string {
    const { genres = [], themes = [] } = config
    let content = '## 主题元素\n\n'
    
    if (genres.length > 0) {
        content += '### 类型\n\n' + genres.map(genre => `- ${genre}`).join('\n') + '\n\n'
    } else {
        content += '### 类型\n\n*此处添加小说类型，如奇幻、科幻、悬疑等*\n\n'
    }
    
    if (themes.length > 0) {
        content += '### 核心主题\n\n' + themes.map(theme => `- ${theme}`).join('\n') + '\n\n'
    } else {
        content += '### 核心主题\n\n*此处添加小说探讨的核心主题，如成长、救赎、友情等*\n\n'
    }
    
    content += '### 象征元素\n\n*此处可添加小说中的象征元素及其含义*\n\n'
    
    return content
}

/**
 * 生成系统设定内容
 */
export function generateSystemSection(config: SystemConfig): string {
    const { systemType = '', coreRules = [], levels = [], abilities = [], limitations = [] } = config
    let content = `## 系统设定\n\n`
    
    if (systemType) {
        content += `### 系统类型\n\n${systemType}\n\n`
    } else {
        content += `### 系统类型\n\n*此处描述系统的类型，如修仙系统、武功系统、异能系统等*\n\n`
    }
    
    if (coreRules.length > 0) {
        content += `### 基本规则\n\n` + coreRules.map(rule => `- ${rule}`).join('\n') + '\n\n'
    } else {
        content += `### 基本规则\n\n*此处描述系统的基本原理和运作方式*\n\n`
    }
    
    if (levels.length > 0) {
        content += `### 等级划分\n\n` + levels.map(level => `- ${level}`).join('\n') + '\n\n'
    } else {
        content += `### 等级划分\n\n*此处描述系统的等级结构和晋升条件*\n\n`
    }
    
    if (abilities.length > 0) {
        content += `### 特殊能力\n\n` + abilities.map(ability => `- ${ability}`).join('\n') + '\n\n'
    } else {
        content += `### 特殊能力\n\n*此处描述系统提供的独特能力和效果*\n\n`
    }
    
    if (limitations.length > 0) {
        content += `### 限制条件\n\n` + limitations.map(limit => `- ${limit}`).join('\n') + '\n\n'
    } else {
        content += `### 限制条件\n\n*此处描述系统的使用限制和代价*\n\n`
    }
    
    content += `### 获取方式\n\n*此处描述如何获得和提升这一系统*\n\n`
    
    return content
}

/**
 * 生成章节大纲内容
 */
export function generateChapterSection(config: ChapterConfig): string {
    const { chapterCount, volumeCount, wordsPerChapter } = config
    
    let content = '## 章节规划\n\n'
    
    if (volumeCount > 1) {
        content += `### 卷数设计\n\n预计分为 ${volumeCount} 卷\n\n`
    }
    
    content += `### 章节数量\n\n预计共 ${chapterCount} 章`
    
    if (wordsPerChapter) {
        content += `\n\n### 字数规划\n\n每章预计 ${wordsPerChapter} 字，总计约 ${chapterCount * wordsPerChapter} 字`
    }
    
    content += '\n\n### 章节结构\n\n*此处可添加详细章节标题和内容概要*\n\n'
    
    return content
}

/**
 * 生成风格内容
 */
export function generateStyleSection(config: StyleConfig): string {
    const { perspectives = [], styles = [] } = config
    let content = '## 叙事风格\n\n'
    
    if (perspectives.length > 0) {
        content += '### 叙事视角\n\n' + perspectives.map(perspective => `- ${perspective}`).join('\n') + '\n\n'
    } else {
        content += '### 叙事视角\n\n*此处添加叙事视角，如第一人称、第三人称有限视角等*\n\n'
    }
    
    if (styles.length > 0) {
        content += '### 写作风格\n\n' + styles.map(style => `- ${style}`).join('\n') + '\n\n'
    } else {
        content += '### 写作风格\n\n*此处添加写作风格，如简洁明了、华丽描写、意识流等*\n\n'
    }
    
    content += '### 节奏控制\n\n*此处可描述不同章节或情节的节奏安排*\n\n'
    
    return content
}

/**
 * 生成情感设计内容
 */
export function generateEmotionSection(config: EmotionConfig): string {
    const { tones = [], conflicts = [], language = '' } = config
    let content = '## 情感设计\n\n'
    
    if (tones.length > 0) {
        content += '### 情感基调\n\n' + tones.map(tone => `- ${tone}`).join('\n') + '\n\n'
    } else {
        content += '### 情感基调\n\n*此处可描述小说的整体情感氛围*\n\n'
    }
    
    if (conflicts.length > 0) {
        content += '### 情感冲突\n\n' + conflicts.map(conflict => `- ${conflict}`).join('\n') + '\n\n'
    } else {
        content += '### 情感冲突\n\n*此处可描述小说中的核心情感冲突*\n\n'
    }
    
    if (language) {
        content += '### 语言特色\n\n' + language + '\n\n'
    } else {
        content += '### 语言特色\n\n*此处可描述作品的语言风格特色*\n\n'
    }
    
    content += '### 情感节奏\n\n*此处可描述小说情感铺陈的节奏安排*\n\n'
    
    return content
}

/**
 * 生成市场定位内容
 */
export function generateMarketSection(config: MarketConfig): string {
    const { readers = [], adaptations = [] } = config
    let content = '## 市场定位\n\n'
    
    if (readers.length > 0) {
        content += '### 目标读者\n\n' + readers.map(reader => `- ${reader}`).join('\n') + '\n\n'
    } else {
        content += '### 目标读者\n\n*此处添加目标读者群体，如年龄段、兴趣特点等*\n\n'
    }
    
    content += '### 竞品分析\n\n*此处可分析市场上类似题材的作品及其优缺点*\n\n'
    
    if (adaptations.length > 0) {
        content += '### 多媒体改编潜力\n\n' + adaptations.map(adaptation => `- ${adaptation}`).join('\n') + '\n\n'
    } else {
        content += '### 多媒体改编潜力\n\n*此处可分析作品改编为影视、游戏等的潜力*\n\n'
    }
    
    return content
}

/**
 * 生成自我反思内容
 */
export function generateReflectionSection(config: ReflectionConfig): string {
    const { intentions = [], styles = [], innovations = [] } = config
    let content = '## 自我反思\n\n'
    
    if (intentions.length > 0) {
        content += '### 创作意图\n\n' + intentions.map(intention => `- ${intention}`).join('\n') + '\n\n'
    } else {
        content += '### 创作意图\n\n*此处可描述创作这部作品的初衷和目的*\n\n'
    }
    
    if (styles.length > 0) {
        content += '### 个人风格特点\n\n' + styles.map(style => `- ${style}`).join('\n') + '\n\n'
    } else {
        content += '### 个人风格特点\n\n*此处可描述作者的个人写作风格特点*\n\n'
    }
    
    if (innovations.length > 0) {
        content += '### 创新点\n\n' + innovations.map(innovation => `- ${innovation}`).join('\n') + '\n\n'
    } else {
        content += '### 创新点\n\n*此处可描述作品的创新之处*\n\n'
    }
    
    content += '### 期望效果\n\n*此处可描述创作预期达到的效果*\n\n'
    
    return content
}

/**
 * 生成注意事项内容
 */
export function generateGuidelinesSection(config: GuidelinesConfig): string {
    const { taboos = [], styles = [], platformRules = [] } = config
    let content = '## 注意事项\n\n'
    
    if (taboos.length > 0) {
        content += '### 创作禁忌\n\n' + taboos.map((taboo: string) => `- ${taboo}`).join('\n') + '\n\n'
    } else {
        content += '### 创作禁忌\n\n*此处添加需要避免的情节、人设、设定等*\n\n'
    }
    
    if (styles.length > 0) {
        content += '### 风格规范\n\n' + styles.map((style: string) => `- ${style}`).join('\n') + '\n\n'
    } else {
        content += '### 风格规范\n\n*此处添加需要保持的写作风格、语言特点等*\n\n'
    }
    
    if (platformRules.length > 0) {
        content += '### 平台内容规范\n\n' + platformRules.map((rule: string) => `- ${rule}`).join('\n') + '\n\n'
    } else {
        content += '### 平台内容规范\n\n*此处添加发布平台的内容规范要求*\n\n'
    }
    
    return content
}

/**
 * 生成创作计划内容
 */
export function generatePlanSection(config: PlanConfig): string {
    const { timeRange, frequency, goals = [] } = config
    let content = '## 创作计划\n\n'
    
    if (timeRange) {
        content += '### 时间规划\n\n' + timeRange + '\n\n'
    } else {
        content += '### 时间规划\n\n*此处添加创作的时间规划，如预计完成时间等*\n\n'
    }
    
    if (frequency) {
        content += '### 更新频率\n\n' + frequency + '\n\n'
    } else {
        content += '### 更新频率\n\n*此处添加计划的更新频率，如每周更新字数等*\n\n'
    }
    
    if (goals.length > 0) {
        content += '### 创作目标\n\n' + goals.map(goal => `- ${goal}`).join('\n') + '\n\n'
    } else {
        content += '### 创作目标\n\n*此处添加创作目标，如在某平台达到的排名、销量等*\n\n'
    }
    
    content += '### 里程碑\n\n*此处可设置创作过程中的关键里程碑*\n\n'
    
    return content
}