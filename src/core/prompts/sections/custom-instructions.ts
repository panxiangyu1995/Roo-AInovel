import fs from "fs/promises"
import path from "path"
import { Dirent } from "fs"

import { isLanguage } from "@roo-code/types"

import { LANGUAGES } from "../../../shared/language"

/**
 * Safely read a file and return its trimmed content
 */
async function safeReadFile(filePath: string): Promise<string> {
	try {
		const content = await fs.readFile(filePath, "utf-8")
		return content.trim()
	} catch (err) {
		const errorCode = (err as NodeJS.ErrnoException).code
		if (!errorCode || !["ENOENT", "EISDIR"].includes(errorCode)) {
			throw err
		}
		return ""
	}
}

/**
 * Check if a directory exists
 */
async function directoryExists(dirPath: string): Promise<boolean> {
	try {
		const stats = await fs.stat(dirPath)
		return stats.isDirectory()
	} catch (err) {
		return false
	}
}

/**
 * 处理小说框架内容，识别其结构并格式化为AI提示
 * 能够处理各种格式的小说框架文件
 */
export async function processNovelFramework(frameworkContent: string): Promise<string> {
	// 如果内容为空，直接返回
	if (!frameworkContent.trim()) {
		return "";
	}
	
	// 尝试识别框架的组织结构
	let sections: {title: string, content: string}[] = [];
	
	// 方法1: 标准Markdown标题 (## 标题)
	const mdSections = frameworkContent.split(/^##\s+/m).filter(Boolean);
	if (mdSections.length > 1) {
		sections = mdSections.map(section => {
			const lines = section.split('\n');
			return {
				title: lines[0].trim(),
				content: lines.slice(1).join('\n').trim()
			};
		});
	} 
	// 方法2: 自定义分隔符 (===== 标题 =====)
	else if (frameworkContent.match(/={3,}\s*[\w\s]+\s*={3,}/)) {
		const customSections = frameworkContent.split(/={3,}\s*([\w\s]+)\s*={3,}/);
		for (let i = 1; i < customSections.length; i += 2) {
			if (i+1 < customSections.length) {
				sections.push({
					title: customSections[i].trim(),
					content: customSections[i+1].trim()
				});
			}
		}
	}
	// 方法3: 关键词识别 (如 "角色:", "情节:", 等)
	else {
		const keywords = [
			"角色", "人物", "主角", "配角", "反派", "characters", "protagonists", 
			"情节", "剧情", "故事", "plot", "story", 
			"世界观", "背景", "setting", "world", 
			"主题", "theme", "风格", "style"
		];
		
		// 尝试根据关键词拆分内容
		let currentSection = { title: "Summary", content: "" };
		const lines = frameworkContent.split("\n");
		
		for (const line of lines) {
			const matchedKeyword = keywords.find(keyword => 
				line.toLowerCase().startsWith(keyword.toLowerCase() + ":") || 
				line.toLowerCase().startsWith(keyword.toLowerCase() + "：")
			);
			
			if (matchedKeyword) {
				// 保存上一节
				if (currentSection.content.trim()) {
					sections.push(currentSection);
				}
				// 创建新节
				currentSection = {
					title: matchedKeyword,
					content: line.substring(line.indexOf(":") + 1).trim() || 
							line.substring(line.indexOf("：") + 1).trim()
				};
			} else {
				currentSection.content += "\n" + line;
			}
		}
		
		// 添加最后一节
		if (currentSection.content.trim()) {
			sections.push(currentSection);
		}
	}
	
	// 如果没有识别出明确的部分，将整个内容视为单一框架
	if (sections.length === 0) {
		sections = [{
			title: "Novel Framework",
			content: frameworkContent.trim()
		}];
	}
	
	// 将框架内容格式化为AI提示
	let formattedFramework = "# Novel Framework Guidelines:\n\n";
	
	// 处理各个部分
	sections.forEach(section => {
		if (section.content) {
			formattedFramework += `## ${section.title}\n${section.content}\n\n`;
		}
	});
	
	// 添加框架使用指导
	formattedFramework += "\nWhen generating content, strictly follow this framework's guidelines for characters, plot, and world elements. Maintain consistency with all defined aspects.\n";
	
	return formattedFramework;
}

const MAX_DEPTH = 5

/**
 * Recursively resolve directory entries and collect file paths
 */
async function resolveDirectoryEntry(
	entry: Dirent,
	dirPath: string,
	filePaths: string[],
	depth: number,
): Promise<void> {
	// Avoid cyclic symlinks
	if (depth > MAX_DEPTH) {
		return
	}

	const fullPath = path.resolve(entry.parentPath || dirPath, entry.name)
	if (entry.isFile()) {
		// Regular file
		filePaths.push(fullPath)
	} else if (entry.isSymbolicLink()) {
		// Await the resolution of the symbolic link
		await resolveSymLink(fullPath, filePaths, depth + 1)
	}
}

/**
 * Recursively resolve a symbolic link and collect file paths
 */
async function resolveSymLink(fullPath: string, filePaths: string[], depth: number): Promise<void> {
	// Avoid cyclic symlinks
	if (depth > MAX_DEPTH) {
		return
	}
	try {
		// Get the symlink target
		const linkTarget = await fs.readlink(fullPath)
		// Resolve the target path (relative to the symlink location)
		const resolvedTarget = path.resolve(path.dirname(fullPath), linkTarget)

		// Check if the target is a file
		const stats = await fs.stat(resolvedTarget)
		if (stats.isFile()) {
			filePaths.push(resolvedTarget)
		} else if (stats.isDirectory()) {
			const anotherEntries = await fs.readdir(resolvedTarget, { withFileTypes: true, recursive: true })
			// Collect promises for recursive calls within the directory
			const directoryPromises: Promise<void>[] = []
			for (const anotherEntry of anotherEntries) {
				directoryPromises.push(resolveDirectoryEntry(anotherEntry, resolvedTarget, filePaths, depth + 1))
			}
			// Wait for all entries in the resolved directory to be processed
			await Promise.all(directoryPromises)
		} else if (stats.isSymbolicLink()) {
			// Handle nested symlinks by awaiting the recursive call
			await resolveSymLink(resolvedTarget, filePaths, depth + 1)
		}
	} catch (err) {
		// Skip invalid symlinks
	}
}

/**
 * Read all text files from a directory in alphabetical order
 */
async function readTextFilesFromDirectory(dirPath: string): Promise<Array<{ filename: string; content: string }>> {
	try {
		const entries = await fs.readdir(dirPath, { withFileTypes: true, recursive: true })

		// Process all entries - regular files and symlinks that might point to files
		const filePaths: string[] = []
		// Collect promises for the initial resolution calls
		const initialPromises: Promise<void>[] = []

		for (const entry of entries) {
			initialPromises.push(resolveDirectoryEntry(entry, dirPath, filePaths, 0))
		}

		// Wait for all asynchronous operations (including recursive ones) to complete
		await Promise.all(initialPromises)

		const fileContents = await Promise.all(
			filePaths.map(async (file) => {
				try {
					// Check if it's a file (not a directory)
					const stats = await fs.stat(file)
					if (stats.isFile()) {
						const content = await safeReadFile(file)
						return { filename: file, content }
					}
					return null
				} catch (err) {
					return null
				}
			}),
		)

		// Filter out null values (directories or failed reads)
		return fileContents.filter((item): item is { filename: string; content: string } => item !== null)
	} catch (err) {
		return []
	}
}

/**
 * Format content from multiple files with filenames as headers
 */
function formatDirectoryContent(dirPath: string, files: Array<{ filename: string; content: string }>): string {
	if (files.length === 0) return ""

	return (
		"\n\n" +
		files
			.map((file) => {
				return `# Rules from ${file.filename}:\n${file.content}`
			})
			.join("\n\n")
	)
}

/**
 * Load rule files from the specified directory
 */
export async function loadRuleFiles(cwd: string, mode?: string): Promise<string> {
	// Check for .roo/rules/ directory
	const rooRulesDir = path.join(cwd, ".roo", "rules")
	if (await directoryExists(rooRulesDir)) {
		const files = await readTextFilesFromDirectory(rooRulesDir)
		if (files.length > 0) {
			return formatDirectoryContent(rooRulesDir, files)
		}
	}

	// Fall back to existing behavior
	const ruleFiles = [".roorules", ".clinerules"]

	// 添加对小说框架文件的支持 (.rules.xxx框架.md 或 .rules.xxxframework.md)
	// 但在planner模式（小说框架模式）下不加载框架文件
	if (mode !== "planner") {
		try {
			const dirEntries = await fs.readdir(cwd, { withFileTypes: true })
			
			// 首先优先查找.rules.开头的框架文件（官方设置的框架文件）
			const officialFrameworkFiles = dirEntries
				.filter(entry => entry.isFile() && 
					entry.name.startsWith('.rules.') && 
					(entry.name.includes('框架.md') || entry.name.includes('framework.md')))
				.map(entry => entry.name)
			
			// 如果找到了官方框架文件，直接使用第一个
			if (officialFrameworkFiles.length > 0) {
				const file = officialFrameworkFiles[0] // 使用第一个找到的官方框架文件
				const filePath = path.join(cwd, file)
				const content = await safeReadFile(filePath)
				if (content) {
					// 处理框架内容
					const processedContent = await processNovelFramework(content)
					return `\n# Novel Framework from ${file} (official framework):\n${processedContent}\n`
				}
			}
			
			// 如果没有找到官方框架文件，查找其他潜在的框架文件
			const otherFrameworkFiles = dirEntries
				.filter(entry => entry.isFile() && 
					!entry.name.startsWith('.rules.') && 
					entry.name.endsWith('.md') && 
					(entry.name.includes('框架') || entry.name.includes('framework')))
				.map(entry => entry.name)
			
			if (otherFrameworkFiles.length > 0) {
				// 有多个潜在框架文件时，添加提示
				if (otherFrameworkFiles.length > 1) {
					const frameworksList = otherFrameworkFiles.join(", ")
					const warningMessage = `\n# Warning: Multiple potential framework files found (${frameworksList}).\n`
					+ `Using the first one (${otherFrameworkFiles[0]}) as the framework. `
					+ `To avoid confusion, please set an official framework file by dragging a framework file to the chat and clicking "设为框架".\n`
					
					const file = otherFrameworkFiles[0] // 使用第一个找到的文件
					const filePath = path.join(cwd, file)
					const content = await safeReadFile(filePath)
					if (content) {
						// 处理框架内容
						const processedContent = await processNovelFramework(content)
						return `${warningMessage}\n# Novel Framework from ${file} (unofficial framework):\n${processedContent}\n`
					}
				} else {
					// 只有一个潜在框架文件
					const file = otherFrameworkFiles[0]
					const filePath = path.join(cwd, file)
					const content = await safeReadFile(filePath)
					if (content) {
						// 处理框架内容
						const processedContent = await processNovelFramework(content)
						const suggestMessage = `\n# Note: Using ${file} as novel framework. To make it official, drag it to the chat and click "设为框架".\n`
						return `${suggestMessage}\n# Novel Framework from ${file}:\n${processedContent}\n`
					}
				}
			}
		} catch (error) {
			console.error("Error reading directory for framework files:", error)
			// 出错时继续后续处理流程
		}
	}

	// 如果找不到框架文件，尝试常规规则文件
	for (const file of ruleFiles) {
		const content = await safeReadFile(path.join(cwd, file))
		if (content) {
			return `\n# Rules from ${file}:\n${content}\n`
		}
	}

	return ""
}

export async function addCustomInstructions(
	modeCustomInstructions: string,
	globalCustomInstructions: string,
	cwd: string,
	mode: string,
	options: { language?: string; rooIgnoreInstructions?: string } = {},
): Promise<string> {
	const sections = []

	// Load mode-specific rules if mode is provided
	let modeRuleContent = ""
	let usedRuleFile = ""

	if (mode) {
		// Check for .roo/rules-${mode}/ directory
		const modeRulesDir = path.join(cwd, ".roo", `rules-${mode}`)
		if (await directoryExists(modeRulesDir)) {
			const files = await readTextFilesFromDirectory(modeRulesDir)
			if (files.length > 0) {
				modeRuleContent = formatDirectoryContent(modeRulesDir, files)
				usedRuleFile = modeRulesDir
			}
		}

		// If no directory exists, fall back to existing behavior
		if (!modeRuleContent) {
			const rooModeRuleFile = `.roorules-${mode}`
			modeRuleContent = await safeReadFile(path.join(cwd, rooModeRuleFile))
			if (modeRuleContent) {
				usedRuleFile = rooModeRuleFile
			} else {
				const clineModeRuleFile = `.clinerules-${mode}`
				modeRuleContent = await safeReadFile(path.join(cwd, clineModeRuleFile))
				if (modeRuleContent) {
					usedRuleFile = clineModeRuleFile
				}
			}
		}
	}

	// Add language preference if provided
	if (options.language) {
		const languageName = isLanguage(options.language) ? LANGUAGES[options.language] : options.language
		sections.push(
			`Language Preference:\nYou should always speak and think in the "${languageName}" (${options.language}) language unless the user gives you instructions below to do otherwise.`,
		)
	}

	// Add global instructions first
	if (typeof globalCustomInstructions === "string" && globalCustomInstructions.trim()) {
		sections.push(`Global Instructions:\n${globalCustomInstructions.trim()}`)
	}

	// Add mode-specific instructions after
	if (typeof modeCustomInstructions === "string" && modeCustomInstructions.trim()) {
		sections.push(`Mode-specific Instructions:\n${modeCustomInstructions.trim()}`)
	}

	// Add rules - include both mode-specific and generic rules if they exist
	const rules = []

	// Add mode-specific rules first if they exist
	if (modeRuleContent && modeRuleContent.trim()) {
		if (usedRuleFile.includes(path.join(".roo", `rules-${mode}`))) {
			rules.push(modeRuleContent.trim())
		} else {
			rules.push(`# Rules from ${usedRuleFile}:\n${modeRuleContent}`)
		}
	}

	if (options.rooIgnoreInstructions) {
		rules.push(options.rooIgnoreInstructions)
	}

	// Add generic rules
	const genericRuleContent = await loadRuleFiles(cwd, mode)
	if (genericRuleContent && genericRuleContent.trim()) {
		rules.push(genericRuleContent.trim())
	}

	if (rules.length > 0) {
		sections.push(`Rules:\n\n${rules.join("\n\n")}`)
	}

	const joinedSections = sections.join("\n\n")

	return joinedSections
		? `
====

USER'S CUSTOM INSTRUCTIONS

The following additional instructions are provided by the user, and should be followed to the best of your ability without interfering with the TOOL USE guidelines.

${joinedSections}`
		: ""
}
