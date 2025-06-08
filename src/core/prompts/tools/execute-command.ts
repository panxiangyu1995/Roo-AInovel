import { ToolArgs } from "./types"

export function getExecuteCommandDescription(args: ToolArgs): string | undefined {
	return `## execute_command
Description: 此工具仅应在需要创建新文件夹时使用。当需要在系统中创建新目录结构时，可以通过此工具执行命令行操作。请确保命令适用于用户的操作系统，并提供清晰的解释说明命令的作用。对于其他文件操作（如读取、写入、修改文件等），请使用专门的文件操作工具而非此命令行工具。请优先使用相对路径以避免路径敏感性问题，例如：\`mkdir -p ./testdata/newdir\`。如果用户指定，您可以使用\`cwd\`参数在不同目录中执行命令。

Parameters:
- command: (必填) 要执行的命令行命令。此命令应对当前操作系统有效，主要用于创建新的目录结构。确保命令格式正确且不包含任何有害指令。
- cwd: (可选) 执行命令的工作目录 (默认: ${args.cwd})

Usage:
<execute_command>
<command>Your command here</command>
<cwd>Working directory path (optional)</cwd>
</execute_command>

Example: 创建新的目录结构
<execute_command>
<command>mkdir -p ./src/components/novel</command>
</execute_command>

Example: 在指定目录中创建新文件夹
<execute_command>
<command>mkdir -p novel-chapters/chapter1</command>
<cwd>/home/user/projects/my-novel</cwd>
</execute_command>`
}
