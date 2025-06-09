import { PlanConfig, WorkflowParams } from "../novel-framework-refine/types"
import { determinePlanSectionPosition } from "../utils/diff-utils"
import { generatePlanSection } from "../utils/generators"
import { prepareAppendDiff, prepareReplaceDiff } from "../utils/common"

/**
 * 处理创作计划工作流
 */
export async function handlePlanWorkflow({ cline, frameworkPath, frameworkContent, askApproval, handleError, pushToolResult, removeClosingTag }: WorkflowParams) {
    try {
        pushToolResult('让我们完善创作计划部分。请告诉我你的创作时间规划和目标。')

        // 获取时间规划
        const timeQuestion = {
            type: "tool_use" as const,
            name: "ask_followup_question" as const,
            params: {
                question: '你计划在多长时间内完成这部小说？（例如：3个月、半年、1年等）',
            },
            partial: false,
        }
        
        let timeRange = ""
        
        await cline.tools.ask_followup_question(
            timeQuestion,
            askApproval,
            handleError,
            async (result: unknown) => {
                if (result && typeof result === "string") {
                    timeRange = result.trim()
                }
            },
            removeClosingTag
        )

        // 获取更新频率
        const frequencyQuestion = {
            type: "tool_use" as const,
            name: "ask_followup_question" as const,
            params: {
                question: '你计划的更新频率是什么？（例如：每周更新2章、每天1000字等）',
            },
            partial: false,
        }
        
        let frequency = ""
        
        await cline.tools.ask_followup_question(
            frequencyQuestion,
            askApproval,
            handleError,
            async (result: unknown) => {
                if (result && typeof result === "string") {
                    frequency = result.trim()
                }
            },
            removeClosingTag
        )

        // 获取创作目标
        const goalsQuestion = {
            type: "tool_use" as const,
            name: "ask_followup_question" as const,
            params: {
                question: '你的创作目标是什么？（多个目标请用逗号分隔，例如：完成30万字的长篇,在某平台获得推荐,积累粉丝群体）',
            },
            partial: false,
        }
        
        let goals: string[] = []
        
        await cline.tools.ask_followup_question(
            goalsQuestion,
            askApproval,
            handleError,
            async (result: unknown) => {
                if (result && typeof result === "string") {
                    goals = result.trim() ? result.split(',').map((g: string) => g.trim()) : []
                }
            },
            removeClosingTag
        )

        // 生成创作计划内容
        const planConfig: PlanConfig = { timeRange, frequency, goals }
        const planContent = generatePlanSection(planConfig)

        // 确定创作计划部分的位置
        const position = determinePlanSectionPosition(frameworkContent)
        
        // 准备差异内容
        let diff
        if (position.hasExistingSection) {
            diff = prepareReplaceDiff(frameworkContent, position.startLine, position.endLine, planContent)
            pushToolResult(`找到了现有的创作计划部分，将更新内容。`)
        } else {
            diff = prepareAppendDiff(frameworkContent, planContent)
            pushToolResult(`没有找到创作计划部分，将添加新内容。`)
        }

        // 确认是否保存到文件
        const shouldSave = await askApproval('是否要将创作计划保存到框架文件？')
        
        if (shouldSave) {
            // 使用diff工具保存更改
            await cline.workspace.applyDiff(frameworkPath, diff)
            pushToolResult('已成功更新创作计划部分！')
            
            // 继续询问是否需要完成其他部分
            return true
        } else {
            pushToolResult('好的，不保存到文件。以下是生成的创作计划内容：\n\n' + planContent)
            return false
        }
    } catch (error) {
        handleError(error)
        return false
    }
} 