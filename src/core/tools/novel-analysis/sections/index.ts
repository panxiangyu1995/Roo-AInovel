import { AnalysisSection, SectionAnalyzer } from "../types";
import { GenreAnalyzer } from "./genre";
import { FullAnalyzer } from "./full";

/**
 * 分析器工厂
 * 用于创建和管理各种分析器
 */
export class AnalyzerFactory {
  private static analyzers: Map<AnalysisSection, SectionAnalyzer> = new Map();
  
  /**
   * 获取指定部分的分析器
   * @param section 分析部分
   * @returns 分析器实例
   */
  public static getAnalyzer(section: AnalysisSection): SectionAnalyzer {
    // 如果已经创建过，直接返回
    if (this.analyzers.has(section)) {
      return this.analyzers.get(section)!;
    }
    
    // 否则，创建新的分析器
    let analyzer: SectionAnalyzer;
    
    switch (section) {
      case AnalysisSection.GENRE:
        analyzer = new GenreAnalyzer();
        break;
      case AnalysisSection.FULL:
        analyzer = new FullAnalyzer();
        break;
      default:
        // 对于其他部分，使用通用分析器
        analyzer = {
          analyze: async (context) => {
            const { analyzeSection } = await import("../analyzer");
            return analyzeSection(context, section);
          }
        };
    }
    
    // 缓存分析器
    this.analyzers.set(section, analyzer);
    
    return analyzer;
  }
  
  /**
   * 清除分析器缓存
   */
  public static clearCache(): void {
    this.analyzers.clear();
  }
} 