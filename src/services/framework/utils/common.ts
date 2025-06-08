import * as path from "path"
import * as fs from "fs/promises"
import { RefinementOption } from "../../../core/tools/novel-framework-refine/types"

/**
 * 格式化选项消息
 * @param options 完善选项列表
 * @returns 格式化后的选项消息
 */
export function formatOptionsMessage(options: RefinementOption[]): string {
    let message = "**框架分析完成，以下是可以完善的方向：**\n\n"
    
    options.forEach((option, index) => {
        message += `${index + 1}. **${option.title}**: ${option.description}\n`
    })
    
    message += "\n请选择要完善的方向（输入选项编号或描述）："
    
    return message
}

/**
 * 生成基础框架内容
 * @param useTemplate 是否使用预定义模板
 * @param simplifyTasks 是否简化任务结构
 * @returns 生成的框架内容
 */
export function generateBasicFramework(useTemplate: string | boolean, simplifyTasks: string | boolean): string {
    const title = "小说框架"
    const concept = "这是一个小说框架文档，用于规划和组织您的创作。"
    
    // 将字符串参数转换为布尔值
    const useTemplateBoolean = typeof useTemplate === 'string' ? useTemplate === 'true' : !!useTemplate
    const simplifyTasksBoolean = typeof simplifyTasks === 'string' ? simplifyTasks === 'true' : !!simplifyTasks
    
    if (!useTemplateBoolean) {
        return `# ${title}

## 故事概览

${concept}

## 小说题材

请在此描述小说的题材类型和特点。

## 主要角色

请在此描述小说的主要角色。

## 情节大纲

请在此描述小说的主要情节发展。

## 世界观设定

请在此描述小说的世界观设定。`
    }
    
    return `# ${title}

## 故事概览

${concept}

## 小说题材

小说题材是科幻/都市融合类型，以现代都市为背景，融入科幻元素。
- 主要类型：科幻/都市
- 题材特色：现实世界与古代文明科技的碰撞
- 创新点：将传统文化元素与未来科技相结合
- 类型规则：保持科学合理性，同时融入神秘色彩

## 章节划分

全书预计分为三卷，每卷8-10章，共计约25-30章。
- 第一卷：传承觉醒
- 第二卷：都市历险
- 第三卷：龙城之谜
${simplifyTasksBoolean ? '' : `- 第四卷：双线交织
- 第五卷：危机初现
- 第六卷：真相逼近
- 第七卷：抉择时刻
- 第八卷：力量试炼
- 第九卷：秘密揭露
- 第十卷：命运转折`}

## 主要角色

### 主角
大学生，性格开朗好奇，偶然获得古老传承，拥有穿梭两界的能力。

### 配角
主角的大学同学，聪明机智，对主角的变化充满好奇，后成为得力助手。

### 反派
暗中势力领导者，觊觎龙城秘宝，试图利用主角获取力量。

## 世界观设定

### 现代都市
科技发达，但隐藏着古老秘密。

### 远古龙城
拥有超前的文明和科技，但因某种原因消失在历史长河中。

## 情节线索

- 传承的来源与龙城的联系
- 穿梭两界的规则与限制
- 危机的出现与解决方式

## 关键场景

- 教室中突然触碰古籍
- 龙城遗迹初次探险
- 都市中的神秘组织对抗

## 潜在冲突

- 两个世界的规则冲突
- 传承力量的副作用
- 个人身份认同问题

## 主题探索

- 文明的传承与发展
- 责任与选择
- 知识的双面性
- 人与科技的关系

## 写作风格

- 叙事视角：第三人称有限视角
- 语言风格：流畅自然，偏现代
- 节奏控制：快慢结合，紧张与舒缓交替
- 情感基调：好奇、探索、成长

## 市场定位

- 目标读者：18-35岁，喜欢科幻和都市题材的读者
- 差异化特点：古今交融的独特设定，深入的文化底蕴
- 多媒体潜力：具有改编为影视、游戏的潜质

## 创作目标

- 完成一部情节紧凑、世界观丰富的小说
- 探索古今文明交融的可能性
- 传递关于责任与成长的主题

## 参考作品

- 《三体》的科学严谨性
- 《盗墓笔记》的悬疑元素
- 《夜的命名术》的现代魔幻风格

## 注意事项

- 保持科学设定的一致性
- 避免角色能力过于强大
- 注意两个世界观的融合逻辑
- 确保情节发展的合理性`
}

/**
 * 显示文件内容
 * @param filePath 文件路径
 * @returns 文件内容
 */
export async function readFileContent(filePath: string): Promise<string> {
    try {
        return await fs.readFile(filePath, "utf8")
    } catch (error) {
        throw new Error(`无法读取文件内容: ${(error as Error).message}`)
    }
}

/**
 * 准备替换差异
 * @param content 原内容
 * @param startLine 开始行
 * @param endLine 结束行
 * @param newSection 新内容
 * @returns 替换后的内容
 */
export function prepareReplaceDiff(content: string, startLine: number, endLine: number, newSection: string): string {
    const lines = content.split('\n')
    const before = lines.slice(0, startLine - 1).join('\n')
    const after = lines.slice(endLine).join('\n')
    
    return before + (before ? '\n' : '') + newSection + (after ? '\n' : '') + after
}

/**
 * 准备追加差异
 * @param content 原内容
 * @param newSection 新内容
 * @returns 追加后的内容
 */
export function prepareAppendDiff(content: string, newSection: string): string {
    return content + (content.endsWith('\n') ? '' : '\n\n') + newSection
} 