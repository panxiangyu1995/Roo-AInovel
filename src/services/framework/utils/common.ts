import * as path from "path"
import * as fs from "fs/promises"
import { RefinementOption, SectionPosition } from "../novel-framework-refine/types"

/**
 * 格式化选项消息
 * @param options 完善选项列表
 * @returns 格式化后的选项消息
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
        guidelines: "创作注意事项",
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

## 角色设计

请在此描述小说的主要角色、配角和反派角色。

## 情节大纲

请在此描述小说的主要情节发展和转折点。

## 世界观设定

请在此描述小说的世界观设定。

## 主题元素

请在此描述小说要探讨的主题和思想。

## 章节规划

请在此规划小说的章节结构和内容。

## 叙事风格

请在此描述小说的叙事视角和写作风格。

## 写作手法

请在此描述小说中使用的写作技巧和手法。

## 市场定位

请在此分析小说的目标读者和市场策略。

## 系统设定

请在此描述小说中的特殊系统和规则。

## 情感设计

请在此规划小说的情感基调和情感冲突。

## 自我反思

请在此记录创作意图和个人风格特点。

## 创作计划

请在此制定写作时间表和创作目标。

## 注意事项

### 创作禁忌
*此处添加需要避免的情节、人设、设定等*

### 风格规范
*此处添加需要保持的写作风格、语言特点等*

### 平台内容规范
*此处添加发布平台的内容规范要求*`
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

## 角色设计

### 主角
大学生，性格开朗好奇，偶然获得古老传承，拥有穿梭两界的能力。

### 配角
主角的大学同学，聪明机智，对主角的变化充满好奇，后成为得力助手。

### 反派
暗中势力领导者，觊觎龙城秘宝，试图利用主角获取力量。

### 次要角色
- 主角的导师：古籍研究专家，暗中了解龙城秘密
- 神秘老者：来自龙城的后裔，为主角提供指引
- 反派手下：有特殊能力的追随者，与主角多次交锋

## 情节大纲

### 故事概要
主角偶然接触古籍，获得穿梭两界的能力，发现现代都市与远古龙城的联系，揭开龙城消失之谜。

### 时间线
- 起始：主角在大学图书馆偶然接触古籍
- 发展：初次穿越到龙城，探索其文明奥秘
- 转折：发现现代暗中势力也在寻找龙城秘密
- 高潮：两个世界的危机同时爆发
- 结局：解开龙城消失之谜，平衡两界力量

### 主要转折点
- 首次穿越到龙城
- 发现暗中势力的存在
- 揭露龙城与现代的联系
- 面临两界危机的抉择

### 子情节
- 大学校园生活与学业压力
- 与配角建立信任关系
- 龙城文明探索之旅
- 与反派势力的多次交锋

## 世界观设定

### 现代都市
科技发达，但隐藏着古老秘密。
- 地理：虚构的沿海大都市，有古代遗迹
- 特点：表面现代化，暗藏古老力量的痕迹

### 远古龙城
拥有超前的文明和科技，但因某种原因消失在历史长河中。
- 地理：位于异空间的古代城邦
- 特点：融合古代建筑与高等科技的奇特文明

### 社会结构
- 现代社会：普通的现代社会结构，但有秘密组织
- 龙城社会：等级分明，以知识和能力为阶级划分标准

### 历史背景
龙城曾是地球上最先进的文明，因内部冲突和外部威胁而选择隐匿，留下部分传承。

## 主题元素

### 类型
- 科幻冒险
- 都市奇幻
- 成长历程
- 文明探秘

### 核心主题
- 文明的传承与发展
- 责任与选择
- 知识的双面性
- 人与科技的关系

### 象征元素
- 古籍：知识与传承的象征
- 龙城建筑：失落文明的象征
- 穿梭能力：连接过去与现在的桥梁

## 章节规划

### 卷数设计
预计分为 3 卷

### 章节数量
预计共 25-30 章

### 字数规划
每章预计 5000-8000 字，总计约 15-20 万字

### 章节结构
- 第一卷：传承觉醒（1-10章）
  - 第1章：图书馆的古籍
  - 第2章：初次异象
  - 第3章：身体变化
  - 第4章：穿越之门
- 第二卷：都市历险（11-20章）
  - 第11章：神秘组织
  - 第12章：追踪者
  - 第13章：真相碎片
- 第三卷：龙城之谜（21-30章）
  - 第21章：最终真相
  - 第22章：两界危机
  - 第23章：抉择时刻
${simplifyTasksBoolean ? '' : `
- 第四卷：双线交织
- 第五卷：危机初现
- 第六卷：真相逼近
- 第七卷：抉择时刻
- 第八卷：力量试炼
- 第九卷：秘密揭露
- 第十卷：命运转折`}

## 叙事风格

### 叙事视角
- 第三人称有限视角，主要跟随主角
- 特殊章节可切换至其他角色视角

### 写作风格
- 流畅自然，偏现代
- 科技描写精准简洁
- 古代场景富有历史感
- 对比手法展现两个世界差异

### 节奏控制
- 现代场景：节奏较快，突显都市紧凑感
- 龙城场景：节奏舒缓，强调探索感
- 冲突场景：节奏紧张，增强戏剧性

## 写作手法

### 技术元素
- 悬疑铺垫：预先埋下伏笔，后续揭示
- 场景对比：现代与古代场景交替，形成对比
- 细节描写：通过小细节暗示重要线索

### 悬念设计
- 龙城消失的真相
- 主角传承的来源
- 反派势力的真实目的

### 象征手法
- 古籍中的符号：贯穿全文的核心象征
- 龙城建筑风格：反映文明特性的视觉象征
- 现代科技与古代文明的融合象征

## 市场定位

### 目标读者
- 18-35岁，喜欢科幻和都市题材的读者
- 对古代文明与现代科技结合感兴趣的读者
- 喜欢探险和解谜元素的读者

### 竞品分析
- 《盗墓笔记》：本作更注重科学性和现代元素
- 《三体》：本作更注重个人成长和冒险
- 《夜的命名术》：本作更注重古今文明的碰撞

### 多媒体改编潜力
- 影视改编：视觉冲击强，两个世界场景对比鲜明
- 游戏改编：穿梭两界设定适合游戏玩法
- 漫画改编：龙城奇特建筑和科技适合视觉呈现

## 系统设定

### 系统类型
穿梭能力系统：主角通过古籍获得的特殊能力

### 基本规则
- 需要特定条件触发（如特定时间、地点或情绪状态）
- 初期无法控制，随着故事发展逐渐掌握
- 每次穿梭消耗体力和精神力

### 等级划分
- 初级：被动穿梭，无法控制时间和地点
- 中级：可控制穿梭时间，但地点有限
- 高级：完全掌控穿梭能力，可带物品和他人

### 特殊能力
- 语言理解：能理解龙城语言
- 文物感应：能感知与龙城相关的文物
- 记忆提取：能从接触物品中获取历史片段

### 限制条件
- 时间限制：每次穿梭有时长限制
- 体力消耗：频繁穿梭会导致身体虚弱
- 空间限制：只能在特定区域间穿梭

## 情感设计

### 情感基调
- 好奇与探索：驱动主角前进的核心情感
- 责任感：随着了解真相而增强
- 成长喜悦：克服困难后的成就感

### 情感冲突
- 个人安全与探索欲望的冲突
- 现代生活与龙城使命的冲突
- 信任与怀疑：对接触人物的情感矛盾

### 语言特色
简洁而富有画面感，现代场景口语化，龙城场景略带古风

### 情感节奏
- 起伏有序：紧张-舒缓-紧张
- 情感共鸣：通过角色内心独白增强读者共鸣
- 高潮设计：每卷设置情感爆发点

## 自我反思

### 创作意图
- 探索科技与传统文化的碰撞
- 思考文明传承与发展的方向
- 表达对失落文明的想象与敬畏

### 个人风格特点
- 注重细节描写，善于营造悬疑氛围
- 擅长场景转换和对比
- 喜欢通过小物件和符号传递信息

### 创新点
- 古今科技融合的独特设定
- 双世界线并行发展的叙事结构
- 文明传承与个人成长相结合的主题

### 期望效果
- 让读者思考现代科技与传统文化的关系
- 提供紧凑而引人入胜的阅读体验
- 在科幻题材中融入中国文化元素

## 创作计划

### 时间规划
预计6个月完成初稿，2个月修改完善

### 更新频率
每周更新3-4章，每章5000-8000字

### 创作目标
- 完成一部情节紧凑、世界观丰富的小说
- 在科幻网站获得稳定读者群
- 探索古今文明交融的可能性

### 里程碑
- 第一个月：完成大纲和人物设定
- 第三个月：完成第一卷
- 第五个月：完成第二卷
- 第七个月：完成全书初稿
- 第八个月：完成修改和润色

## 注意事项

### 创作禁忌
- 避免科学设定前后矛盾
- 避免角色能力过于强大没有限制
- 避免不同世界观混用造成逻辑混乱
- 避免过度使用巧合推动情节发展
- 避免角色性格前后不一致

### 风格规范
- 保持文字简洁明了，避免过度修饰
- 科技描写要有一定可信度
- 人物对话要符合其身份背景
- 保持悬疑感和探索欲
- 现代与古代场景的语言风格要有区别

### 平台内容规范
- 遵守网络文学平台的内容规定
- 避免敏感政治、宗教内容
- 适度控制暴力描写程度
- 符合青少年阅读的健康导向
- 注意知识产权保护，避免抄袭`
}

/**
 * 替换diff生成
 * @param content 原内容
 * @param startLine 开始行
 * @param endLine 结束行
 * @param newSection 新内容
 * @returns 替换后的内容
 */
export function prepareReplaceDiff(content: string, startLine: number, endLine: number, newSection: string): string {
    const lines = content.split('\n')
    const before = lines.slice(0, startLine).join('\n')
    const after = lines.slice(endLine + 1).join('\n')
    
    return before + (before ? '\n' : '') + newSection + (after ? '\n' : '') + after
}

/**
 * 追加diff生成
 * @param content 原内容
 * @param newSection 新内容
 * @returns 追加后的内容
 */
export function prepareAppendDiff(content: string, newSection: string): string {
    return content + (content.endsWith('\n') ? '' : '\n\n') + newSection
}

/**
 * 显示文件内容
 * 替代使用终端命令显示文件内容
 * @param cline 任务对象
 * @param filePath 文件路径
 * @param pushToolResult 推送工具结果的函数
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
 * 读取文件内容
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
 * 查找章节位置
 * @param content 内容
 * @param sectionHeaders 章节标题数组
 * @returns 章节位置信息
 */
export function findSectionPosition(content: string, sectionHeaders: string[]): SectionPosition & { found: boolean } {
    const lines = content.split('\n')
    
    for (const header of sectionHeaders) {
        const headerRegex = new RegExp(`^#+\\s*${header}`, 'i')
        const startLine = lines.findIndex(line => headerRegex.test(line))
        
        if (startLine !== -1) {
            let endLine = lines.length - 1
            
            // 查找下一个标题作为结束位置
            for (let i = startLine + 1; i < lines.length; i++) {
                if (/^#+\s+/.test(lines[i])) {
                    endLine = i - 1
                    break
                }
            }
            
            return {
                found: true,
                hasExistingSection: true,
                startLine,
                endLine
            }
        }
    }
    
    return {
        found: false,
        hasExistingSection: false,
        startLine: -1,
        endLine: -1
    }
}

/**
 * 直接更新框架文件内容
 * 替代使用applyDiff更新文件内容
 * @param filePath 文件路径
 * @param content 更新后的内容
 * @returns Promise<void>
 */
export async function updateFrameworkFile(filePath: string, content: string): Promise<void> {
    try {
        // 确保目录存在
        const dir = path.dirname(filePath);
        await fs.mkdir(dir, { recursive: true });
        
        // 直接写入文件内容
        await fs.writeFile(filePath, content, "utf8");
    } catch (error) {
        throw new Error(`更新框架文件失败: ${(error as Error).message}`);
    }
} 