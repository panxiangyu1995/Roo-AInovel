import { ToolArgs } from "./types"

export function getNovelFrameworkUpdateDescription(_args?: ToolArgs): string {
  return `## novel_framework_update

Automatically update the novel framework based on current content. It checks for consistency with existing framework and updates accordingly.

### Parameters:
- \`content\` (required): The new content that should be analyzed to update the framework
- \`updateType\` (optional): The type of update to perform (e.g., 'chapter', 'character', 'world', 'all')

### Example:
\`\`\`json
{
  "content": "Chapter 1: The Beginning\\n\\nAs John walked through the forest, he noticed...",
  "updateType": "chapter"
}
\`\`\`

Use this tool when you've generated new content and want to automatically update the novel framework to maintain consistency. The tool will analyze the content, compare it with the existing framework, and make necessary updates while preserving the framework structure.`
} 