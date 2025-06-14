import { AnalysisContext, AnalysisResult, AnalysisSection, SectionAnalyzer } from "../types";
import { analyzeSection } from "../analyzer";
import { extractKeywords } from "../extractors";

/**
 * 小说类型分析器
 * 分析小说所属的文学类型或流派
 */
export class GenreAnalyzer implements SectionAnalyzer {
  /**
   * 分析小说类型
   * @param context 分析上下文
   * @returns 分析结果
   */
  public async analyze(context: AnalysisContext): Promise<AnalysisResult> {
    // 提取关键词，辅助分析
    const keywords = extractKeywords(context.content, 20);
    
    // 在分析提示中添加关键词信息
    const enhancedContext: AnalysisContext = {
      ...context,
      content: `关键词: ${keywords.join(', ')}\n\n${context.content}`
    };
    
    // 使用通用分析器进行分析
    return analyzeSection(enhancedContext, AnalysisSection.GENRE);
  }
} 