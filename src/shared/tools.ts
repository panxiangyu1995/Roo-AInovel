import { Anthropic } from "@anthropic-ai/sdk"

import type { ClineAsk, ToolProgressStatus, ToolGroup, ToolName } from "@roo-code/types"

export type ToolResponse = string | Array<Anthropic.TextBlockParam | Anthropic.ImageBlockParam>

export type AskApproval = (
	type: ClineAsk,
	partialMessage?: string,
	progressStatus?: ToolProgressStatus,
) => Promise<boolean>

export type HandleError = (action: string, error: Error) => Promise<void>

export type PushToolResult = (content: ToolResponse) => void

export type RemoveClosingTag = (tag: ToolParamName, content?: string) => string

export type AskFinishSubTaskApproval = () => Promise<boolean>

export type ToolDescription = () => string

export interface TextContent {
	type: "text"
	content: string
	partial: boolean
}

export const toolParamNames = [
	"command",
	"path",
	"content",
	"line_count",
	"regex",
	"file_pattern",
	"recursive",
	"action",
	"url",
	"coordinate",
	"text",
	"server_name",
	"tool_name",
	"arguments",
	"resource_id",
	"question",
	"mode_slug",
	"reason",
	"message",
	"mode",
	"task_id",
	"diff",
	"replace",
	"search",
	"line",
	"query",
	"comment",
	"type",
	"explain",
	"output_dir",
	"merge",
	"preserve_paragraphs",
	"area",
	"ratio",
	"output_path",
	"use_comments",
	"topic",
	"aspect",
	"count",
	"title",
	"uri",
	"follow_up",
	"task",
	"size",
	"use_regex",
	"ignore_case",
	"args",
	"start_line",
	"end_line",
	"cwd",
	"result",
	"style",
	"layout",
	"panels",
	"updateType",
	"style_file",
] as const

export type ToolParamName = (typeof toolParamNames)[number]

export interface ToolUse {
	type: "tool_use"
	name: ToolName
	// params is a partial record, allowing only some or none of the possible parameters to be used
	params: Partial<Record<ToolParamName, string>>
	partial: boolean
}

export interface ExecuteCommandToolUse extends ToolUse {
	name: "execute_command"
	// Pick<Record<ToolParamName, string>, "command"> makes "command" required, but Partial<> makes it optional
	params: Partial<Pick<Record<ToolParamName, string>, "command" | "cwd">>
}

export interface ReadFileToolUse extends ToolUse {
	name: "read_file"
	params: Partial<Pick<Record<ToolParamName, string>, "args" | "path" | "start_line" | "end_line">>
}

export interface FetchInstructionsToolUse extends ToolUse {
	name: "fetch_instructions"
	params: Partial<Pick<Record<ToolParamName, string>, "task">>
}

export interface WriteToFileToolUse extends ToolUse {
	name: "write_to_file"
	params: Partial<Pick<Record<ToolParamName, string>, "path" | "content" | "line_count">>
}

export interface InsertCodeBlockToolUse extends ToolUse {
	name: "insert_content"
	params: Partial<Pick<Record<ToolParamName, string>, "path" | "line" | "content">>
}

export interface CodebaseSearchToolUse extends ToolUse {
	name: "codebase_search"
	params: Partial<Pick<Record<ToolParamName, string>, "query" | "path">>
}

export interface SearchFilesToolUse extends ToolUse {
	name: "search_files"
	params: Partial<Pick<Record<ToolParamName, string>, "path" | "regex" | "file_pattern">>
}

export interface ListFilesToolUse extends ToolUse {
	name: "list_files"
	params: Partial<Pick<Record<ToolParamName, string>, "path" | "recursive">>
}

export interface ListCodeDefinitionNamesToolUse extends ToolUse {
	name: "list_code_definition_names"
	params: Partial<Pick<Record<ToolParamName, string>, "path">>
}

export interface BrowserActionToolUse extends ToolUse {
	name: "browser_action"
	params: Partial<Pick<Record<ToolParamName, string>, "action" | "url" | "coordinate" | "text" | "size">>
}

export interface UseMcpToolToolUse extends ToolUse {
	name: "use_mcp_tool"
	params: Partial<Pick<Record<ToolParamName, string>, "server_name" | "tool_name" | "arguments">>
}

export interface AccessMcpResourceToolUse extends ToolUse {
	name: "access_mcp_resource"
	params: Partial<Pick<Record<ToolParamName, string>, "server_name" | "uri">>
}

export interface AskFollowupQuestionToolUse extends ToolUse {
	name: "ask_followup_question"
	params: Partial<Pick<Record<ToolParamName, string>, "question" | "follow_up">>
}

export interface AttemptCompletionToolUse extends ToolUse {
	name: "attempt_completion"
	params: Partial<Pick<Record<ToolParamName, string>, "result" | "command">>
}

export interface SwitchModeToolUse extends ToolUse {
	name: "switch_mode"
	params: Partial<Pick<Record<ToolParamName, string>, "mode_slug" | "reason">>
}

export interface NewTaskToolUse extends ToolUse {
	name: "new_task"
	params: Partial<Pick<Record<ToolParamName, string>, "mode" | "message">>
}

export interface SearchAndReplaceToolUse extends ToolUse {
	name: "search_and_replace"
	params: Required<Pick<Record<ToolParamName, string>, "path" | "search" | "replace">> &
		Partial<Pick<Record<ToolParamName, string>, "use_regex" | "ignore_case" | "start_line" | "end_line">>
}

export interface NovelCommentToolUse extends ToolUse {
	name: "novel_comment"
	params: Partial<Pick<Record<ToolParamName, string>, "path" | "line" | "content" | "explain">>
}

export interface NovelFrameworkRefineToolUse extends ToolUse {
	name: "novel_framework_refine"
	params: Partial<Pick<Record<ToolParamName, string>, "path" | "area">>
}

export interface NovelFrameworkUpdateToolUse extends ToolUse {
	name: "novel_framework_update"
	params: Partial<Pick<Record<ToolParamName, string>, "content" | "updateType">>
}

export interface ContentExpansionToolUse extends ToolUse {
	name: "content_expansion"
	params: Partial<Pick<Record<ToolParamName, string>, "path" | "ratio" | "output_path" | "use_comments">>
}

export interface FormatConverterToolUse extends ToolUse {
	name: "format_converter"
	params: Partial<Pick<Record<ToolParamName, string>, "path" | "output_dir" | "merge" | "preserve_paragraphs">>
}

export interface InspirationToolUse extends ToolUse {
	name: "inspiration"
	params: Partial<Pick<Record<ToolParamName, string>, "topic" | "aspect" | "count" | "output_path">>
}

export interface ImitationToolUse extends ToolUse {
	name: "imitation"
	params: Partial<Pick<Record<ToolParamName, string>, "path" | "text" | "output_path" | "mode" | "style_file">>
}

export interface NovelToScriptToolUse extends ToolUse {
	name: "novel_to_script"
	params: Partial<Pick<Record<ToolParamName, string>, "path" | "type" | "title" | "output_path" | "text">>
}

export interface NovelAnalysisToolUse extends ToolUse {
	name: "novel_analysis"
	params: Partial<Pick<Record<ToolParamName, string>, "path" | "type" | "title" | "output_path" | "text">>
}

export interface NovelContentSearchToolUse extends ToolUse {
	name: "novel_content_search"
	params: Partial<Pick<Record<ToolParamName, string>, "path" | "query" | "type">>
}

export interface ComicGeneratorToolUse extends ToolUse {
	name: "comic_generator"
	params: Partial<Pick<Record<ToolParamName, string>, "content" | "style" | "layout" | "panels" | "output_path">>
}

// Define tool group configuration
export type ToolGroupConfig = {
	tools: readonly string[]
	alwaysAvailable?: boolean // Whether this group is always available and shouldn't show in prompts view
}

export const TOOL_DISPLAY_NAMES: Record<ToolName, string> = {
	execute_command: "run commands",
	read_file: "read files",
	fetch_instructions: "fetch instructions",
	write_to_file: "write files",
	apply_diff: "apply changes",
	search_files: "search files",
	list_files: "list files",
	list_code_definition_names: "list definitions",
	browser_action: "use a browser",
	use_mcp_tool: "use mcp tools",
	access_mcp_resource: "access mcp resources",
	ask_followup_question: "ask questions",
	attempt_completion: "complete tasks",
	switch_mode: "switch modes",
	new_task: "create new task",
	insert_content: "insert content",
	search_and_replace: "search and replace",
	codebase_search: "codebase search",
	novel_comment: "add novel comments",
	format_converter: "convert file formats",
	novel_framework_refine: "refine novel framework",
	novel_framework_update: "update novel framework",
	content_expansion: "expand content",
	inspiration: "generate inspiration",
	imitation: "imitate writing style",
	novel_to_script: "convert novel to script",
	novel_analysis: "analyze novel",
	novel_content_search: "search novel content",
	comic_generator: "generate comics",
} as const

export const toolGroups = [
	"read",
	"edit",
	"browser",
	"command",
	"mcp",
	"modes",
	"formatter",
	"inspiration",
	"imitation",
	"script_adaptation",
	"analysis",
	"comic",
	"framework_refine",
	"framework_update",
] as const

// Define available tool groups.
export const TOOL_GROUPS: Record<ToolGroup, ToolGroupConfig> = {
	read: {
		tools: [
			"read_file",
			"fetch_instructions",
			"search_files",
			"list_files",
			"list_code_definition_names",
			"codebase_search",
			"novel_content_search",
		],
	},
	edit: {
		tools: [
			"apply_diff",
			"write_to_file",
			"insert_content",
			"search_and_replace",
			"novel_comment",
		],
	},
	browser: {
		tools: ["browser_action"],
	},
	command: {
		tools: ["execute_command"],
	},
	mcp: {
		tools: ["use_mcp_tool", "access_mcp_resource"],
	},
	modes: {
		tools: ["switch_mode", "new_task"],
	},
	formatter: {
		tools: ["format_converter"],
	},
	inspiration: {
		tools: ["inspiration"],
	},
	imitation: {
		tools: ["imitation"],
	},
	script_adaptation: {
		tools: ["novel_to_script"],
	},
	analysis: {
		tools: ["novel_analysis"],
	},
	comic: {
		tools: ["comic_generator"],
	},
	framework_refine: {
		tools: ["novel_framework_refine"],
	},
	framework_update: {
		tools: ["novel_framework_update"],
	},
}

// Tools that are always available to all modes.
export const ALWAYS_AVAILABLE_TOOLS: ToolName[] = [
	"ask_followup_question",
	"attempt_completion",
	"switch_mode",
	"new_task",
] as const

export type DiffResult =
	| { success: true; content: string; failParts?: DiffResult[] }
	| ({
			success: false
			error?: string
			details?: {
				similarity?: number
				threshold?: number
				matchedRange?: { start: number; end: number }
				searchContent?: string
				bestMatch?: string
			}
			failParts?: DiffResult[]
	  } & ({ error: string } | { failParts: DiffResult[] }))

export interface DiffStrategy {
	/**
	 * Get the name of this diff strategy for analytics and debugging
	 * @returns The name of the diff strategy
	 */
	getName(): string

	/**
	 * Get the tool description for this diff strategy
	 * @param args The tool arguments including cwd and toolOptions
	 * @returns The complete tool description including format requirements and examples
	 */
	getToolDescription(args: { cwd: string; toolOptions?: { [key: string]: string } }): string

	/**
	 * Apply a diff to the original content
	 * @param originalContent The original file content
	 * @param diffContent The diff content in the strategy's format
	 * @param startLine Optional line number where the search block starts. If not provided, searches the entire file.
	 * @param endLine Optional line number where the search block ends. If not provided, searches the entire file.
	 * @returns A DiffResult object containing either the successful result or error details
	 */
	applyDiff(originalContent: string, diffContent: string, startLine?: number, endLine?: number): Promise<DiffResult>

	getProgressStatus?(toolUse: ToolUse, result?: any): ToolProgressStatus
}

export const TOOL_DESCRIPTIONS = {
	execute_command: "run commands",
	read_file: "read files",
	fetch_instructions: "fetch instructions",
	write_to_file: "write files",
	apply_diff: "apply changes",
	insert_content: "insert content",
	search_and_replace: "search and replace",
	search_files: "search files",
	list_files: "list files",
	list_code_definition_names: "list symbols",
	browser_action: "open a browser",
	use_mcp_tool: "use a custom tool",
	access_mcp_resource: "access a custom resource",
	codebase_search: "search the codebase",
	ask_followup_question: "ask a follow-up question",
	attempt_completion: "finish a partial task or command",
	switch_mode: "switch assistant mode",
	new_task: "start a new task",
	novel_comment: "add novel comments",
	format_converter: "convert file formats",
	novel_framework_refine: "refine novel framework",
	novel_framework_update: "update novel framework",
	content_expansion: "expand content",
	inspiration: "generate inspiration",
	imitation: "imitate style",
	novel_to_script: "convert novel to script",
	novel_analysis: "analyze novel",
	novel_content_search: "search novel content",
	comic_generator: "generate comics",
} as const
