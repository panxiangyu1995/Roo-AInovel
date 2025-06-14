import { AnalysisContext, AnalysisResult, AnalysisSection, SectionAnalyzer, getAllRegularSections } from "../types";
import { analyzeSection } from "../analyzer";
import { formatFullReport } from "../formatters";
import { extractCharacters, extractSettings, extractKeywords } from "../extractors";

/**
 * 全面分析器
 * 分析小说的所有13个方面
 */
export class FullAnalyzer implements SectionAnalyzer {
  /**
   * 执行全面分析
   * @param context 分析上下文
   * @returns 分析结果
   */
  public async analyze(context: AnalysisContext): Promise<AnalysisResult> {
    const { cline, title, content } = context;
    
    // 提取辅助信息
    const characters = extractCharacters(content);
    const settings = extractSettings(content);
    const keywords = extractKeywords(content, 30);
    
    // 增强分析上下文
    const enhancedContext: AnalysisContext = {
      ...context,
      content: `
主要角色: ${characters.join(', ')}
主要场景: ${settings.join(', ')}
关键词: ${keywords.join(', ')}

${content}`
    };
    
    try {
      // 可以选择两种方式：
      // 1. 一次性分析所有内容（适合较短的小说）
      // 2. 分别分析各个部分（适合较长的小说）
      
      // 这里选择方式1：一次性分析所有内容
      const result = await analyzeSection(enhancedContext, AnalysisSection.FULL);
      return result;
      
      // 方式2的代码（注释掉）：
      /*
      // 获取所有常规部分（除FULL外）
      const sections = getAllRegularSections().map(config => config.id);
      
      // 分别分析各个部分
      const results: AnalysisResult[] = [];
      for (const section of sections) {
        await cline.say("text", `正在分析${SECTION_CONFIGS[section].displayName}...`);
        const result = await analyzeSection(enhancedContext, section);
        results.push(result);
      }
      
      // 组合所有成功的结果
      const successResults = results
        .filter(result => result.success)
        .map(result => [result.section, result.content] as [AnalysisSection, string]);
      
      // 格式化完整报告
      const reportContent = formatFullReport(title, successResults);
      
      return {
        section: AnalysisSection.FULL,
        content: reportContent,
        success: successResults.length > 0
      };
      */
    } catch (error) {
      console.error("全面分析失败:", error);
      return {
        section: AnalysisSection.FULL,
        content: "",
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
} 