import { LanguageFeatures, NarrativeFeatures, StyleAnalysisContext, UniqueFeatures } from "./types";

/**
 * 语言特点提取器
 */
export const extractLanguageFeatures = async (
  context: StyleAnalysisContext
): Promise<LanguageFeatures> => {
  // 简化的分析逻辑，实际项目中可以使用更复杂的算法
  const { content } = context;
  const words = content.split(/\s+/);
  const sentences = content.split(/[.!?]/);
  
  // 计算一些基本统计信息
  const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length || 0;
  const longSentences = sentences.filter(s => s.length > 30).length;
  const shortSentences = sentences.filter(s => s.length <= 30).length;
  
  // 分析句式模式
  let sentencePatterns = "多样化";
  if (longSentences > shortSentences * 2) {
    sentencePatterns = "偏好长句复杂句式";
  } else if (shortSentences > longSentences * 2) {
    sentencePatterns = "偏好短句简洁句式";
  }
  
  // 分析句子长度
  let sentenceLength = "长短结合";
  if (longSentences > shortSentences * 2) {
    sentenceLength = "长句为主";
  } else if (shortSentences > longSentences * 2) {
    sentenceLength = "短句为主";
  }
  
  // 分析词汇特点
  let vocabulary = "中性词汇";
  if (avgWordLength > 6) {
    vocabulary = "丰富多样的词汇";
  } else if (avgWordLength < 4) {
    vocabulary = "简洁直白的词汇";
  }
  
  // 分析词汇水平
  let vocabularyLevel = "日常用语";
  if (avgWordLength > 6) {
    vocabularyLevel = "较高水平词汇";
  } else if (content.match(/[a-zA-Z]{8,}/g)?.length || 0 > 10) {
    vocabularyLevel = "专业术语较多";
  }
  
  // 分析修辞手法
  const rhetoric = [];
  if (content.match(/如|像|似|仿佛|宛如/g)) rhetoric.push("比喻");
  if (content.match(/不是.*而是|既.*又|一边.*一边/g)) rhetoric.push("对比");
  if (content.match(/啊|哎|呀|哦|唉|嗯/g)) rhetoric.push("感叹");
  if (content.match(/[?？]{2,}/g)) rhetoric.push("设问");
  if (content.match(/[!！]{2,}/g)) rhetoric.push("夸张");
  if (rhetoric.length === 0) rhetoric.push("平实叙述");
  
  // 分析标点使用
  let punctuation = "标准使用";
  if (content.match(/[,，]{3,}/g)) {
    punctuation = "逗号使用频繁";
  } else if (content.match(/[.。]{3,}/g)) {
    punctuation = "句号使用频繁";
  } else if (content.match(/[!！?？]{3,}/g)) {
    punctuation = "感叹号/问号使用频繁";
  } else if (content.match(/[—…]{3,}/g)) {
    punctuation = "破折号/省略号使用频繁";
  }
  
  // 分析语法特点
  let grammar = "标准语法";
  if (content.match(/[^，。！？；：""''（）【】《》]+[，。；：]/g)) {
    grammar = "长句复杂结构";
  } else if (content.match(/[^，。！？；：""''（）【】《》]{1,10}[，。；：]/g)) {
    grammar = "短句简单结构";
  }
  
  // 分析过渡词使用
  const transitions = [];
  if (content.match(/首先|其次|再次|最后|总之/g)) transitions.push("顺序过渡词");
  if (content.match(/因为|所以|由于|因此|故而/g)) transitions.push("因果过渡词");
  if (content.match(/但是|然而|不过|尽管|虽然/g)) transitions.push("转折过渡词");
  if (content.match(/例如|比如|就像|譬如|好比/g)) transitions.push("举例过渡词");
  if (content.match(/另外|此外|除此之外|还有|同时/g)) transitions.push("并列过渡词");
  if (transitions.length === 0) transitions.push("较少使用过渡词");
  
  return {
    sentencePatterns,
    sentenceLength,
    vocabulary,
    vocabularyLevel,
    rhetoric,
    punctuation,
    grammar,
    transitions
  };
};

/**
 * 叙事特点提取器
 */
export const extractNarrativeFeatures = async (
  context: StyleAnalysisContext
): Promise<NarrativeFeatures> => {
  const { content } = context;
  
  // 分析叙事视角
  let perspective = "第三人称";
  if (content.match(/我[^"']*[。？！]/g)) {
    perspective = "第一人称";
  } else if (content.match(/你[^"']*[。？！]/g)) {
    perspective = "第二人称";
  } else if (content.match(/他|她|它/g)) {
    perspective = "第三人称";
  }
  
  // 分析节奏
  let rhythm = "中等节奏";
  const sentences = content.split(/[.!?。！？]/);
  const avgSentenceLength = sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length || 0;
  if (avgSentenceLength > 50) {
    rhythm = "舒缓节奏";
  } else if (avgSentenceLength < 20) {
    rhythm = "紧凑节奏";
  }
  
  // 分析情感基调
  let tone = "中性";
  const positiveWords = content.match(/快乐|幸福|开心|欢乐|美好|喜悦|温暖|希望|爱/g)?.length || 0;
  const negativeWords = content.match(/悲伤|痛苦|绝望|恐惧|恨|愤怒|冷漠|黑暗|死亡/g)?.length || 0;
  if (positiveWords > negativeWords * 2) {
    tone = "积极乐观";
  } else if (negativeWords > positiveWords * 2) {
    tone = "忧郁深沉";
  } else if (positiveWords > 5 && negativeWords > 5) {
    tone = "情感复杂";
  }
  
  // 分析描述方式
  let description = "平衡描述";
  const detailDescriptions = content.match(/[形容词]{2,}[名词]/g)?.length || 0;
  if (detailDescriptions > 10) {
    description = "细节丰富";
  } else if (detailDescriptions < 3) {
    description = "简洁概括";
  }
  
  // 分析对话特点
  let dialogue = "对话适中";
  const dialogueCount = content.match(/[""][^""]+[""]|[''][^'']+['']|["'][^"']+["']/g)?.length || 0;
  if (dialogueCount > 10) {
    dialogue = "对话丰富";
  } else if (dialogueCount < 3) {
    dialogue = "对话较少";
  }
  
  // 分析节奏控制
  let pacing = "节奏均衡";
  if (content.match(/突然|忽然|猛地|瞬间|霎时/g)) {
    pacing = "节奏变化明显";
  }
  
  // 分析结构特点
  let structure = "线性结构";
  if (content.match(/回忆|想起|记得|曾经|过去/g)) {
    structure = "含有倒叙";
  } else if (content.match(/将来|未来|即将|预见|预料/g)) {
    structure = "含有插叙";
  }
  
  return {
    perspective,
    rhythm,
    tone,
    description,
    dialogue,
    pacing,
    structure
  };
};

/**
 * 独特元素提取器
 */
export const extractUniqueFeatures = async (
  context: StyleAnalysisContext
): Promise<UniqueFeatures> => {
  const { content } = context;
  
  // 提取标志性表达
  const signatures = [];
  // 查找重复出现的独特短语
  const phrases = content.match(/[^，。！？；：""''（）【】《》]{3,10}/g) || [];
  const phraseCounts: Record<string, number> = {};
  phrases.forEach(phrase => {
    phraseCounts[phrase] = (phraseCounts[phrase] || 0) + 1;
  });
  
  // 找出出现频率较高的短语
  Object.entries(phraseCounts)
    .filter(([phrase, count]) => count > 2)
    .slice(0, 5)
    .forEach(([phrase]) => signatures.push(phrase));
  
  if (signatures.length === 0) signatures.push("无明显标志性表达");
  
  // 提取主题倾向
  const themes = [];
  if (content.match(/爱情|恋爱|情侣|爱慕|暗恋|热恋/g)) themes.push("爱情");
  if (content.match(/家庭|父母|子女|亲情|母爱|父爱/g)) themes.push("家庭");
  if (content.match(/友情|朋友|伙伴|友谊|交往|同伴/g)) themes.push("友情");
  if (content.match(/成长|进步|蜕变|历练|成熟|经验/g)) themes.push("成长");
  if (content.match(/社会|阶层|贫富|权力|地位|阶级/g)) themes.push("社会");
  if (content.match(/历史|年代|朝代|时期|过去|古代/g)) themes.push("历史");
  if (content.match(/科技|未来|技术|发明|创新|科学/g)) themes.push("科技");
  if (content.match(/哲学|思考|意义|存在|本质|价值/g)) themes.push("哲学");
  if (content.match(/自然|环境|生态|山水|动植物|风景/g)) themes.push("自然");
  
  if (themes.length === 0) themes.push("生活日常");
  
  // 提取意象使用
  const imagery = [];
  if (content.match(/山|水|风|云|雨|雪|日|月|星|天|地/g)) imagery.push("自然意象");
  if (content.match(/花|草|树|木|叶|林|森|果|蔬|菜/g)) imagery.push("植物意象");
  if (content.match(/鸟|兽|虫|鱼|龙|凤|虎|狼|蛇|鹰/g)) imagery.push("动物意象");
  if (content.match(/楼|台|亭|阁|殿|堂|屋|宅|城|墙/g)) imagery.push("建筑意象");
  if (content.match(/刀|剑|枪|炮|箭|盾|甲|盔|旗|鼓/g)) imagery.push("武器意象");
  
  if (imagery.length === 0) imagery.push("现代生活意象");
  
  // 提取象征手法
  const symbolism = [];
  if (content.match(/红|赤/g)) symbolism.push("红色象征");
  if (content.match(/黑|暗/g)) symbolism.push("黑色象征");
  if (content.match(/白|素/g)) symbolism.push("白色象征");
  if (content.match(/水|河|海|湖|泉/g)) symbolism.push("水象征");
  if (content.match(/火|焰|炎|烧|燃/g)) symbolism.push("火象征");
  
  if (symbolism.length === 0) symbolism.push("较少使用象征");
  
  // 提取文化引用
  const culturalReferences = [];
  if (content.match(/诗|词|曲|赋|文|章/g)) culturalReferences.push("文学引用");
  if (content.match(/史|传|记|志|典|籍/g)) culturalReferences.push("历史引用");
  if (content.match(/经|道|佛|儒|释|道/g)) culturalReferences.push("哲学引用");
  if (content.match(/画|乐|舞|歌|戏|剧/g)) culturalReferences.push("艺术引用");
  if (content.match(/网|络|游戏|电影|电视|动漫/g)) culturalReferences.push("现代文化引用");
  
  if (culturalReferences.length === 0) culturalReferences.push("较少文化引用");
  
  // 提取特殊习惯
  const quirks = [];
  if (content.match(/[!！]{3,}/g)) quirks.push("多用感叹号");
  if (content.match(/[?？]{3,}/g)) quirks.push("多用问号");
  if (content.match(/[—…]{3,}/g)) quirks.push("多用破折号或省略号");
  if (content.match(/[（）()]{5,}/g)) quirks.push("多用括号");
  if (content.match(/[""'']{10,}/g)) quirks.push("对话丰富");
  
  if (quirks.length === 0) quirks.push("无明显特殊习惯");
  
  return {
    signatures,
    themes,
    imagery,
    symbolism,
    culturalReferences,
    quirks
  };
};

/**
 * 提取典型例句
 */
export const extractExamples = async (
  context: StyleAnalysisContext
): Promise<string[]> => {
  const { content } = context;
  const sentences = content.split(/[.!?。！？]/).filter(s => s.trim().length > 10);
  
  // 选择一些有代表性的句子
  const examples: string[] = [];
  
  // 选择最长的句子
  if (sentences.length > 0) {
    const longestSentence = sentences.reduce((longest, current) => 
      current.length > longest.length ? current : longest, sentences[0]);
    examples.push(longestSentence.trim());
  }
  
  // 选择包含修辞的句子
  const rhetoricSentence = sentences.find(s => 
    s.match(/如|像|似|仿佛|宛如|不是.*而是|既.*又|一边.*一边|啊|哎|呀|哦|唉|嗯/));
  if (rhetoricSentence && !examples.includes(rhetoricSentence)) {
    examples.push(rhetoricSentence.trim());
  }
  
  // 选择包含对话的句子
  const dialogueSentence = sentences.find(s => 
    s.match(/[""][^""]+[""]|[''][^'']+['']|["'][^"']+["']/));
  if (dialogueSentence && !examples.includes(dialogueSentence)) {
    examples.push(dialogueSentence.trim());
  }
  
  // 如果例句不足3个，随机选择一些句子补充
  while (examples.length < 3 && sentences.length > examples.length) {
    const randomIndex = Math.floor(Math.random() * sentences.length);
    const randomSentence = sentences[randomIndex].trim();
    if (!examples.includes(randomSentence) && randomSentence.length > 10) {
      examples.push(randomSentence);
    }
  }
  
  return examples;
};

/**
 * 提取关键词
 */
export const extractKeywords = async (
  context: StyleAnalysisContext
): Promise<string[]> => {
  const { content } = context;
  
  // 简单的关键词提取算法
  const words = content.split(/\s+/).filter(w => w.length > 1);
  const wordCount: Record<string, number> = {};
  
  // 统计词频
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });
  
  // 排除常见词
  const commonWords = ["的", "了", "和", "是", "在", "有", "这", "那", "就", "我", "你", "他", "她", "它", "们"];
  commonWords.forEach(word => {
    delete wordCount[word];
  });
  
  // 按频率排序并取前10个
  const sortedWords = Object.entries(wordCount)
    .sort(([, countA], [, countB]) => countB - countA)
    .slice(0, 10)
    .map(([word]) => word);
  
  return sortedWords;
}; 