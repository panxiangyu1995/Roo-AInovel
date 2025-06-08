import * as path from "path"
import * as fs from "fs/promises"
import { RefinementOption, SectionPosition } from "../types"

/**
 * 格式化选项消息
 */
export function formatOptionsMessage(options: RefinementOption[]): string {
    // 按区域分组
    const areaMap: { [key: string]: RefinementOption[] } = {}
    const areaNames: { [key: string]: string } = {
        genre: "小说题材",
        character: "角色设计",
        plot: "情节与大纲",
        world: "世界观",
        theme: "主题元素", 
        "chapter-outline": "章节规划",
        style: "叙事风格",
        "writing-technique": "写作手法",
        market: "市场定位",
        tech: "系统设定",
        emotion: "情感设计",
        reflection: "自我反思",
        plan: "创作计划",
        all: "综合评估"
    }
    
    options.forEach(option => {
        if (!areaMap[option.area]) {
            areaMap[option.area] = []
        }
        areaMap[option.area].push(option)
    })
    
    // 如果选项总数超过6个，按区域合并选项
    const totalOptions = options.length
    
    if (totalOptions > 6) {
        // 优先选择每个区域的第一个选项
        const priorityOptions: RefinementOption[] = []
        for (const area in areaMap) {
            if (areaMap[area].length > 0) {
                priorityOptions.push(areaMap[area][0])
            }
            
            // 如果已经有6个选项，就停止添加
            if (priorityOptions.length >= 6) {
                break
            }
        }
        
        let message = "以下是框架需要完善的部分，请选择一项进行完善（输入对应的编号或关键词）：\n\n"
        
        // 生成选项列表
        priorityOptions.forEach((option, index) => {
            message += `${index + 1}. 【${areaNames[option.area] || option.area}】${option.title}：${option.description}\n`
        })
        
        message += "\n请选择需要完善的部分（输入序号或关键词）："
        return message
    } else {
        // 如果选项总数不超过6个，保持原格式
        let message = "以下是可以完善的框架部分，请选择一项进行完善（输入对应的编号或关键词）：\n\n"
        
        // 按区域输出选项
        let optionCounter = 1
        for (const area in areaMap) {
            message += `【${areaNames[area] || area}】\n`
            areaMap[area].forEach(option => {
                message += `${optionCounter}. ${option.title}：${option.description}\n`
                optionCounter++
            })
            message += "\n"
        }
        
        message += "请选择需要完善的部分（输入序号或关键词）："
        return message
    }
}

/**
 * 替换diff生成
 */
export function prepareReplaceDiff(content: string, startLine: number, endLine: number, newSection: string): string {
    const lines = content.split("\n")
    const beforeSection = lines.slice(0, startLine).join("\n")
    const afterSection = lines.slice(endLine + 1).join("\n")
    
    return beforeSection + (beforeSection ? "\n" : "") + 
           newSection + 
           (afterSection ? "\n" : "") + afterSection
}

/**
 * 追加diff生成
 */
export function prepareAppendDiff(content: string, newSection: string): string {
    return content + (content.endsWith("\n") ? "" : "\n\n") + newSection
}

/**
 * 显示文件内容
 * 替代使用终端命令显示文件内容
 */
export async function displayFileContent(cline: any, filePath: string, pushToolResult: (message: string) => void): Promise<void> {
    try {
        // 获取工作区根路径
        const rootPath = cline.cwd || process.cwd()
        
        // 构建完整文件路径
        const fullPath = path.isAbsolute(filePath) ? filePath : path.join(rootPath, filePath)
        
        // 读取文件内容
        let content = ""
        try {
            content = await fs.readFile(fullPath, "utf8")
        } catch (error) {
            pushToolResult(`无法读取文件内容: ${error.message}`)
            return
        }
        
        // 获取文件名
        const fileName = path.basename(filePath)
        
        // 截断过长的内容，避免UI卡顿
        const maxLength = 5000
        let truncated = false
        
        if (content.length > maxLength) {
            content = content.substring(0, maxLength) + "\n...\n(内容过长，已省略部分内容)"
            truncated = true
        }
        
        // 构建消息
        const message = `以下是文件 ${fileName} 的内容：\n\n${content}` + (truncated ? "\n\n(内容过长，已省略部分内容)" : "")
        
        // 显示内容
        pushToolResult(message)
    } catch (error) {
        pushToolResult(`无法显示文件内容: ${error.message || "未知错误"}`)
    }
}

/**
 * 生成基础框架内容
 */
export function generateBasicFramework(title: string, concept: string): string {
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
- 第四卷：双线交织
- 第五卷：危机初现
- 第六卷：真相逼近
- 第七卷：抉择时刻
- 第八卷：力量试炼
- 第九卷：秘密揭露
- 第十卷：命运转折

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