import { Task } from "../../task/Task"
import { AskApproval, HandleError, PushToolResult, RemoveClosingTag } from "../../../shared/tools"

/**
 * 小说分析部分枚举
 */
export enum AnalysisSection {
  GENRE = "genre", // 小说类型分析
  WORLDVIEW = "worldview", // 世界观分析
  CHARACTER = "character", // 角色关系分析
  PLOT = "plot", // 情节结构分析
  STYLE = "style", // 写作风格分析
  THEME = "theme", // 主题探索分析
  LANGUAGE = "language", // 语言特点分析
  NARRATIVE = "narrative", // 叙事视角分析
  TIMELINE = "timeline", // 时间线分析
  SETTING = "setting", // 场景设置分析
  CONFLICT = "conflict", // 冲突与矛盾分析
  SYMBOLISM = "symbolism", // 象征与隐喻分析
  READER_EXPERIENCE = "reader_experience", // 读者体验分析
  FULL = "full", // 完整分析（包含所有部分）
}

/**
 * 分析部分配置
 */
export interface SectionConfig {
  id: AnalysisSection; // 部分ID
  displayName: string; // 显示名称
  description: string; // 描述
  promptTemplate: string; // 提示模板
  outputTemplate: string; // 输出模板
  order: number; // 排序
}

/**
 * 分析上下文
 */
export interface AnalysisContext {
  cline: Task; // 任务对象
  askApproval: AskApproval; // 请求批准函数
  handleError: HandleError; // 错误处理函数
  pushToolResult: PushToolResult; // 推送工具结果函数
  removeClosingTag: RemoveClosingTag; // 移除闭合标签函数
  title: string; // 小说标题
  content: string; // 小说内容
  outputPath: string; // 输出路径
  sections: AnalysisSection[]; // 要分析的部分
}

/**
 * 分析结果
 */
export interface AnalysisResult {
  section: AnalysisSection; // 分析部分
  content: string; // 分析内容
  success: boolean; // 是否成功
  error?: string; // 错误信息
}

/**
 * 分析处理器接口
 */
export interface SectionAnalyzer {
  analyze(context: AnalysisContext): Promise<AnalysisResult>;
}

/**
 * 分析部分配置映射
 */
export const SECTION_CONFIGS: Record<AnalysisSection, SectionConfig> = {
  [AnalysisSection.GENRE]: {
    id: AnalysisSection.GENRE,
    displayName: "小说类型分析",
    description: "确定小说所属的文学类型或流派，并详细说明判断依据",
    promptTemplate: "分析以下小说《{title}》内容，确定其所属的文学类型或流派，并详细说明判断依据：\n\n{content}",
    outputTemplate: "# {title} - 小说类型分析\n\n## 小说类型分析\n\n{content}\n",
    order: 1,
  },
  [AnalysisSection.WORLDVIEW]: {
    id: AnalysisSection.WORLDVIEW,
    displayName: "世界观分析",
    description: "提取并详细描述小说的世界观设定、背景规则和独特元素",
    promptTemplate: "分析以下小说《{title}》内容，提取并详细描述其世界观设定、背景规则和独特元素：\n\n{content}",
    outputTemplate: "# {title} - 世界观分析\n\n## 世界观分析\n\n{content}\n",
    order: 2,
  },
  [AnalysisSection.CHARACTER]: {
    id: AnalysisSection.CHARACTER,
    displayName: "角色关系分析",
    description: "识别主要角色，并详细描述他们的特点、动机和相互关系",
    promptTemplate: "分析以下小说《{title}》内容，识别主要角色，并详细描述他们的特点、动机和相互关系：\n\n{content}",
    outputTemplate: "# {title} - 角色关系分析\n\n## 角色关系分析\n\n{content}\n\n## 角色关系图\n\n请根据以上分析绘制角色关系图。\n",
    order: 3,
  },
  [AnalysisSection.PLOT]: {
    id: AnalysisSection.PLOT,
    displayName: "情节结构分析",
    description: "识别小说的情节结构、关键转折点、冲突设置和叙事节奏",
    promptTemplate: "分析以下小说《{title}》内容，识别其情节结构、关键转折点、冲突设置和叙事节奏：\n\n{content}",
    outputTemplate: "# {title} - 情节结构分析\n\n## 情节结构分析\n\n{content}\n\n## 情节发展曲线\n\n请根据以上分析绘制情节发展曲线图。\n",
    order: 4,
  },
  [AnalysisSection.STYLE]: {
    id: AnalysisSection.STYLE,
    displayName: "写作风格分析",
    description: "识别作者的语言风格、叙事技巧和修辞特点",
    promptTemplate: "分析以下小说《{title}》内容，识别作者的语言风格、叙事技巧和修辞特点：\n\n{content}",
    outputTemplate: "# {title} - 写作风格分析\n\n## 写作风格分析\n\n{content}\n",
    order: 5,
  },
  [AnalysisSection.THEME]: {
    id: AnalysisSection.THEME,
    displayName: "主题探索分析",
    description: "探索小说的核心主题、隐含意义和哲学思考",
    promptTemplate: "分析以下小说《{title}》内容，探索其核心主题、隐含意义和哲学思考：\n\n{content}",
    outputTemplate: "# {title} - 主题探索分析\n\n## 主题探索分析\n\n{content}\n",
    order: 6,
  },
  [AnalysisSection.LANGUAGE]: {
    id: AnalysisSection.LANGUAGE,
    displayName: "语言特点分析",
    description: "分析小说的语言特点、词汇选择、句式结构和语言节奏",
    promptTemplate: "分析以下小说《{title}》内容，详细描述其语言特点、词汇选择、句式结构和语言节奏：\n\n{content}",
    outputTemplate: "# {title} - 语言特点分析\n\n## 语言特点分析\n\n{content}\n",
    order: 7,
  },
  [AnalysisSection.NARRATIVE]: {
    id: AnalysisSection.NARRATIVE,
    displayName: "叙事视角分析",
    description: "分析小说的叙事视角、叙事声音和叙事距离",
    promptTemplate: "分析以下小说《{title}》内容，详细描述其叙事视角、叙事声音和叙事距离：\n\n{content}",
    outputTemplate: "# {title} - 叙事视角分析\n\n## 叙事视角分析\n\n{content}\n",
    order: 8,
  },
  [AnalysisSection.TIMELINE]: {
    id: AnalysisSection.TIMELINE,
    displayName: "时间线分析",
    description: "分析小说的时间线结构、时间跨度和时间处理技巧",
    promptTemplate: "分析以下小说《{title}》内容，详细描述其时间线结构、时间跨度和时间处理技巧：\n\n{content}",
    outputTemplate: "# {title} - 时间线分析\n\n## 时间线分析\n\n{content}\n\n## 时间线图\n\n请根据以上分析绘制时间线图。\n",
    order: 9,
  },
  [AnalysisSection.SETTING]: {
    id: AnalysisSection.SETTING,
    displayName: "场景设置分析",
    description: "分析小说的场景设置、环境描写和空间构建",
    promptTemplate: "分析以下小说《{title}》内容，详细描述其场景设置、环境描写和空间构建：\n\n{content}",
    outputTemplate: "# {title} - 场景设置分析\n\n## 场景设置分析\n\n{content}\n",
    order: 10,
  },
  [AnalysisSection.CONFLICT]: {
    id: AnalysisSection.CONFLICT,
    displayName: "冲突与矛盾分析",
    description: "分析小说中的各种冲突和矛盾，包括内部冲突和外部冲突",
    promptTemplate: "分析以下小说《{title}》内容，详细描述其中的各种冲突和矛盾，包括内部冲突和外部冲突：\n\n{content}",
    outputTemplate: "# {title} - 冲突与矛盾分析\n\n## 冲突与矛盾分析\n\n{content}\n",
    order: 11,
  },
  [AnalysisSection.SYMBOLISM]: {
    id: AnalysisSection.SYMBOLISM,
    displayName: "象征与隐喻分析",
    description: "分析小说中的象征、隐喻和其他修辞手法",
    promptTemplate: "分析以下小说《{title}》内容，详细描述其中的象征、隐喻和其他修辞手法：\n\n{content}",
    outputTemplate: "# {title} - 象征与隐喻分析\n\n## 象征与隐喻分析\n\n{content}\n",
    order: 12,
  },
  [AnalysisSection.READER_EXPERIENCE]: {
    id: AnalysisSection.READER_EXPERIENCE,
    displayName: "读者体验分析",
    description: "分析小说对读者的情感影响、阅读体验和可能的解读",
    promptTemplate: "分析以下小说《{title}》内容，详细描述其对读者的情感影响、阅读体验和可能的解读：\n\n{content}",
    outputTemplate: "# {title} - 读者体验分析\n\n## 读者体验分析\n\n{content}\n",
    order: 13,
  },
  [AnalysisSection.FULL]: {
    id: AnalysisSection.FULL,
    displayName: "全面分析",
    description: "对小说进行全面分析，包括所有13个部分",
    promptTemplate: `对小说《{title}》进行全面分析，包括：
1. 小说类型与流派
2. 世界观与背景设定
3. 角色特点与关系
4. 情节结构与叙事节奏
5. 写作风格与技巧
6. 核心主题与深层含义
7. 语言特点与表达方式
8. 叙事视角与叙述方法
9. 时间线结构与处理
10. 场景设置与环境描写
11. 冲突与矛盾设置
12. 象征与隐喻运用
13. 读者体验与情感影响

请提供详细分析，并在适当位置引用原文内容作为支持：\n\n{content}`,
    outputTemplate: `# {title} - 小说全面分析报告

## 引言

本报告对《{title}》进行了全面分析，包括小说类型、世界观设定、角色关系、情节结构、写作风格、主题探索、语言特点、叙事视角、时间线结构、场景设置、冲突与矛盾、象征与隐喻以及读者体验等方面。

{content}

## 结论

通过以上分析，我们可以更全面地理解《{title}》的艺术价值和文学意义。`,
    order: 0,
  },
};

/**
 * 获取分析部分的显示名称
 */
export function getSectionDisplayName(section: AnalysisSection): string {
  return SECTION_CONFIGS[section]?.displayName || "分析";
}

/**
 * 获取所有分析部分（按顺序排序）
 */
export function getAllSections(): SectionConfig[] {
  return Object.values(SECTION_CONFIGS).sort((a, b) => a.order - b.order);
}

/**
 * 获取除FULL外的所有分析部分（按顺序排序）
 */
export function getAllRegularSections(): SectionConfig[] {
  return Object.values(SECTION_CONFIGS)
    .filter(config => config.id !== AnalysisSection.FULL)
    .sort((a, b) => a.order - b.order);
} 