import { formatResponse } from "../prompts/responses"
import { FrameworkService } from "../../services/framework/FrameworkService"
import { askFollowupQuestionTool } from "./askFollowupQuestionTool"
import { PushToolResult } from "../../shared/tools"

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
        const { path, area, template, simplify_tasks } = block.params
        
        if (!path) {
            pushToolResult(formatResponse.toolError("缺少必要参数: path"))
            return
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
                path,
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