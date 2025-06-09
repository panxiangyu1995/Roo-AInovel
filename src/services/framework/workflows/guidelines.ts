import * as path from "path"
import * as fs from "fs/promises"
import { WorkflowParams } from "../novel-framework-refine/types";
import { findSectionPosition, prepareAppendDiff, prepareReplaceDiff } from "../utils/common";
import { safeExecute } from "../utils/error-handler"

/**
 * 处理注意事项工作流
 * @param params 工作流参数
 * @returns 是否成功处理
 */
export async function handleGuidelinesWorkflow(params: WorkflowParams): Promise<boolean> {
    const { cline, frameworkPath, frameworkContent, askApproval, handleError, pushToolResult, removeClosingTag } = params;
    
    try {
        pushToolResult("正在分析创作注意事项...")
        
        // 获取工作区根路径
        const rootPath = cline.cwd || process.cwd()
        
        // 构建完整文件路径
        const fullPath = path.isAbsolute(frameworkPath) ? frameworkPath : path.join(rootPath, frameworkPath)
        
        // 检查是否已存在注意事项部分
        const sectionPosition = findSectionPosition(frameworkContent, ["注意事项", "Guidelines", "注意事项与规范"]);
        
        let success = false
        let continueInCurrentSection = true
        
        const result = await safeExecute(async () => {
            // 提示用户输入注意事项内容
            await cline.sendUserInput({
                type: "task",
                text: "请输入您在创作过程中需要注意的事项，例如：避免的情节、保持的风格、特殊的规则等。",
                taskType: "text",
            });
            
            // 等待用户输入
            const userInput = removeClosingTag();
            
            if (!userInput || userInput.trim() === "") {
                pushToolResult("未提供注意事项内容，操作已取消。");
                success = false;
                return false;
            }
            
            // 格式化注意事项内容
            const formattedGuidelines = formatGuidelinesContent(userInput);
            
            let updatedContent: string;
            let message: string;
            
            if (sectionPosition.found) {
                // 更新现有注意事项部分
                updatedContent = prepareReplaceDiff(
                    frameworkContent,
                    sectionPosition.startLine,
                    sectionPosition.endLine,
                    formattedGuidelines
                );
                message = "已更新框架中的注意事项部分。";
            } else {
                // 添加新的注意事项部分
                updatedContent = prepareAppendDiff(frameworkContent, "\n\n" + formattedGuidelines);
                message = "已添加注意事项部分到框架中。";
            }
            
            // 写入文件
            await fs.writeFile(fullPath, updatedContent, "utf8")
            success = true
            
            pushToolResult(`已${sectionPosition.found ? "更新" : "添加"}注意事项内容。`)
            
            // 询问是否继续完善注意事项
            const continueQuestionBlock = {
                type: "tool_use" as const,
                name: "ask_followup_question" as const,
                params: {
                    question: "您希望如何继续？\n\n" +
                        "1. 继续完善注意事项\n" +
                        "2. 添加更多创作禁忌\n" +
                        "3. 设定风格规范\n" +
                        "4. 添加平台内容规范\n" +
                        "5. 跳到下一个部分\n" +
                        "6. 结束框架完善，切换到文字生成模式开始写作\n"
                },
                partial: false,
            }
            
            await cline.toolManager.askFollowupQuestionTool(
                cline,
                continueQuestionBlock,
                askApproval,
                handleError,
                async (result: unknown) => {
                    if (result && typeof result === "string") {
                        const continueChoice = result.trim()
                        
                        if (continueChoice.includes("1") || continueChoice.toLowerCase().includes("继续完善")) {
                            continueInCurrentSection = true
                        } else if (continueChoice.includes("2") || continueChoice.toLowerCase().includes("创作禁忌")) {
                            continueInCurrentSection = true
                        } else if (continueChoice.includes("3") || continueChoice.toLowerCase().includes("风格规范")) {
                            continueInCurrentSection = true
                        } else if (continueChoice.includes("4") || continueChoice.toLowerCase().includes("平台内容")) {
                            continueInCurrentSection = true
                        } else if (continueChoice.includes("5") || continueChoice.toLowerCase().includes("跳到下一个")) {
                            continueInCurrentSection = false
                        } else {
                            // 用户选择结束框架完善
                            pushToolResult("您选择了结束框架完善。框架已保存。")
                            continueInCurrentSection = false
                            
                            // 询问是否切换到writer模式
                            const switchQuestionBlock = {
                                type: "tool_use" as const,
                                name: "ask_followup_question" as const,
                                params: {
                                    question: "是否要切换到文字生成模式开始写作？\n\n" +
                                        "1. 是，开始写作\n" +
                                        "2. 否，稍后再写"
                                },
                                partial: false,
                            }
                            
                            await cline.toolManager.askFollowupQuestionTool(
                                cline,
                                switchQuestionBlock,
                                askApproval,
                                handleError,
                                async (result: unknown) => {
                                    if (result && typeof result === "string") {
                                        const switchChoice = result.trim()
                                        
                                        if (switchChoice.includes("1") || switchChoice.toLowerCase().includes("是")) {
                                            // 使用switch_mode工具切换到writer模式
                                            const switchModeBlock = {
                                                type: "tool_use" as const,
                                                name: "switch_mode" as const,
                                                params: {
                                                    mode_slug: "writer",
                                                    reason: "开始基于框架进行小说创作",
                                                },
                                                partial: false,
                                            }
                                            
                                            pushToolResult("正在切换到文字生成模式...")
                                            
                                            try {
                                                await cline.recursivelyMakeClineRequests([{
                                                    type: "tool_use",
                                                    name: "switch_mode",
                                                    tool: {
                                                        name: "switch_mode",
                                                        input: {
                                                            mode_slug: "writer",
                                                            reason: "开始基于框架进行小说创作"
                                                        }
                                                    }
                                                }])
                                                
                                                pushToolResult("已切换到文字生成模式。您现在可以开始根据框架创作小说内容了。")
                                            } catch (error) {
                                                pushToolResult("模式切换失败，请手动切换到文字生成模式。错误: " + error)
                                            }
                                        }
                                    }
                                    return true // 确保所有嵌套回调函数都有返回值
                                },
                                removeClosingTag
                            )
                        }
                    }
                    return true // 确保所有嵌套回调函数都有返回值
                },
                removeClosingTag
            )
            
            return true
        }, false, handleError)
        
        return success || continueInCurrentSection
    } catch (error) {
        handleError(error);
        pushToolResult(`处理注意事项时出错: ${error.message || "未知错误"}`)
        return false;
    }
}

/**
 * 格式化注意事项内容
 * @param content 用户输入的注意事项内容
 * @returns 格式化后的注意事项部分
 */
function formatGuidelinesContent(content: string): string {
    // 分析内容是否已经有Markdown格式
    const hasMarkdownBullets = /^[\s]*[-*+][\s]/.test(content);
    
    let formattedContent: string;
    
    if (hasMarkdownBullets) {
        // 如果已经有Markdown格式，保持原样
        formattedContent = content;
    } else {
        // 将内容按行分割并添加Markdown列表格式
        formattedContent = content
            .split(/\r?\n/)
            .filter(line => line.trim() !== "")
            .map(line => `- ${line}`)
            .join("\n");
    }
    
    return `## 注意事项\n\n${formattedContent}\n`;
} 