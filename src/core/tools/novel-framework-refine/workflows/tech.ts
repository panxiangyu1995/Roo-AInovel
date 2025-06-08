import * as path from "path"
import * as fs from "fs/promises"
import { TechConfig, WorkflowParams } from "../types"
import { determineSystemSectionPosition } from "../utils/diff-utils"
import { generateSystemSection } from "../utils/generators"
import { prepareAppendDiff, prepareReplaceDiff } from "../utils/common"
import { findSectionPosition } from "../utils/position"
import { safeExecute } from "../utils/error-handler"

/**
 * 处理系统设定工作流
 */
export async function handleSystemWorkflow(params: any): Promise<boolean> {
    const { cline, frameworkPath, frameworkContent, askApproval, handleError, pushToolResult, removeClosingTag } = params
    
    try {
        pushToolResult("正在分析系统设定情况...")
        
        // 获取工作区根路径
        const rootPath = cline.cwd || process.cwd()
        
        // 构建完整文件路径
        const fullPath = path.isAbsolute(frameworkPath) ? frameworkPath : path.join(rootPath, frameworkPath)
        
        // 检查系统设定部分是否存在
        const systemSectionPosition = findSectionPosition(frameworkContent, ["## 系统设定", "## 特殊系统", "## 世界规则", "## 修仙系统", "## 武功系统"])
        
        // 询问用户希望如何改进系统设定
        const systemQuestionBlock = {
            type: "tool_use" as const,
            name: "ask_followup_question" as const,
            params: {
                question: systemSectionPosition.found ? 
                    "您希望如何改进系统设定？\n\n" +
                    "1. 完善核心系统规则\n" +
                    "2. 设计系统等级与进阶\n" +
                    "3. 增加系统独特能力\n" +
                    "4. 优化系统平衡性\n" +
                    "5. 设计系统成长路径\n" +
                    "6. 添加系统特殊限制\n" : 
                    "您的框架中尚未包含系统设定部分。您希望添加哪种类型的系统设定？\n\n" +
                    "1. 修仙/功法系统\n" +
                    "2. 武侠/武功系统\n" +
                    "3. 异能/超能力系统\n" +
                    "4. 游戏/属性系统\n" +
                    "5. 魔法/奇术系统\n" +
                    "6. 科技/机械系统\n"
            },
            partial: false,
        }
        
        let selectedOption = ""
        let continueInCurrentSection = true
        let success = false
        
        await safeExecute(async () => {
            await cline.toolManager.askFollowupQuestionTool(
                cline,
                systemQuestionBlock,
            askApproval,
            handleError,
            async (result: unknown) => {
                if (result && typeof result === "string") {
                        selectedOption = result.trim()
                        
                        let promptContent = ""
                        let systemType = ""
                        
                        // 根据用户选择设置提示内容
                        if (systemSectionPosition.found) {
                            // 已有系统设定，根据选择完善
                            if (selectedOption.includes("1") || selectedOption.toLowerCase().includes("核心")) {
                                promptContent = "请完善系统的核心规则，包括基本原理、运作方式和主要特点。"
                            } else if (selectedOption.includes("2") || selectedOption.toLowerCase().includes("等级")) {
                                promptContent = "请设计系统的等级与进阶路径，包括各等级的特点和晋升条件。"
                            } else if (selectedOption.includes("3") || selectedOption.toLowerCase().includes("能力")) {
                                promptContent = "请增加系统的独特能力，包括特殊技能、效果和应用场景。"
                            } else if (selectedOption.includes("4") || selectedOption.toLowerCase().includes("平衡")) {
                                promptContent = "请优化系统的平衡性，包括能力限制、消耗机制和风险设计。"
                            } else if (selectedOption.includes("5") || selectedOption.toLowerCase().includes("成长")) {
                                promptContent = "请设计系统的成长路径，包括提升方式、瓶颈突破和关键节点。"
                            } else if (selectedOption.includes("6") || selectedOption.toLowerCase().includes("限制")) {
                                promptContent = "请添加系统的特殊限制，包括使用条件、副作用和禁忌事项。"
                            } else {
                                promptContent = "请全面改进系统设定，使其更加完整、合理且有特色。"
                            }
                        } else {
                            // 尚未有系统设定，根据选择创建
                            if (selectedOption.includes("1") || selectedOption.toLowerCase().includes("修仙")) {
                                promptContent = "请创建修仙/功法系统，包括修炼境界、功法特点和灵气运用。"
                                systemType = "修仙/功法系统"
                            } else if (selectedOption.includes("2") || selectedOption.toLowerCase().includes("武侠")) {
                                promptContent = "请创建武侠/武功系统，包括武学流派、招式特点和内功心法。"
                                systemType = "武侠/武功系统"
                            } else if (selectedOption.includes("3") || selectedOption.toLowerCase().includes("异能")) {
                                promptContent = "请创建异能/超能力系统，包括能力分类、觉醒条件和能力限制。"
                                systemType = "异能/超能力系统"
                            } else if (selectedOption.includes("4") || selectedOption.toLowerCase().includes("游戏")) {
                                promptContent = "请创建游戏/属性系统，包括数值设计、技能树和成长机制。"
                                systemType = "游戏/属性系统"
                            } else if (selectedOption.includes("5") || selectedOption.toLowerCase().includes("魔法")) {
                                promptContent = "请创建魔法/奇术系统，包括魔法分类、施法条件和魔力来源。"
                                systemType = "魔法/奇术系统"
                            } else if (selectedOption.includes("6") || selectedOption.toLowerCase().includes("科技")) {
                                promptContent = "请创建科技/机械系统，包括技术原理、装备设计和能源机制。"
                                systemType = "科技/机械系统"
                            } else {
                                promptContent = "请创建完整的系统设定，包括基本规则、等级划分和特殊能力。"
                                systemType = "通用系统"
                            }
                        }
                        
                        // 准备系统提示
                        const systemPrompt = `你是一位专业的小说系统设定专家。${
                            systemSectionPosition.found ? 
                            "请根据现有系统设定进行改进和完善。" : 
                            `请创建一个新的${systemType}设定部分。`
                        }
                        
                        ${promptContent}
                        
                        请确保系统设定：
                        1. 规则清晰且内部一致
                        2. 有明确的等级或进阶路径
                        3. 具有独特性和创新点
                        4. 与故事世界观和主题协调
                        5. 平衡性良好，避免过于强大
                        6. 有足够的发展空间和深度
                        
                        ${systemSectionPosition.found ? "以下是现有的系统设定内容：" : "请创建以下格式的系统设定："}
                        
                        ## 系统设定
                        
                        ### 基本规则
                        *系统的基本原理和运作方式*
                        
                        ### 等级划分
                        *系统的等级结构和晋升条件*
                        
                        ### 特殊能力
                        *系统提供的独特能力和效果*
                        
                        ### 限制条件
                        *系统的使用限制和代价*
                        
                        ### 获取方式
                        *如何获得和提升这一系统*
                        
                        请直接给出完整的Markdown格式系统设定内容，以"## 系统设定"或相应标题开头。`;
                        
                        // 当前内容
                        let currentContent = ""
                        if (systemSectionPosition.found) {
                            const contentLines = frameworkContent.split("\n")
                            currentContent = contentLines.slice(systemSectionPosition.startLine, systemSectionPosition.endLine + 1).join("\n")
                        }
                        
                        // 请求AI助手生成系统设定
                        const response = await cline.ask("system_design", `${systemPrompt}\n\n${systemSectionPosition.found ? currentContent : ""}`, false)
                        
                        if (!response.text) {
                            pushToolResult("未能生成有效的系统设定内容。")
                            success = false
                            return
                        }
                        
                        // 提取系统设定内容
                        let newContent = response.text
                        
                        // 确保以适当的标题开头
                        const titleRegex = /## (系统设定|特殊系统|世界规则|修仙系统|武功系统)/i
                        if (!titleRegex.test(newContent)) {
                            newContent = "## 系统设定\n\n" + newContent
                        }
                        
                        // 更新框架文件
                        let updatedContent = ""
                        if (systemSectionPosition.found) {
                            // 替换现有部分
                            updatedContent = prepareReplaceDiff(
                                frameworkContent, 
                                systemSectionPosition.startLine, 
                                systemSectionPosition.endLine,
                                newContent
                            )
                        } else {
                            // 添加新部分
                            updatedContent = prepareAppendDiff(frameworkContent, "\n\n" + newContent)
                        }
                        
                        // 写入文件
                        await fs.writeFile(fullPath, updatedContent, "utf8")
                        success = true
                        
                        pushToolResult(`已${systemSectionPosition.found ? "更新" : "添加"}系统设定内容。`)
                        
                        // 询问是否继续完善系统设定
                        const continueQuestionBlock = {
            type: "tool_use" as const,
            name: "ask_followup_question" as const,
            params: {
                                question: "您希望如何继续？\n\n" +
                                    "1. 继续深入完善系统设定\n" +
                                    "2. 添加更多系统细节\n" +
                                    "3. 调整系统平衡性\n" +
                                    "4. 设计系统成长路径\n" +
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
                                    
                                    if (continueChoice.includes("1") || continueChoice.toLowerCase().includes("继续")) {
                                        continueInCurrentSection = true
                                    } else if (continueChoice.includes("2") || continueChoice.toLowerCase().includes("添加更多")) {
                                        continueInCurrentSection = true
                                    } else if (continueChoice.includes("3") || continueChoice.toLowerCase().includes("调整")) {
                                        continueInCurrentSection = true
                                    } else if (continueChoice.includes("4") || continueChoice.toLowerCase().includes("设计")) {
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
                    }
                    return true // 确保所有嵌套回调函数都有返回值
                },
                removeClosingTag
            )
        }, handleError)
        
        return success || continueInCurrentSection
    } catch (error) {
        handleError(error)
        pushToolResult(`处理系统设定时出错: ${error.message || "未知错误"}`)
        return false
    }
} 