import { t } from "../../../i18n"

/**
 * Returns the description for the novel_framework_refine tool
 * @returns The description of the novel_framework_refine tool
 */
export function getNovelFrameworkRefineDescription(): string {
	return t("tools:novelFrameworkRefine.description", {
		defaultValue: `Analyze and provide improvement options for novel framework.

Parameters:
- path: The path to the novel framework Markdown file that needs to be refined.
- area (optional): The specific area to focus on for refinement. Can be "character", "plot", "world", or "all". Default is "all".
- template (optional): Whether to use a predefined template when creating a new framework. Default is "true". When set to true, the new framework will include all 13 standard sections with brief descriptions.
- simplify_tasks (optional): Whether to simplify the task structure and reduce nesting levels. Default is "true". When set to true, the workflow will minimize nested subtasks.

This tool analyzes the content of a novel framework file and provides options for improving or completing different aspects of the framework. It identifies areas that could be enhanced, such as character details, plot structure, worldbuilding elements, etc., and presents these as options for the user to choose from.

When creating a new framework file, it automatically applies a template with all 14 standard sections including: Novel subject matter, character design, plot outline, world setting, theme elements, chapter planning, narrative style, writing techniques, market positioning, system setting, emotional design, self-reflection,  creative plan and other precautions.

The tool uses the ask_followup_question tool to present improvement options to the user and capture their selection.

Note: This tool is only available in Novel Framework Mode (planner).`,
	})
}
