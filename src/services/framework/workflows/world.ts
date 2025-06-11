import * as path from "path"
import * as fs from "fs/promises"
import {prepareReplaceDiff, prepareAppendDiff, displayFileContent, updateFrameworkFile} from "../utils/common"
import { findSectionPosition } from "../utils/position"
import { safeExecute } from "../utils/error-handler"

/**
 * 处理世界设定工作流
 */
export async function handleWorldWorkflow(params: any): Promise<boolean> {
    const { cline, frameworkPath, frameworkContent, askApproval, handleError, pushToolResult, removeClosingTag } = params
    
    try {
        pushToolResult("正在分析世界设定情况...")
        
        // 获取工作区根路径
        const rootPath = cline.cwd || process.cwd()
        
        // 构建完整文件路径
        const fullPath = path.isAbsolute(frameworkPath) ? frameworkPath : path.join(rootPath, frameworkPath)
        
        // 检查世界设定部分是否存在
        const worldSectionPosition = findSectionPosition(frameworkContent, ["## 世界设定", "## 世界观", "## 背景设定"])
        
        // 询问用户希望如何改进世界设定
        const worldQuestionBlock = {
            type: "tool_use" as const,
            name: "ask_followup_question" as const,
            params: {
                question: worldSectionPosition.found ? 
                    "您希望如何改进世界设定？\n\n" +
                    "1. 完善社会结构\n" +
                    "2. 丰富地理环境\n" +
                    "3. 深化历史背景\n" +
                    "4. 拓展文化特色\n" +
                    "5. 创建特殊规则与法则\n" +
                    "6. 设计科技或魔法体系\n" : 
                    "您的框架中尚未包含世界设定部分。您希望添加哪种类型的世界设定？\n\n" +
                    "1. 现实世界型设定\n" +
                    "2. 奇幻世界型设定\n" +
                    "3. 科幻世界型设定\n" +
                    "4. 架空历史型设定\n" +
                    "5. 后启示录型设定\n" +
                    "6. 混合多元世界型设定\n"
            },
            partial: false,
        }
        
        let selectedOption = ""
        let continueInCurrentSection = true
        let success = false
        
        await safeExecute(async () => {
            await cline.toolManager.askFollowupQuestionTool(
                cline,
                worldQuestionBlock,
                askApproval,
                handleError,
                async (result: unknown) => {
                    if (result && typeof result === "string") {
                        selectedOption = result.trim()
                        
                        let promptContent = ""
                        
                        // 根据用户选择设置提示内容
                        if (worldSectionPosition.found) {
                            // 已有世界设定，根据选择完善
                            if (selectedOption.includes("1") || selectedOption.toLowerCase().includes("社会")) {
                                promptContent = "请完善小说世界的社会结构，包括政治制度、阶级分层、权力分配和社会组织形式。"
                            } else if (selectedOption.includes("2") || selectedOption.toLowerCase().includes("地理")) {
                                promptContent = "请丰富小说世界的地理环境，包括主要场景、自然景观、气候特点和空间布局。"
                            } else if (selectedOption.includes("3") || selectedOption.toLowerCase().includes("历史")) {
                                promptContent = "请深化小说世界的历史背景，包括重要历史事件、历史发展脉络和历史遗留问题。"
                            } else if (selectedOption.includes("4") || selectedOption.toLowerCase().includes("文化")) {
                                promptContent = "请拓展小说世界的文化特色，包括语言、宗教、艺术、习俗和价值观念。"
                            } else if (selectedOption.includes("5") || selectedOption.toLowerCase().includes("规则")) {
                                promptContent = "请创建小说世界的特殊规则与法则，包括可能存在的物理法则变化或社会运行规则。"
                            } else if (selectedOption.includes("6") || selectedOption.toLowerCase().includes("科技") || selectedOption.toLowerCase().includes("魔法")) {
                                promptContent = "请设计小说世界的科技或魔法体系，包括技术水平、魔法原理和对世界的影响。"
                            } else {
                                promptContent = "请全面改进世界设定，使世界观更加完整、有说服力和内在一致性。"
                            }
                        } else {
                            // 尚未有世界设定，根据选择创建
                            if (selectedOption.includes("1") || selectedOption.toLowerCase().includes("现实")) {
                                promptContent = "请创建基于现实世界的设定，可以是完全现实的或略有改变的平行世界。"
                            } else if (selectedOption.includes("2") || selectedOption.toLowerCase().includes("奇幻")) {
                                promptContent = "请创建奇幻世界设定，包括可能的魔法体系、种族设定和奇幻生物。"
                            } else if (selectedOption.includes("3") || selectedOption.toLowerCase().includes("科幻")) {
                                promptContent = "请创建科幻世界设定，包括未来科技、可能的社会发展形态和宇宙观。"
                            } else if (selectedOption.includes("4") || selectedOption.toLowerCase().includes("架空")) {
                                promptContent = "请创建架空历史世界设定，基于历史但进行创造性改变的世界背景。"
                            } else if (selectedOption.includes("5") || selectedOption.toLowerCase().includes("后启示录")) {
                                promptContent = "请创建后启示录世界设定，描述灾难后的世界状态和人类社会重建。"
                            } else if (selectedOption.includes("6") || selectedOption.toLowerCase().includes("混合")) {
                                promptContent = "请创建混合多元世界设定，包含多种世界类型元素或平行世界设定。"
                            } else {
                                promptContent = "请创建完整的世界设定，包括社会结构、地理环境、历史背景和文化特色。"
                            }
                        }
                        
                        // 准备系统提示
                        const systemPrompt = `你是一位专业的小说世界设定专家。${
                            worldSectionPosition.found ? 
                            "请根据现有世界设定进行改进和完善。" : 
                            "请创建一个新的世界设定部分。"
                        }
                        
                        ${promptContent}
                        
                        请确保世界设定：
                        1. 具有内在一致性和合理性
                        2. 与故事主题和类型相符
                        3. 有足够的细节使世界生动
                        4. 包含独特而有趣的元素
                        5. 为情节和角色行动提供合理基础
                        
                        ${worldSectionPosition.found ? "以下是现有的世界设定内容：" : "请创建以下格式的世界设定："}
                        
                        ## 世界设定

### 社会结构
                        *社会结构的描述*

### 地理环境
                        *地理环境的描述*

### 历史背景
                        *历史背景的描述*

### 文化特色
                        *文化特色的描述*
                        
                        ### 特殊规则
                        *特殊规则与法则的描述*
                        
                        请直接给出完整的Markdown格式世界设定内容，以"## 世界设定"或类似标题开头。`;
                        
                        // 当前内容
                        let currentContent = ""
                        if (worldSectionPosition.found) {
                            const contentLines = frameworkContent.split("\n")
                            currentContent = contentLines.slice(worldSectionPosition.startLine, worldSectionPosition.endLine + 1).join("\n")
                        }
                        
                        // 请求AI助手生成世界设定
                        const response = await cline.ask("world_design", `${systemPrompt}\n\n${worldSectionPosition.found ? currentContent : ""}`, false)
                        
                        if (!response.text) {
                            pushToolResult("未能生成有效的世界设定内容。")
                            success = false
                            return
                        }
                        
                        // 提取世界设定内容
                        let newContent = response.text
                        
                        // 确保以"## 世界设定"开头
                        if (!newContent.includes("## 世界设定") && !newContent.includes("## 世界观") && !newContent.includes("## 背景设定")) {
                            newContent = "## 世界设定\n\n" + newContent
                        }
                        
                        // 更新框架文件
                        let updatedContent = ""
                        if (worldSectionPosition.found) {
                            // 替换现有部分
                            updatedContent = prepareReplaceDiff(
                                frameworkContent, 
                                worldSectionPosition.startLine, 
                                worldSectionPosition.endLine,
                                newContent
                            )
                        } else {
                            // 添加新部分
                            updatedContent = prepareAppendDiff(frameworkContent, "\n\n" + newContent)
                        }
                        
                        // 写入文件
                        await updateFrameworkFile(fullPath, updatedContent)
                        success = true
                        
                        pushToolResult(`已${worldSectionPosition.found ? "更新" : "添加"}世界设定内容。`)
                        
                        // 询问是否继续完善世界设定
                        const continueQuestionBlock = {
                            type: "tool_use" as const,
                            name: "ask_followup_question" as const,
                            params: {
                                question: "您希望如何继续？\n\n" +
                                    "1. 继续深入完善世界设定\n" +
                                    "2. 添加更多世界细节\n" +
                                    "3. 调整世界观与故事的关联\n" +
                                    "4. 增强世界的独特性\n" +
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
                                    } else if (continueChoice.includes("4") || continueChoice.toLowerCase().includes("增强")) {
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
                                            },
                                            removeClosingTag
                                        )
                                    }
                                }
                            },
                            removeClosingTag
                        )
                    }
                },
                removeClosingTag
            )
        }, handleError)
        
        return success || continueInCurrentSection
    } catch (error) {
        handleError(error)
        pushToolResult(`处理世界设定时出错: ${error.message || "未知错误"}`)
        return false
    }
} 