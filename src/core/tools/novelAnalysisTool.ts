// 修复导入错误 - 触发文件重新加载
import * as vscode from "vscode"
import * as path from "path"
import * as fsPromises from "fs/promises"

import { Task } from "../task/Task"
import {
	ToolUse,
	AskApproval,
	HandleError,
	PushToolResult,
	RemoveClosingTag,
	NovelAnalysisToolUse,
} from "../../shared/tools"
import { formatResponse } from "../prompts/responses"
import { RecordSource } from "../context-tracking/FileContextTrackerTypes"
import { fileExistsAtPath } from "../../utils/fs"
import { getReadablePath } from "../../utils/path"
import { isPathOutsideWorkspace } from "../../utils/pathUtils"
import { CodeIndexManager } from "../../services/code-index/manager"
import { novelContentSearchTool } from "./novelContentSearchTool"

// 导入新的模块化分析工具
import { novelAnalysisTool as moduleNovelAnalysisTool } from "./novel-analysis"

// 导出旧的分析类型枚举，保持向后兼容
export enum AnalysisType {
	GENRE = "genre", // 小说类型分析
	WORLDVIEW = "worldview", // 世界观分析
	CHARACTER = "character", // 角色关系分析
	PLOT = "plot", // 情节结构分析
	STYLE = "style", // 写作风格分析
	THEME = "theme", // 主题探索分析
	FULL = "full", // 完整分析（包含所有类型）
}

/**
 * 小说分析工具 - 分析小说的类型、世界观、角色关系、情节结构、写作风格和主题
 * 
 * 注意：此函数是一个包装器，实际实现已移至模块化结构中
 */
export async function novelAnalysisTool(
	cline: Task,
	block: NovelAnalysisToolUse,
	askApproval: AskApproval,
	handleError: HandleError,
	pushToolResult: PushToolResult,
	removeClosingTag: RemoveClosingTag,
) {
	// 调用模块化实现
	return moduleNovelAnalysisTool(
		cline,
		block,
		askApproval,
		handleError,
		pushToolResult,
		removeClosingTag
	);
}

/**
 * 从内容中提取小说标题
 */
function extractNovelTitle(content: string): string {
	// 尝试从内容的第一行或者 # 标题中提取
	const lines = content.split("\n")

	// 查找 Markdown 标题
	for (const line of lines) {
		const titleMatch = line.match(/^#\s+(.+)$/)
		if (titleMatch) {
			return titleMatch[1].trim()
		}
	}

	// 如果没有找到 Markdown 标题，使用第一行非空文本
	for (const line of lines) {
		const trimmedLine = line.trim()
		if (trimmedLine) {
			return trimmedLine
		}
	}

	return "未命名小说"
}

/**
 * 生成分析提示
 */
function generateAnalysisPrompt(type: AnalysisType, content: string, title: string): string {
	const maxContentLength = 10000 // 限制内容长度
	const truncatedContent = content.substring(0, maxContentLength)

	switch (type) {
		case AnalysisType.GENRE:
			return `分析以下小说《${title}》内容，确定其所属的文学类型或流派，并详细说明判断依据：\n\n${truncatedContent}`
		case AnalysisType.WORLDVIEW:
			return `分析以下小说《${title}》内容，提取并详细描述其世界观设定、背景规则和独特元素：\n\n${truncatedContent}`
		case AnalysisType.CHARACTER:
			return `分析以下小说《${title}》内容，识别主要角色，并详细描述他们的特点、动机和相互关系：\n\n${truncatedContent}`
		case AnalysisType.PLOT:
			return `分析以下小说《${title}》内容，识别其情节结构、关键转折点、冲突设置和叙事节奏：\n\n${truncatedContent}`
		case AnalysisType.STYLE:
			return `分析以下小说《${title}》内容，识别作者的语言风格、叙事技巧和修辞特点：\n\n${truncatedContent}`
		case AnalysisType.THEME:
			return `分析以下小说《${title}》内容，探索其核心主题、隐含意义和哲学思考：\n\n${truncatedContent}`
		case AnalysisType.FULL:
		default:
			return `对小说《${title}》进行全面分析，包括：
1. 小说类型与流派
2. 世界观与背景设定
3. 角色特点与关系
4. 情节结构与叙事节奏
5. 写作风格与技巧
6. 核心主题与深层含义

请提供详细分析，并在适当位置引用原文内容作为支持：\n\n${truncatedContent}`
	}
}

/**
 * 格式化分析内容
 */
function formatAnalysisContent(type: AnalysisType, title: string, analysisResponse: string): string {
	switch (type) {
		case AnalysisType.GENRE:
			return `# ${title} - 小说类型分析\n\n## 小说类型分析\n\n${analysisResponse}\n`
		case AnalysisType.WORLDVIEW:
			return `# ${title} - 世界观分析\n\n## 世界观分析\n\n${analysisResponse}\n`
		case AnalysisType.CHARACTER:
			return `# ${title} - 角色关系分析\n\n## 角色关系分析\n\n${analysisResponse}\n\n## 角色关系图\n\n请根据以上分析绘制角色关系图。\n`
		case AnalysisType.PLOT:
			return `# ${title} - 情节结构分析\n\n## 情节结构分析\n\n${analysisResponse}\n\n## 情节发展曲线\n\n请根据以上分析绘制情节发展曲线图。\n`
		case AnalysisType.STYLE:
			return `# ${title} - 写作风格分析\n\n## 写作风格分析\n\n${analysisResponse}\n`
		case AnalysisType.THEME:
			return `# ${title} - 主题探索分析\n\n## 主题探索分析\n\n${analysisResponse}\n`
		case AnalysisType.FULL:
		default:
			return `# ${title} - 小说全面分析报告\n\n## 引言\n\n本报告对《${title}》进行了全面分析，包括小说类型、世界观设定、角色关系、情节结构、写作风格和主题探索等方面。\n\n${analysisResponse}\n\n## 结论\n\n通过以上分析，我们可以更全面地理解《${title}》的艺术价值和文学意义。`
	}
}

/**
 * 获取分析类型的显示名称
 */
function getAnalysisTypeDisplayName(type: AnalysisType): string {
	const displayNames: Record<AnalysisType, string> = {
		[AnalysisType.GENRE]: "类型分析",
		[AnalysisType.WORLDVIEW]: "世界观分析",
		[AnalysisType.CHARACTER]: "角色关系分析",
		[AnalysisType.PLOT]: "情节结构分析",
		[AnalysisType.STYLE]: "写作风格分析",
		[AnalysisType.THEME]: "主题探索分析",
		[AnalysisType.FULL]: "全面分析",
	}

	return displayNames[type] || "分析"
}
