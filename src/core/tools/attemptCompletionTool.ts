import Anthropic from "@anthropic-ai/sdk"

import { TelemetryService } from "@roo-code/telemetry"

import { Task } from "../task/Task"
import {
	ToolResponse,
	ToolUse,
	AskApproval,
	HandleError,
	PushToolResult,
	RemoveClosingTag,
	ToolDescription,
	AskFinishSubTaskApproval,
} from "../../shared/tools"
import { formatResponse } from "../prompts/responses"

export async function attemptCompletionTool(
	cline: Task,
	block: ToolUse,
	askApproval: AskApproval,
	handleError: HandleError,
	pushToolResult: PushToolResult,
	removeClosingTag: RemoveClosingTag,
	toolDescription: ToolDescription,
	askFinishSubTaskApproval: AskFinishSubTaskApproval,
) {
	const result: string | undefined = block.params.result

	try {
		const lastMessage = cline.clineMessages.at(-1)

		if (block.partial) {
			// 只处理部分结果，不处理命令
			await cline.say("completion_result", removeClosingTag("result", result), undefined, block.partial)
			return
		} else {
			if (!result) {
				cline.consecutiveMistakeCount++
				cline.recordToolError("attempt_completion")
				pushToolResult(await cline.sayAndCreateMissingParamError("attempt_completion", "result"))
				return
			}

			cline.consecutiveMistakeCount = 0

			// 发送完成结果
			await cline.say("completion_result", result, undefined, false)
			TelemetryService.instance.captureTaskCompleted(cline.taskId)
			cline.emit("taskCompleted", cline.taskId, cline.getTokenUsage(), cline.toolUsage)

			if (cline.parentTask) {
				const didApprove = await askFinishSubTaskApproval()

				if (!didApprove) {
					return
				}

				// 告诉provider移除当前子任务，恢复堆栈中的上一个任务
				await cline.providerRef.deref()?.finishSubTask(result)
				return
			}

			// 已经发送了completion_result，空字符串会释放按钮和字段的控制权
			const { response, text, images } = await cline.ask("completion_result", "", false)

			// 信号递归循环停止
			if (response === "yesButtonClicked") {
				pushToolResult("")
				return
			}

			await cline.say("user_feedback", text ?? "", images)
			const toolResults: (Anthropic.TextBlockParam | Anthropic.ImageBlockParam)[] = []

			toolResults.push({
				type: "text",
				text: `用户对结果提供了反馈。考虑他们的输入继续任务，然后再次尝试完成。\n<feedback>\n${text}\n</feedback>`,
			})

			toolResults.push(...formatResponse.imageBlocks(images))
			cline.userMessageContent.push({ type: "text", text: `${toolDescription()} 结果:` })
			cline.userMessageContent.push(...toolResults)

			return
		}
	} catch (error) {
		await handleError("完成小说任务", error)
		return
	}
}
