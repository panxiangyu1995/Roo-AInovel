export function getAttemptCompletionDescription(): string {
	return `## attempt_completion
描述: 当您完成小说创作任务后，使用此工具向用户展示最终结果。这可以是一个完整的章节、故事大纲、角色设计或其他小说创作相关内容。用户可能会对结果提供反馈，您可以根据反馈进行改进并再次尝试。

重要提示: 
1、在使用此工具之前，请确保您已完成了所有必要的创作步骤，并且内容已经达到了可以展示给用户的完成度。
2、如果在planner模式中，请继续向用户提问，不要过早的使用此工具结束任务，不断提供建议，直到用户满意为止。
参数:
- result: (必填) 任务的最终结果。以完整、清晰的方式呈现您的创作成果，不需要在结尾提出问题或提供进一步的帮助。

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
