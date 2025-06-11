import { formatResponse } from "../prompts/responses"
import { FrameworkService } from "../../services/framework/FrameworkService"
import { askFollowupQuestionTool } from "./askFollowupQuestionTool"
import { PushToolResult } from "../../shared/tools"
import * as fs from "fs/promises"
import * as path from "path"
import { fileExistsAtPath } from "../../utils/fs"
import { generateBasicFramework } from "../../services/framework/utils/common"

/**
 * 小说框架完善工具
 * 该工具现在作为适配器，将工具调用转发到框架服务
 */
export async function novelFrameworkRefineTool(
    cline: any,
    block: any,
    askApproval: (message: string) => Promise<boolean>,
    handleError: (context: string, error: Error) => Promise<void>,
    pushToolResult: (message: string) => void,
    removeClosingTag: () => string,
) {
    try {
        // 获取参数
        const { path: frameworkPath, area, template, simplify_tasks } = block.params
        
        if (!frameworkPath) {
            pushToolResult(formatResponse.toolError("缺少必要参数: path"))
            return
        }
        
        // 获取工作区根路径
        const rootPath = cline.cwd || process.cwd()
        
        // 构建完整文件路径
        const fullPath = path.isAbsolute(frameworkPath) ? frameworkPath : path.join(rootPath, frameworkPath)
        
        // 检查文件是否存在
        const fileExists = await fileExistsAtPath(fullPath)
        
        // 如果文件不存在，先创建文件
        if (!fileExists) {
            try {
                // 创建目录
                const dir = path.dirname(fullPath)
                await fs.mkdir(dir, { recursive: true })
                
                // 生成基本框架内容
                const useTemplateValue = template !== undefined ? template === "true" : true
                const simplifyTasksValue = simplify_tasks !== undefined ? simplify_tasks === "true" : false
                const content = generateBasicFramework(useTemplateValue, simplifyTasksValue)
                
                // 写入文件
                await fs.writeFile(fullPath, content, "utf8")
                
                pushToolResult(`已成功创建小说框架文件：${frameworkPath}`)
                
                // 询问用户是否继续完善框架
                const continueQuestionBlock = {
                    name: "ask_followup_question" as const,
                    params: {
                        question: "框架已创建，您希望如何继续？\n\n" +
                            "1. 继续完善框架内容\n" +
                            "2. 结束框架完善"
                    },
                    type: "tool_use" as const,
                    partial: false
                }
                
                let shouldContinue = false
                
                await askFollowupQuestionTool(
                    cline,
                    continueQuestionBlock as any,
                    askApproval,
                    handleError,
                    pushToolResult as unknown as PushToolResult,
                    removeClosingTag
                )
                
                // 添加明确的提示，指导AI不要结束任务
                pushToolResult(`
框架文件已创建。请注意：
1. 不要使用attempt_completion工具结束任务
2. 继续建议用户使用novel-framework-refine工具完善框架
3. 引导用户针对框架的14个标准部分进行完善
4. 对每个部分提供具体的改进建议
`)
                
                // 由于工具调用限制，我们需要在下一条消息中继续处理
                return
            } catch (error) {
                await handleError("创建框架文件时出错", error as Error)
                pushToolResult(formatResponse.toolError(`创建框架文件时出错: ${(error as Error).message}`))
                return
            }
        }
        
        // 获取框架服务实例
        const frameworkService = FrameworkService.getInstance()
        
        // 创建一个变量跟踪是否需要询问用户
        let needAskUser = false
        let askMessage = ""
        
        // 添加事件监听器，将服务的消息转发给用户
        const disposable = frameworkService.onProgressUpdate(async event => {
            if (event.currentStep === "ask_continue" && event.message) {
                // 当收到询问事件时，使用askFollowupQuestionTool询问用户
                needAskUser = true
                askMessage = event.message
            } else if (event.message) {
                pushToolResult(event.message)
            }
        })
        
        try {
            // 调用服务处理框架完善请求
            await frameworkService.processFrameworkRefine(
                cline,
                frameworkPath,
                area,
                template !== undefined ? template === "true" : undefined,
                simplify_tasks !== undefined ? simplify_tasks === "true" : undefined
            )
            
            // 如果需要询问用户，调用askFollowupQuestionTool
            if (needAskUser) {
                const askBlock = {
                    name: "ask_followup_question" as const,
                    params: {
                        question: askMessage,
                        follow_up: "是:继续完善框架内容;否:结束框架完善"
                    },
                    type: "tool_use" as const,
                    partial: false
                }
                
                await askFollowupQuestionTool(
                    cline,
                    askBlock as any,
                    askApproval,
                    handleError,
                    pushToolResult as unknown as PushToolResult,
                    removeClosingTag
                )
            }
        } finally {
            // 清理事件监听器
            disposable.dispose()
        }
    } catch (error) {
        await handleError("执行小说框架完善工具时出错", error as Error)
        pushToolResult(formatResponse.toolError(`执行过程中出错: ${(error as Error).message}`))
    }
}