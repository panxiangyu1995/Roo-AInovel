import * as vscode from "vscode"
import { Task } from "../task/Task"
import { ImitationToolUse, AskApproval, HandleError, PushToolResult, RemoveClosingTag } from "../../shared/tools"
import { imitationTool as newImitationTool } from "./imitation-style"

/**
 * 文学风格模仿工具 - 分析参考文本并生成指定风格的内容
 * 
 * 此工具已重构为模块化结构，现在支持以下功能：
 * 1. 分析用户的写作内容，生成专属风格文件
 * 2. 支持更新现有风格文件
 * 3. 通过问卷方式收集风格信息
 * 
 * 使用方法：
 * - analyze模式：分析文本并生成风格文件
 * - update模式：更新现有风格文件
 * - questionnaire模式：通过问卷收集风格信息
 */
export async function imitationTool(
	cline: Task,
	block: ImitationToolUse,
	askApproval: AskApproval,
	handleError: HandleError,
	pushToolResult: PushToolResult,
	removeClosingTag: RemoveClosingTag,
) {
	// 使用新的模块化实现
	await newImitationTool(cline, block, askApproval, handleError, pushToolResult, removeClosingTag);
}
