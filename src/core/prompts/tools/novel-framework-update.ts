import { ToolArgs } from "./types"

export function getNovelFrameworkUpdateDescription(): string {
    return `## novel_framework_update
    
更新小说框架内容。

### 参数:
- \`content\`: 更新的内容
- \`updateType\`: 更新类型（可选，如"添加"、"修改"、"删除"等）

### 示例:
\`\`\`json
{
  "name": "novel_framework_update",
  "params": {
    "content": "第三章将描述主角遇到的第一个挑战",
    "updateType": "添加章节"
  }
}
\`\`\`
`;
} 