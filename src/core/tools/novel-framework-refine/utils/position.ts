/**
 * 部分位置信息
 */
export interface SectionPosition {
    found: boolean;
    startLine: number;
    endLine: number;
    headingLevel: number;
}

/**
 * 查找Markdown文档中指定部分的位置
 * @param content Markdown内容
 * @param headings 可能的标题数组
 * @returns 部分位置信息
 */
export function findSectionPosition(content: string, headings: string[]): SectionPosition {
    const lines = content.split('\n');
    const result: SectionPosition = {
        found: false,
        startLine: -1,
        endLine: -1,
        headingLevel: 0
    };
    
    // 寻找匹配的标题
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // 检查是否匹配任意指定标题
        const matchedHeading = headings.find(heading => line.startsWith(heading));
        if (matchedHeading) {
            result.found = true;
            result.startLine = i;
            result.headingLevel = matchedHeading.split('#').length - 1;
            
            // 寻找部分结束位置
            // 结束位置定义为下一个相同或更高级别的标题，或文档结束
            for (let j = i + 1; j < lines.length; j++) {
                const nextLine = lines[j].trim();
                if (nextLine.startsWith('#')) {
                    // 计算这个标题的级别
                    const level = nextLine.split('#').length - 1;
                    // 如果找到同级或更高级的标题，则当前部分结束
                    if (level <= result.headingLevel) {
                        result.endLine = j - 1;
                        return result;
                    }
                }
            }
            
            // 如果没有找到下一个标题，则部分延伸到文档结束
            result.endLine = lines.length - 1;
            return result;
        }
    }
    
    return result;
}

/**
 * 查找所有H2级别的章节标题
 * @param content Markdown内容
 * @returns 所有H2标题的位置数组
 */
export function findAllH2Sections(content: string): SectionPosition[] {
    const lines = content.split('\n');
    const sections: SectionPosition[] = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // 检查是否是H2标题
        if (line.startsWith('## ')) {
            const section: SectionPosition = {
                found: true,
                startLine: i,
                endLine: -1,
                headingLevel: 2
            };
            
            // 寻找部分结束位置
            for (let j = i + 1; j < lines.length; j++) {
                const nextLine = lines[j].trim();
                if (nextLine.startsWith('## ')) {
                    section.endLine = j - 1;
                    break;
                }
            }
            
            // 如果没有找到下一个H2标题，则部分延伸到文档结束
            if (section.endLine === -1) {
                section.endLine = lines.length - 1;
            }
            
            sections.push(section);
        }
    }
    
    return sections;
}

/**
 * 获取所有部分的名称和位置
 * @param content Markdown内容
 * @returns 标题名称和位置的映射
 */
export function getSectionMap(content: string): Map<string, SectionPosition> {
    const sections = findAllH2Sections(content);
    const sectionMap = new Map<string, SectionPosition>();
    const lines = content.split('\n');
    
    for (const section of sections) {
        if (section.found && section.startLine >= 0) {
            const titleLine = lines[section.startLine].trim();
            const title = titleLine.replace(/^#+\s+/, ''); // 移除标题前的#符号
            sectionMap.set(title, section);
        }
    }
    
    return sectionMap;
} 