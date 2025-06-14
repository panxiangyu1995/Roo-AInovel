import { Task } from "../../task/Task"
import { AskApproval, HandleError, PushToolResult } from "../../../shared/tools"

/**
 * 写作风格分析上下文
 */
export interface StyleAnalysisContext {
  cline: Task; // 任务对象
  askApproval: AskApproval; // 请求批准函数
  handleError: HandleError; // 错误处理函数
  pushToolResult: PushToolResult; // 推送工具结果函数
  content: string; // 分析内容
  outputPath: string; // 输出路径
  styleFilePath?: string; // 已有风格文件路径（用于更新）
}

/**
 * 语言特点分析结果
 */
export interface LanguageFeatures {
  sentencePatterns: string; // 句式模式
  sentenceLength: string; // 句子长度
  vocabulary: string; // 词汇特点
  vocabularyLevel: string; // 词汇水平
  rhetoric: string[]; // 修辞手法
  punctuation: string; // 标点使用
  grammar: string; // 语法特点
  transitions: string[]; // 过渡词使用
}

/**
 * 叙事特点分析结果
 */
export interface NarrativeFeatures {
  perspective: string; // 叙事视角
  rhythm: string; // 节奏
  tone: string; // 情感基调
  description: string; // 描述方式
  dialogue: string; // 对话特点
  pacing: string; // 节奏控制
  structure: string; // 结构特点
}

/**
 * 独特元素分析结果
 */
export interface UniqueFeatures {
  signatures: string[]; // 标志性表达
  themes: string[]; // 主题倾向
  imagery: string[]; // 意象使用
  symbolism: string[]; // 象征手法
  culturalReferences: string[]; // 文化引用
  quirks: string[]; // 特殊习惯
}

/**
 * 模仿技巧分析结果
 */
export interface ImitationTips {
  sentenceTips: string; // 句式技巧
  vocabularyTips: string; // 词汇技巧
  rhetoricTips: string; // 修辞技巧
  narrativeTips: string; // 叙事技巧
  emotionTips: string; // 情感技巧
  structureTips: string; // 结构技巧
}

/**
 * 风格分析结果
 */
export interface StyleAnalysisResult {
  language: LanguageFeatures; // 语言特点
  narrative: NarrativeFeatures; // 叙事特点
  unique: UniqueFeatures; // 独特元素
  tips: ImitationTips; // 模仿技巧
  examples: string[]; // 典型例句
  keywords: string[]; // 关键词
  success: boolean; // 是否成功
  error?: string; // 错误信息
}

/**
 * 写作风格文件内容
 */
export interface StyleFileContent {
  version: string; // 版本号
  lastUpdated: string; // 最后更新时间
  sampleCount: number; // 分析样本数量
  language: LanguageFeatures; // 语言特点
  narrative: NarrativeFeatures; // 叙事特点
  unique: UniqueFeatures; // 独特元素
  tips: ImitationTips; // 模仿技巧
  examples: string[]; // 典型例句
  keywords: string[]; // 关键词
  rules: string[]; // 风格规则
}

/**
 * 风格分析器接口
 */
export interface StyleAnalyzer {
  analyze(context: StyleAnalysisContext): Promise<StyleAnalysisResult>;
}

/**
 * 问卷问题类型
 */
export enum QuestionType {
  TEXT = "text", // 文本输入
  CHOICE = "choice", // 单选
  MULTI_CHOICE = "multi_choice", // 多选
  SCALE = "scale", // 量表
}

/**
 * 风格问卷问题
 */
export interface StyleQuestion {
  id: string; // 问题ID
  type: QuestionType; // 问题类型
  question: string; // 问题内容
  options?: string[]; // 选项（用于选择题）
  min?: number; // 最小值（用于量表）
  max?: number; // 最大值（用于量表）
  required: boolean; // 是否必答
}

/**
 * 风格问卷答案
 */
export interface StyleAnswer {
  questionId: string; // 问题ID
  answer: string | string[] | number; // 答案
}

/**
 * 风格问卷
 */
export interface StyleQuestionnaire {
  questions: StyleQuestion[]; // 问题列表
  answers: StyleAnswer[]; // 答案列表
} 