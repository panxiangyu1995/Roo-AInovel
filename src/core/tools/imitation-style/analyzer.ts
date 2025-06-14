import * as fs from "fs/promises";
import * as path from "path";
import { StyleAnalysisContext, StyleAnalysisResult, StyleAnalyzer, StyleFileContent } from "./types";
import { extractExamples, extractKeywords, extractLanguageFeatures, extractNarrativeFeatures, extractUniqueFeatures } from "./extractors";

/**
 * 默认风格分析器
 * 分析文本内容，提取风格特征
 */
export class DefaultStyleAnalyzer implements StyleAnalyzer {
  /**
   * 分析文本内容
   * @param context 分析上下文
   * @returns 分析结果
   */
  async analyze(context: StyleAnalysisContext): Promise<StyleAnalysisResult> {
    try {
      const { content, cline } = context;
      
      // 告知用户分析进度
      await cline.say("text", "正在分析文本的语言特点...");
      const language = await extractLanguageFeatures(context);
      
      await cline.say("text", "正在分析文本的叙事特点...");
      const narrative = await extractNarrativeFeatures(context);
      
      await cline.say("text", "正在分析文本的独特元素...");
      const unique = await extractUniqueFeatures(context);
      
      await cline.say("text", "正在提取典型例句...");
      const examples = await extractExamples(context);
      
      await cline.say("text", "正在提取关键词...");
      const keywords = await extractKeywords(context);
      
      // 生成模仿技巧
      const tips = {
        sentenceTips: `使用${language.sentencePatterns}的句式，保持${language.sentenceLength}。`,
        vocabularyTips: `选择${language.vocabulary}的词汇，保持${language.vocabularyLevel}的水平。`,
        rhetoricTips: `适当运用${language.rhetoric.join('、')}等修辞手法增强表现力。`,
        narrativeTips: `采用${narrative.perspective}视角，保持${narrative.rhythm}的节奏和${narrative.tone}的情感基调。`,
        emotionTips: `通过${narrative.description}的描述方式和${narrative.dialogue}的对话特点表达情感。`,
        structureTips: `遵循${narrative.structure}的结构特点，注意${narrative.pacing}的节奏控制。`
      };
      
      return {
        language,
        narrative,
        unique,
        tips,
        examples,
        keywords,
        success: true
      };
    } catch (error) {
      console.error("风格分析失败:", error);
      return {
        language: {
          sentencePatterns: "分析失败",
          sentenceLength: "分析失败",
          vocabulary: "分析失败",
          vocabularyLevel: "分析失败",
          rhetoric: ["分析失败"],
          punctuation: "分析失败",
          grammar: "分析失败",
          transitions: ["分析失败"]
        },
        narrative: {
          perspective: "分析失败",
          rhythm: "分析失败",
          tone: "分析失败",
          description: "分析失败",
          dialogue: "分析失败",
          pacing: "分析失败",
          structure: "分析失败"
        },
        unique: {
          signatures: ["分析失败"],
          themes: ["分析失败"],
          imagery: ["分析失败"],
          symbolism: ["分析失败"],
          culturalReferences: ["分析失败"],
          quirks: ["分析失败"]
        },
        tips: {
          sentenceTips: "分析失败",
          vocabularyTips: "分析失败",
          rhetoricTips: "分析失败",
          narrativeTips: "分析失败",
          emotionTips: "分析失败",
          structureTips: "分析失败"
        },
        examples: ["分析失败"],
        keywords: ["分析失败"],
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}

/**
 * 风格文件管理器
 * 负责读取、创建和更新风格文件
 */
export class StyleFileManager {
  /**
   * 创建风格文件
   * @param result 分析结果
   * @param outputPath 输出路径
   */
  static async createStyleFile(result: StyleAnalysisResult, outputPath: string): Promise<void> {
    try {
      // 创建风格文件内容
      const content: StyleFileContent = {
        version: "1.0.0",
        lastUpdated: new Date().toISOString(),
        sampleCount: 1,
        language: result.language,
        narrative: result.narrative,
        unique: result.unique,
        tips: result.tips,
        examples: result.examples,
        keywords: result.keywords,
        rules: [
          `保持${result.language.sentencePatterns}的句式特点`,
          `使用${result.language.vocabulary}的词汇`,
          `运用${result.language.rhetoric.join('、')}等修辞手法`,
          `采用${result.narrative.perspective}视角进行叙述`,
          `保持${result.narrative.tone}的情感基调`,
          `关注${result.unique.themes.join('、')}等主题`
        ]
      };
      
      // 确保目录存在
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      
      // 写入文件
      await fs.writeFile(outputPath, JSON.stringify(content, null, 2), "utf8");
    } catch (error) {
      throw new Error(`创建风格文件失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * 读取风格文件
   * @param filePath 文件路径
   * @returns 风格文件内容
   */
  static async readStyleFile(filePath: string): Promise<StyleFileContent> {
    try {
      const content = await fs.readFile(filePath, "utf8");
      return JSON.parse(content) as StyleFileContent;
    } catch (error) {
      throw new Error(`读取风格文件失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * 更新风格文件
   * @param filePath 文件路径
   * @param newResult 新的分析结果
   */
  static async updateStyleFile(filePath: string, newResult: StyleAnalysisResult): Promise<StyleFileContent> {
    try {
      // 读取原文件
      const originalContent = await this.readStyleFile(filePath);
      
      // 更新内容
      const updatedContent: StyleFileContent = {
        ...originalContent,
        lastUpdated: new Date().toISOString(),
        sampleCount: originalContent.sampleCount + 1,
        // 合并语言特点
        language: {
          sentencePatterns: mergeValues(originalContent.language.sentencePatterns, newResult.language.sentencePatterns),
          sentenceLength: mergeValues(originalContent.language.sentenceLength, newResult.language.sentenceLength),
          vocabulary: mergeValues(originalContent.language.vocabulary, newResult.language.vocabulary),
          vocabularyLevel: mergeValues(originalContent.language.vocabularyLevel, newResult.language.vocabularyLevel),
          rhetoric: mergeArrays(originalContent.language.rhetoric, newResult.language.rhetoric),
          punctuation: mergeValues(originalContent.language.punctuation, newResult.language.punctuation),
          grammar: mergeValues(originalContent.language.grammar, newResult.language.grammar),
          transitions: mergeArrays(originalContent.language.transitions, newResult.language.transitions)
        },
        // 合并叙事特点
        narrative: {
          perspective: mergeValues(originalContent.narrative.perspective, newResult.narrative.perspective),
          rhythm: mergeValues(originalContent.narrative.rhythm, newResult.narrative.rhythm),
          tone: mergeValues(originalContent.narrative.tone, newResult.narrative.tone),
          description: mergeValues(originalContent.narrative.description, newResult.narrative.description),
          dialogue: mergeValues(originalContent.narrative.dialogue, newResult.narrative.dialogue),
          pacing: mergeValues(originalContent.narrative.pacing, newResult.narrative.pacing),
          structure: mergeValues(originalContent.narrative.structure, newResult.narrative.structure)
        },
        // 合并独特元素
        unique: {
          signatures: mergeArrays(originalContent.unique.signatures, newResult.unique.signatures),
          themes: mergeArrays(originalContent.unique.themes, newResult.unique.themes),
          imagery: mergeArrays(originalContent.unique.imagery, newResult.unique.imagery),
          symbolism: mergeArrays(originalContent.unique.symbolism, newResult.unique.symbolism),
          culturalReferences: mergeArrays(originalContent.unique.culturalReferences, newResult.unique.culturalReferences),
          quirks: mergeArrays(originalContent.unique.quirks, newResult.unique.quirks)
        },
        // 更新模仿技巧
        tips: newResult.tips,
        // 合并例句和关键词
        examples: [...originalContent.examples, ...newResult.examples.filter(ex => !originalContent.examples.includes(ex))].slice(0, 10),
        keywords: [...new Set([...originalContent.keywords, ...newResult.keywords])].slice(0, 20),
        // 更新规则
        rules: [
          `保持${newResult.language.sentencePatterns}的句式特点`,
          `使用${newResult.language.vocabulary}的词汇`,
          `运用${newResult.language.rhetoric.join('、')}等修辞手法`,
          `采用${newResult.narrative.perspective}视角进行叙述`,
          `保持${newResult.narrative.tone}的情感基调`,
          `关注${newResult.unique.themes.join('、')}等主题`
        ]
      };
      
      // 写入更新后的文件
      await fs.writeFile(filePath, JSON.stringify(updatedContent, null, 2), "utf8");
      
      return updatedContent;
    } catch (error) {
      throw new Error(`更新风格文件失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

/**
 * 合并两个字符串值，保留两者的特点
 */
function mergeValues(original: string, newValue: string): string {
  if (original === newValue) return original;
  if (original.includes("分析失败") || original.includes("无法分析")) return newValue;
  if (newValue.includes("分析失败") || newValue.includes("无法分析")) return original;
  
  // 检查是否已经包含新值
  if (original.includes(newValue)) return original;
  if (newValue.includes(original)) return newValue;
  
  return `${original}，同时也有${newValue}`;
}

/**
 * 合并两个数组，去重
 */
function mergeArrays<T>(original: T[], newValues: T[]): T[] {
  return [...new Set([...original, ...newValues])];
} 