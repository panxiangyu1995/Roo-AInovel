import { SectionPosition } from "../novel-framework-refine/types"

/**
 * 确定章节大纲部分的位置
 */
export function determineChapterSectionPosition(content: string): SectionPosition {
    const sectionPattern = /## 章节规划|## 章节大纲/
    const nextSectionPattern = /^## /

    const lines = content.split('\n')
    let hasExistingSection = false
    let startLine = -1
    let endLine = -1

    // 查找现有的章节大纲部分
    for (let i = 0; i < lines.length; i++) {
        if (sectionPattern.test(lines[i])) {
            hasExistingSection = true
            startLine = i

            // 查找下一个章节标题或文件末尾
            for (let j = i + 1; j < lines.length; j++) {
                if (nextSectionPattern.test(lines[j]) && !sectionPattern.test(lines[j])) {
                    endLine = j - 1
                    break
                }
            }

            // 如果没有找到下一个章节标题，则设置为文件末尾
            if (endLine === -1) {
                endLine = lines.length - 1
            }
            break
        }
    }

    return { hasExistingSection, startLine, endLine }
}

/**
 * 确定主题部分的位置
 */
export function determineThemeSectionPosition(content: string): SectionPosition {
    const sectionPattern = /## 主题元素|## 主题|## 题材/
    const nextSectionPattern = /^## /

    const lines = content.split('\n')
    let hasExistingSection = false
    let startLine = -1
    let endLine = -1

    // 查找现有的主题部分
    for (let i = 0; i < lines.length; i++) {
        if (sectionPattern.test(lines[i])) {
            hasExistingSection = true
            startLine = i

            // 查找下一个章节标题或文件末尾
            for (let j = i + 1; j < lines.length; j++) {
                if (nextSectionPattern.test(lines[j]) && !sectionPattern.test(lines[j])) {
                    endLine = j - 1
                    break
                }
            }

            // 如果没有找到下一个章节标题，则设置为文件末尾
            if (endLine === -1) {
                endLine = lines.length - 1
            }
            break
        }
    }

    return { hasExistingSection, startLine, endLine }
}

/**
 * 确定风格部分的位置
 */
export function determineStyleSectionPosition(content: string): SectionPosition {
    const sectionPattern = /## 叙事风格|## 视角设计|## 叙事视角|## 写作风格/
    const nextSectionPattern = /^## /

    const lines = content.split('\n')
    let hasExistingSection = false
    let startLine = -1
    let endLine = -1

    // 查找现有的风格部分
    for (let i = 0; i < lines.length; i++) {
        if (sectionPattern.test(lines[i])) {
            hasExistingSection = true
            startLine = i

            // 查找下一个章节标题或文件末尾
            for (let j = i + 1; j < lines.length; j++) {
                if (nextSectionPattern.test(lines[j]) && !sectionPattern.test(lines[j])) {
                    endLine = j - 1
                    break
                }
            }

            // 如果没有找到下一个章节标题，则设置为文件末尾
            if (endLine === -1) {
                endLine = lines.length - 1
            }
            break
        }
    }

    return { hasExistingSection, startLine, endLine }
}

/**
 * 确定市场部分的位置
 */
export function determineMarketSectionPosition(content: string): SectionPosition {
    const sectionPattern = /## 市场定位|## 读者定位/
    const nextSectionPattern = /^## /

    const lines = content.split('\n')
    let hasExistingSection = false
    let startLine = -1
    let endLine = -1

    // 查找现有的市场定位部分
    for (let i = 0; i < lines.length; i++) {
        if (sectionPattern.test(lines[i])) {
            hasExistingSection = true
            startLine = i

            // 查找下一个章节标题或文件末尾
            for (let j = i + 1; j < lines.length; j++) {
                if (nextSectionPattern.test(lines[j]) && !sectionPattern.test(lines[j])) {
                    endLine = j - 1
                    break
                }
            }

            // 如果没有找到下一个章节标题，则设置为文件末尾
            if (endLine === -1) {
                endLine = lines.length - 1
            }
            break
        }
    }

    return { hasExistingSection, startLine, endLine }
}

/**
 * 确定计划部分的位置
 */
export function determinePlanSectionPosition(content: string): SectionPosition {
    const sectionPattern = /## 创作计划|## 写作计划/
    const nextSectionPattern = /^## /

    const lines = content.split('\n')
    let hasExistingSection = false
    let startLine = -1
    let endLine = -1

    // 查找现有的创作计划部分
    for (let i = 0; i < lines.length; i++) {
        if (sectionPattern.test(lines[i])) {
            hasExistingSection = true
            startLine = i

            // 查找下一个章节标题或文件末尾
            for (let j = i + 1; j < lines.length; j++) {
                if (nextSectionPattern.test(lines[j]) && !sectionPattern.test(lines[j])) {
                    endLine = j - 1
                    break
                }
            }

            // 如果没有找到下一个章节标题，则设置为文件末尾
            if (endLine === -1) {
                endLine = lines.length - 1
            }
            break
        }
    }

    return { hasExistingSection, startLine, endLine }
}

/**
 * 确定系统设定部分的位置
 */
export function determineSystemSectionPosition(content: string): SectionPosition {
    const sectionPattern = /## 系统设定|## 特殊系统|## 世界规则|## 修仙系统|## 武功系统/
    const nextSectionPattern = /^## /

    const lines = content.split('\n')
    let hasExistingSection = false
    let startLine = -1
    let endLine = -1

    // 查找现有的系统设定部分
    for (let i = 0; i < lines.length; i++) {
        if (sectionPattern.test(lines[i])) {
            hasExistingSection = true
            startLine = i

            // 查找下一个章节标题或文件末尾
            for (let j = i + 1; j < lines.length; j++) {
                if (nextSectionPattern.test(lines[j]) && !sectionPattern.test(lines[j])) {
                    endLine = j - 1
                    break
                }
            }

            // 如果没有找到下一个章节标题，则设置为文件末尾
            if (endLine === -1) {
                endLine = lines.length - 1
            }
            break
        }
    }

    return { hasExistingSection, startLine, endLine }
}

/**
 * 确定情感设计部分的位置
 */
export function determineEmotionSectionPosition(content: string): SectionPosition {
    const sectionPattern = /## 情感设计|## 情感基调/
    const nextSectionPattern = /^## /

    const lines = content.split('\n')
    let hasExistingSection = false
    let startLine = -1
    let endLine = -1

    // 查找现有的情感设计部分
    for (let i = 0; i < lines.length; i++) {
        if (sectionPattern.test(lines[i])) {
            hasExistingSection = true
            startLine = i

            // 查找下一个章节标题或文件末尾
            for (let j = i + 1; j < lines.length; j++) {
                if (nextSectionPattern.test(lines[j]) && !sectionPattern.test(lines[j])) {
                    endLine = j - 1
                    break
                }
            }

            // 如果没有找到下一个章节标题，则设置为文件末尾
            if (endLine === -1) {
                endLine = lines.length - 1
            }
            break
        }
    }

    return { hasExistingSection, startLine, endLine }
}

/**
 * 确定自我反思部分的位置
 */
export function determineReflectionSectionPosition(content: string): SectionPosition {
    const sectionPattern = /## 自我反思|## 创作意图|## 创作反思/
    const nextSectionPattern = /^## /

    const lines = content.split('\n')
    let hasExistingSection = false
    let startLine = -1
    let endLine = -1

    // 查找现有的自我反思部分
    for (let i = 0; i < lines.length; i++) {
        if (sectionPattern.test(lines[i])) {
            hasExistingSection = true
            startLine = i

            // 查找下一个章节标题或文件末尾
            for (let j = i + 1; j < lines.length; j++) {
                if (nextSectionPattern.test(lines[j]) && !sectionPattern.test(lines[j])) {
                    endLine = j - 1
                    break
                }
            }

            // 如果没有找到下一个章节标题，则设置为文件末尾
            if (endLine === -1) {
                endLine = lines.length - 1
            }
            break
        }
    }

    return { hasExistingSection, startLine, endLine }
}

/**
 * 确定剧情部分在文档中的位置
 */
export function determinePlotSectionPosition(content: string): { hasExistingSection: boolean, startLine: number, endLine: number } {
    const lines = content.split('\n');
    
    // 查找"故事大纲"部分
    let inSection = false;
    let startLine = -1;
    let endLine = -1;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // 查找剧情部分的标题
        if (line.match(/^#+\s*故事大纲/i) || line.match(/^#+\s*剧情/i) || line.match(/^#+\s*情节/i)) {
            inSection = true;
            startLine = i;
            continue;
        }
        
        // 如果已经在剧情部分，并且遇到了下一个标题，则标记为结束
        if (inSection && line.match(/^#+\s*[^#]/)) {
            endLine = i - 1;
            break;
        }
    }
    
    // 如果找到了开始但没找到结束，说明剧情部分一直到文档末尾
    if (inSection && endLine === -1) {
        endLine = lines.length - 1;
    }
    
    return {
        hasExistingSection: startLine !== -1,
        startLine,
        endLine
    };
}

/**
 * 确定世界设定部分在文档中的位置
 */
export function determineWorldSectionPosition(content: string): { hasExistingSection: boolean, startLine: number, endLine: number } {
    const lines = content.split('\n');
    
    // 查找"世界设定"部分
    let inSection = false;
    let startLine = -1;
    let endLine = -1;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // 查找世界设定部分的标题
        if (line.match(/^#+\s*世界设定/i) || line.match(/^#+\s*世界观/i)) {
            inSection = true;
            startLine = i;
            continue;
        }
        
        // 如果已经在世界设定部分，并且遇到了下一个标题，则标记为结束
        if (inSection && line.match(/^#+\s*[^#]/)) {
            endLine = i - 1;
            break;
        }
    }
    
    // 如果找到了开始但没找到结束，说明世界设定部分一直到文档末尾
    if (inSection && endLine === -1) {
        endLine = lines.length - 1;
    }
    
    return {
        hasExistingSection: startLine !== -1,
        startLine,
        endLine
    };
} 