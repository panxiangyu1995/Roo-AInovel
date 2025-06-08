import * as path from "path"
import * as fs from "fs/promises"
import * as vscode from 'vscode'

import { formatResponse } from "../prompts/responses"
import { processNovelFramework } from "../prompts/sections/custom-instructions"
import { fileExistsAtPath } from "../../utils/fs"
import { DiffStrategy } from "../../shared/tools"
import { MultiSearchReplaceDiffStrategy } from "../diff/strategies/multi-search-replace"

/**
 * 小说框架自动更新工具
 * 根据已生成的内容自动更新小说框架文件
 */
export const novelFrameworkUpdateTool = {
    name: "novel_framework_update",
    description: "Automatically update the novel framework based on current content. It checks for consistency with existing framework and updates accordingly.",
    parameters: {
        type: "object",
        properties: {
            content: {
                type: "string",
                description: "The new content that should be analyzed to update the framework",
            },
            updateType: {
                type: "string",
                description: "The type of update to perform (e.g., 'chapter', 'character', 'world', 'all')",
                enum: ["chapter", "character", "world", "plot", "all"],
                default: "all",
            },
        },
        required: ["content"],
    },
    async handler(
        cline: any,
        params: { content: string; updateType?: string },
        askApproval: (message: string) => Promise<boolean>,
        handleError: (context: string, error: Error) => Promise<void>,
        pushToolResult: (message: string) => void,
    ) {
        try {
            const rootPath = cline.cwd || process.cwd()
            const content = params.content
            const updateType = params.updateType || "all"

            // 检查自动更新是否启用
            // 通过cline获取全局状态
            const autoUpdateEnabled = cline?.providerRef?.deref()?.contextProxy?.getValue("autoUpdateEnabled") || false
            
            pushToolResult(`Starting novel framework update process... //开始小说框架更新流程...`)
            
            if (!autoUpdateEnabled) {
                pushToolResult(`Note: Auto-update is disabled. You can enable it in settings. //注意：自动更新已禁用。您可以在设置中启用它。`)
            }

            // 查找当前工作目录中的框架文件
            let frameworkFile: string | null = null
            let frameworkContent = ""

            try {
                const dirEntries = await fs.readdir(rootPath, { withFileTypes: true })
                const frameworkFiles = dirEntries
                    .filter(entry => entry.isFile() && 
                        (entry.name.startsWith('.rules.') && 
                        (entry.name.includes('框架.md') || entry.name.includes('framework.md'))))
                    .map(entry => entry.name)
                
                if (frameworkFiles.length > 0) {
                    frameworkFile = frameworkFiles[0] // 使用找到的第一个框架文件
                    const filePath = path.join(rootPath, frameworkFile)
                    frameworkContent = await fs.readFile(filePath, "utf-8")
                }
            } catch (error) {
                pushToolResult(formatResponse.toolError(`Error finding framework file: ${error}`))
                return
            }

            if (!frameworkFile || !frameworkContent) {
                pushToolResult(formatResponse.toolError("No framework file found. Please create one first."))
                return
            }

            // 使用LLM分析内容与框架的一致性并生成更新建议
            pushToolResult(`Analyzing content and comparing with framework... //分析内容并与框架比对...`)

            try {
                // 根据更新类型准备提示词
                let updatePrompt = ""
                switch (updateType) {
                    case "chapter":
                        updatePrompt = "Compare the chapter outline in the framework with the provided content. Update the outline if there are inconsistencies or new developments."
                        break
                    case "character":
                        updatePrompt = "Analyze character descriptions and behaviors in the content. Update character profiles in the framework if there are new traits, relationships, or developments."
                        break
                    case "world":
                        updatePrompt = "Check for world-building elements in the content. Update the world settings in the framework to reflect any new locations, rules, or background details."
                        break
                    case "plot":
                        updatePrompt = "Examine the plot developments in the content. Update the plot structure in the framework to reflect any changes in story direction or important events."
                        break
                    case "all":
                    default:
                        updatePrompt = "Compare all aspects of the framework with the provided content. Update any sections (characters, plot, world, themes) that need to be modified to reflect the latest content."
                        break
                }

                // 调用LLM分析内容并生成更新
                const prompt = `
                I need you to analyze the following novel content and update the novel framework accordingly.
                
                NOVEL FRAMEWORK:
                ${frameworkContent}
                
                CONTENT TO ANALYZE:
                ${content}
                
                TASK:
                ${updatePrompt}
                
                INSTRUCTIONS:
                1. First, determine if any updates are needed by comparing the content with the framework.
                2. If updates are needed, provide a modified version of the ENTIRE framework with your changes.
                3. If no updates are needed, just return "NO_UPDATES_NEEDED".
                4. Maintain the same overall structure and format of the original framework.
                5. Be specific about what was changed and why in your reasoning.
                
                FORMAT YOUR RESPONSE AS:
                
                REASONING: [Your analysis of inconsistencies or needed updates]
                
                UPDATED_FRAMEWORK:
                [The complete updated framework or "NO_UPDATES_NEEDED"]
                `

                const analysisResponse = await cline.say(
                    "user", 
                    prompt,
                    {
                        system: "You are a novel framework analyst specializing in maintaining consistency between novel content and frameworks. Your task is to carefully analyze content and update frameworks to maintain consistency."
                    }
                )

                // 解析LLM返回的内容
                const responseText = analysisResponse?.content?.parts?.[0]?.text || ""
                
                if (responseText.includes("NO_UPDATES_NEEDED")) {
                    pushToolResult(`Framework is already consistent with the content. No updates needed. //框架已与内容保持一致，无需更新。`)
                    return
                }

                // 提取更新的框架内容
                const reasoningMatch = responseText.match(/REASONING:([\s\S]*?)(?=UPDATED_FRAMEWORK:|$)/)
                const updatedFrameworkMatch = responseText.match(/UPDATED_FRAMEWORK:([\s\S]*?)$/)

                const reasoning = reasoningMatch ? reasoningMatch[1].trim() : ""
                let updatedFramework = updatedFrameworkMatch ? updatedFrameworkMatch[1].trim() : ""

                if (!updatedFramework) {
                    pushToolResult(formatResponse.toolError("Failed to extract updated framework from analysis."))
                    return
                }

                // 如果自动更新已启用，直接应用更新
                // 否则，请求用户确认是否要应用更新
                const filePath = path.join(rootPath, frameworkFile)
                
                if (autoUpdateEnabled) {
                    // 使用apply_diff来更新框架
                    await applyFrameworkUpdate(
                        cline,
                        filePath,
                        frameworkContent,
                        updatedFramework,
                        pushToolResult
                    )
                    pushToolResult(`Framework automatically updated. //框架已自动更新。`)
                } else {
                    // 请求用户确认
                    const shouldUpdate = await askApproval(
                        `The framework needs updates. Would you like to apply these changes?\n\nUpdate reasoning: ${reasoning}\n\n` +
                        `//框架需要更新。您想应用这些变更吗？\n\n更新原因：${reasoning}`
                    )
                    
                    if (shouldUpdate) {
                        // 使用apply_diff来更新框架
                        await applyFrameworkUpdate(
                            cline,
                            filePath,
                            frameworkContent,
                            updatedFramework,
                            pushToolResult
                        )
                        pushToolResult(`Framework successfully updated. //框架已成功更新。`)
                    } else {
                        pushToolResult(`Update canceled by user. //更新已被用户取消。`)
                        return
                    }
                }
                
                pushToolResult(`Update reasoning: ${reasoning} //更新原因：${reasoning}`)

            } catch (error) {
                pushToolResult(formatResponse.toolError(`Error during framework update: ${error}`))
            }
        } catch (error) {
            pushToolResult(formatResponse.toolError(`Unexpected error: ${error}`))
        }
    },
}

/**
 * 使用apply_diff策略更新框架文件
 */
async function applyFrameworkUpdate(
    cline: any,
    filePath: string,
    originalContent: string,
    updatedContent: string,
    pushToolResult: (message: string) => void
): Promise<void> {
    try {
        // 创建差异策略
        const diffStrategy: DiffStrategy = new MultiSearchReplaceDiffStrategy(0.8); // 使用0.8的模糊匹配阈值
        
        // 构建差异内容
        const originalLines = originalContent.split('\n');
        const updatedLines = updatedContent.split('\n');
        
        // 尝试使用apply_diff策略应用更新
        const diffResult = await diffStrategy.applyDiff(originalContent, updatedContent);
        
        if (diffResult.success) {
            // 如果diff策略成功，保存更新后的内容
            await fs.writeFile(filePath, diffResult.content, "utf-8");
            pushToolResult(`Framework updated using precise diff strategy. //使用精确的差异策略更新框架。`);
        } else {
            // 如果diff策略失败，回退到直接写入文件的方式
            await fs.writeFile(filePath, updatedContent, "utf-8");
            pushToolResult(`Framework updated by direct content replacement. //通过直接替换内容更新框架。`);
        }
    } catch (error) {
        // 如果发生错误，直接写入更新后的内容
        await fs.writeFile(filePath, updatedContent, "utf-8");
        pushToolResult(`Framework updated by direct content replacement due to diff error. //由于差异错误，通过直接替换内容更新框架。`);
    }
} 