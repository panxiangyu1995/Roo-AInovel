import { AnalysisSection, SECTION_CONFIGS } from "./types";

/**
 * 格式化分析内容
 * @param section 分析部分
 * @param title 小说标题
 * @param content 分析内容
 * @returns 格式化后的内容
 */
export function formatSectionContent(section: AnalysisSection, title: string, content: string): string {
  const template = SECTION_CONFIGS[section].outputTemplate;
  return template.replace(/\{title\}/g, title).replace(/\{content\}/g, content);
}

/**
 * 格式化完整分析报告
 * @param title 小说标题
 * @param sectionResults 各部分分析结果 [部分ID, 内容]
 * @returns 格式化后的完整报告
 */
export function formatFullReport(title: string, sectionResults: [AnalysisSection, string][]): string {
  // 如果已经有FULL部分的结果，直接使用
  const fullResult = sectionResults.find(([section]) => section === AnalysisSection.FULL);
  if (fullResult) {
    return formatSectionContent(AnalysisSection.FULL, title, fullResult[1]);
  }

  // 否则，组合各个部分的结果
  let report = `# ${title} - 小说全面分析报告\n\n`;
  
  // 添加引言
  report += `## 引言\n\n`;
  report += `本报告对《${title}》进行了全面分析，包括小说类型、世界观设定、角色关系、情节结构、写作风格、主题探索、语言特点、叙事视角、时间线结构、场景设置、冲突与矛盾、象征与隐喻以及读者体验等方面。\n\n`;
  
  // 按顺序添加各部分内容
  const orderedSections = sectionResults
    .filter(([section]) => section !== AnalysisSection.FULL)
    .sort(([a], [b]) => {
      const orderA = SECTION_CONFIGS[a].order;
      const orderB = SECTION_CONFIGS[b].order;
      return orderA - orderB;
    });
  
  for (const [section, content] of orderedSections) {
    const config = SECTION_CONFIGS[section];
    report += `## ${config.displayName}\n\n${content}\n\n`;
  }
  
  // 添加结论
  report += `## 结论\n\n`;
  report += `通过以上分析，我们可以更全面地理解《${title}》的艺术价值和文学意义。\n`;
  
  return report;
}

/**
 * 格式化错误消息
 * @param title 小说标题
 * @param error 错误信息
 * @returns 格式化后的错误消息
 */
export function formatErrorMessage(title: string, error: string): string {
  return `# ${title} - 分析错误\n\n分析过程中发生错误：\n\n\`\`\`\n${error}\n\`\`\`\n\n请尝试重新分析或检查小说内容。`;
}

/**
 * 格式化分析提示词
 * @param section 分析部分
 * @param title 小说标题
 * @param content 小说内容
 * @returns 格式化后的提示词
 */
export function formatPrompt(section: AnalysisSection, title: string, content: string): string {
  const template = SECTION_CONFIGS[section].promptTemplate;
  return template.replace(/\{title\}/g, title).replace(/\{content\}/g, content);
} 