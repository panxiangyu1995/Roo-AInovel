/**
 * 从内容中提取小说标题
 * @param content 小说内容
 * @returns 提取的标题
 */
export function extractNovelTitle(content: string): string {
  // 尝试从内容的第一行或者 # 标题中提取
  const lines = content.split("\n");

  // 查找 Markdown 标题
  for (const line of lines) {
    const titleMatch = line.match(/^#\s+(.+)$/);
    if (titleMatch) {
      return titleMatch[1].trim();
    }
  }

  // 如果没有找到 Markdown 标题，使用第一行非空文本
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine) {
      return trimmedLine;
    }
  }

  return "未命名小说";
}

/**
 * 提取小说的主要角色
 * @param content 小说内容
 * @returns 角色列表
 */
export function extractCharacters(content: string): string[] {
  const characters: Set<string> = new Set();
  
  // 简单的人名识别模式（中文）
  const chineseNamePattern = /[\u4e00-\u9fa5]{1,2}(?:[\u4e00-\u9fa5·•]{0,1}[\u4e00-\u9fa5]{1,2}){0,2}/g;
  
  // 查找对话中的说话者
  const dialoguePattern = /[""]([^"""]+)[""](?:[，,。！!？?][\u4e00-\u9fa5]{1,2}(?:[\u4e00-\u9fa5·•]{0,1}[\u4e00-\u9fa5]{1,2}){0,2}[说道喊叫笑骂])/g;
  
  // 提取中文名字
  const chineseMatches = content.match(chineseNamePattern) || [];
  for (const match of chineseMatches) {
    if (match.length >= 2) {
      characters.add(match);
    }
  }
  
  // 提取对话中的说话者
  let dialogueMatch;
  while ((dialogueMatch = dialoguePattern.exec(content)) !== null) {
    if (dialogueMatch[2]) {
      characters.add(dialogueMatch[2]);
    }
  }
  
  // 过滤常见的非人名词汇
  const commonWords = ["这个", "那个", "什么", "为什么", "怎么", "如何", "哪里", "谁"];
  
  return Array.from(characters)
    .filter(name => !commonWords.includes(name))
    .slice(0, 20); // 限制返回的角色数量
}

/**
 * 提取小说的主要场景
 * @param content 小说内容
 * @returns 场景列表
 */
export function extractSettings(content: string): string[] {
  const settings: Set<string> = new Set();
  
  // 场景标识词
  const settingIndicators = [
    "在", "于", "位于", "处于", 
    "房间", "屋子", "大厅", "客厅", "卧室", "厨房", "浴室", 
    "学校", "医院", "公司", "办公室", "商店", "餐厅", "咖啡馆",
    "公园", "花园", "森林", "山", "河", "湖", "海", "沙滩",
    "城市", "乡村", "村庄", "小镇", "街道", "广场"
  ];
  
  // 分段分析
  const paragraphs = content.split(/\n\s*\n/);
  
  for (const paragraph of paragraphs) {
    // 查找包含场景指示词的句子
    for (const indicator of settingIndicators) {
      if (paragraph.includes(indicator)) {
        // 提取包含场景的短句
        const sentences = paragraph.split(/[。！？.!?]/);
        for (const sentence of sentences) {
          if (sentence.includes(indicator)) {
            const trimmed = sentence.trim();
            if (trimmed.length > 5 && trimmed.length < 50) {
              settings.add(trimmed);
            }
          }
        }
      }
    }
  }
  
  return Array.from(settings).slice(0, 15); // 限制返回的场景数量
}

/**
 * 提取小说的关键词
 * @param content 小说内容
 * @param count 关键词数量
 * @returns 关键词列表
 */
export function extractKeywords(content: string, count: number = 10): string[] {
  // 停用词列表
  const stopWords = [
    "的", "了", "和", "是", "在", "我", "有", "他", "她", "它", "们", "这", "那", "你", 
    "就", "也", "而", "但", "为", "以", "于", "与", "着", "或", "所", "因", "从", "被",
    "到", "给", "让", "向", "地", "得", "着", "过", "吧", "啊", "呢", "吗", "了", "呀",
    "嗯", "哦", "哈", "呵", "啦", "唉", "嘿", "嗨", "哎", "哟", "喂", "嘛", "呐", "呗"
  ];
  
  // 分词（简单实现，实际应用中应使用专业分词库）
  const words = content
    .replace(/[^\u4e00-\u9fa5]/g, " ") // 保留中文
    .split(/\s+/)
    .filter(word => word.length >= 2 && !stopWords.includes(word));
  
  // 统计词频
  const wordFreq: Record<string, number> = {};
  for (const word of words) {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  }
  
  // 按频率排序并返回前N个
  return Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(entry => entry[0]);
}

/**
 * 截断内容到指定长度
 * @param content 原始内容
 * @param maxLength 最大长度
 * @returns 截断后的内容
 */
export function truncateContent(content: string, maxLength: number = 10000): string {
  if (content.length <= maxLength) {
    return content;
  }
  
  // 尝试在段落边界处截断
  const paragraphs = content.split(/\n\s*\n/);
  let truncated = "";
  
  for (const paragraph of paragraphs) {
    if (truncated.length + paragraph.length + 2 <= maxLength) {
      truncated += paragraph + "\n\n";
    } else {
      // 如果当前段落会超出限制，尝试截取部分段落
      const remainingLength = maxLength - truncated.length;
      if (remainingLength > 100) { // 确保剩余长度足够有意义
        truncated += paragraph.substring(0, remainingLength) + "...";
      }
      break;
    }
  }
  
  return truncated;
} 