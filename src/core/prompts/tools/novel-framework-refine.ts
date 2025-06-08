import { t } from "../../../i18n"

/**
 * Returns the description for the novel_framework_refine tool
 * @returns The description of the novel_framework_refine tool
 */
export function getNovelFrameworkRefineDescription(): string {
	return `## novel_framework_refine
	
优化或完善小说框架结构。

### 参数:
- \`path\`: 小说框架文件路径
- \`area\`: 需要优化的区域（可选，如"情节"、"角色"、"世界观"等）

### 示例:
\`\`\`json
{
  "name": "novel_framework_refine",
  "params": {
    "path": "framework/outline.md",
    "area": "情节冲突"
  }
}
\`\`\`
`;
}
