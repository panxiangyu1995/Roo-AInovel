export function getAttemptCompletionDescription(): string {
	return `## attempt_completion
	描述：每次使用工具后，用户将反馈该工具使用的结果，例如成功或失败，以及失败的原因。收到工具使用结果并确认任务完成后，请使用此工具向用户展示您的工作结果。如果用户对结果不满意，可以提供反馈，您可以根据反馈进行改进并再次尝试。
重要提示：在用户确认之前，无法使用此工具。否则将导致代码损坏和系统故障。使用此工具之前，您必须在 <thinking></thinking> 标签中确认用户之前使用的任何工具是否成功。如果没有，请勿使用此工具。

特殊说明: 在小说框架模式(planner)下，请勿使用此工具结束任务。框架创建或修改后，应继续询问用户是否需要完善框架的其他部分，而不是直接结束对话。

参数:
- result: (必填) 任务的最终结果。以完整、清晰的方式呈现您的创作成果。在小说框架模式下，请在结尾提出问题，询问用户是否需要继续完善框架的其他部分；在其他模式下，不需要在结尾提出问题或提供进一步的帮助。

用法:
<attempt_completion>
<result>
Your final result description here
</result>
</attempt_completion>

示例: 提交一个完成的小说章节
<attempt_completion>
<result>
# 第一章：黎明的召唤

清晨的阳光透过窗帘的缝隙洒进房间，李明睁开了眼睛。今天是他来到这座城市的第一天，也是他新生活的开始...

[完整章节内容]

当夜幕降临，李明站在阳台上望着远处的灯光，心中充满了对未来的期待。
</result>
</attempt_completion>`
}
