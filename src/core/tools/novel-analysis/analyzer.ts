import { AnalysisContext, AnalysisResult, AnalysisSection } from "./types";
import { formatPrompt } from "./formatters";
import { truncateContent } from "./extractors";

/**
 * 分析单个部分
 * @param context 分析上下文
 * @param section 分析部分
 * @returns 分析结果
 */
export async function analyzeSection(context: AnalysisContext, section: AnalysisSection): Promise<AnalysisResult> {
  try {
    const { cline, title, content } = context;
    
    // 截断内容，避免超出模型限制
    const truncatedContent = truncateContent(content, 10000);
    
    // 生成分析提示词
    const analysisPrompt = formatPrompt(section, title, truncatedContent);
    
    // 创建临时用户消息并获取响应
    const tempMessages = [{ role: "user" as const, content: analysisPrompt }];
    let analysisResponse = "";
    
    try {
      // 创建消息流
      const stream = cline.api.createMessage("", tempMessages);
      
      // 处理流中的内容
      for await (const chunk of stream) {
        if (chunk && typeof chunk === "string") {
          analysisResponse += chunk;
        }
      }
      
      return {
        section,
        content: analysisResponse,
        success: true
      };
    } catch (error) {
      console.error(`分析部分 ${section} 时出错:`, error);
      return {
        section,
        content: "",
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  } catch (error) {
    console.error(`处理部分 ${section} 时出错:`, error);
    return {
      section,
      content: "",
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * 分析多个部分
 * @param context 分析上下文
 * @returns 分析结果数组
 */
export async function analyzeSections(context: AnalysisContext): Promise<AnalysisResult[]> {
  const results: AnalysisResult[] = [];
  const { sections, cline, pushToolResult } = context;
  
  // 如果只有FULL部分，直接分析
  if (sections.length === 1 && sections[0] === AnalysisSection.FULL) {
    await cline.say("text", `正在进行全面分析...`);
    const result = await analyzeSection(context, AnalysisSection.FULL);
    results.push(result);
    return results;
  }
  
  // 否则，逐个分析各部分
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    await cline.say("text", `正在分析第 ${i + 1}/${sections.length} 部分: ${section}...`);
    
    const result = await analyzeSection(context, section);
    results.push(result);
    
    // 报告进度
    const progressMessage = result.success
      ? `完成 ${i + 1}/${sections.length} 部分: ${section}`
      : `分析 ${section} 部分时出错: ${result.error}`;
    
    await cline.say("text", progressMessage);
    pushToolResult(progressMessage);
  }
  
  return results;
} 