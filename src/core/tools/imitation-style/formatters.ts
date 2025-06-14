import { LanguageFeatures, NarrativeFeatures, StyleAnalysisResult, StyleFileContent, UniqueFeatures, ImitationTips } from "./types";

/**
 * 格式化语言特点为Markdown文本
 */
export const formatLanguageFeatures = (features: LanguageFeatures): string => {
  return `### 语言特点

* **句式模式**: ${features.sentencePatterns}
* **句子长度**: ${features.sentenceLength}
* **词汇特点**: ${features.vocabulary}
* **词汇水平**: ${features.vocabularyLevel}
* **修辞手法**: ${features.rhetoric.join('、')}
* **标点使用**: ${features.punctuation}
* **语法特点**: ${features.grammar}
* **过渡词使用**: ${features.transitions.join('、')}`;
};

/**
 * 格式化叙事特点为Markdown文本
 */
export const formatNarrativeFeatures = (features: NarrativeFeatures): string => {
  return `### 叙事特点

* **叙事视角**: ${features.perspective}
* **叙事节奏**: ${features.rhythm}
* **情感基调**: ${features.tone}
* **描述方式**: ${features.description}
* **对话特点**: ${features.dialogue}
* **节奏控制**: ${features.pacing}
* **结构特点**: ${features.structure}`;
};

/**
 * 格式化独特元素为Markdown文本
 */
export const formatUniqueFeatures = (features: UniqueFeatures): string => {
  return `### 独特元素

* **标志性表达**: ${features.signatures.join('、')}
* **主题倾向**: ${features.themes.join('、')}
* **意象使用**: ${features.imagery.join('、')}
* **象征手法**: ${features.symbolism.join('、')}
* **文化引用**: ${features.culturalReferences.join('、')}
* **特殊习惯**: ${features.quirks.join('、')}`;
};

/**
 * 格式化模仿技巧为Markdown文本
 */
export const formatImitationTips = (tips: ImitationTips): string => {
  return `### 模仿技巧

1. **句式技巧**: ${tips.sentenceTips}
2. **词汇技巧**: ${tips.vocabularyTips}
3. **修辞技巧**: ${tips.rhetoricTips}
4. **叙事技巧**: ${tips.narrativeTips}
5. **情感技巧**: ${tips.emotionTips}
6. **结构技巧**: ${tips.structureTips}`;
};

/**
 * 格式化典型例句为Markdown文本
 */
export const formatExamples = (examples: string[]): string => {
  return `### 典型例句

${examples.map((example, index) => `${index + 1}. "${example}"`).join('\n\n')}`;
};

/**
 * 格式化关键词为Markdown文本
 */
export const formatKeywords = (keywords: string[]): string => {
  return `### 关键词

${keywords.join('、')}`;
};

/**
 * 格式化风格分析结果为完整的Markdown文档
 */
export const formatStyleAnalysis = (result: StyleAnalysisResult): string => {
  const sections = [
    '# 写作风格分析报告',
    '',
    formatLanguageFeatures(result.language),
    '',
    formatNarrativeFeatures(result.narrative),
    '',
    formatUniqueFeatures(result.unique),
    '',
    formatImitationTips(result.tips),
    '',
    formatExamples(result.examples),
    '',
    formatKeywords(result.keywords)
  ];

  return sections.join('\n');
};

/**
 * 格式化风格文件内容为JSON字符串
 */
export const formatStyleFileContent = (content: StyleFileContent): string => {
  return JSON.stringify(content, null, 2);
};

/**
 * 生成模仿示例文本
 */
export const generateSampleText = (result: StyleAnalysisResult): string => {
  // 从分析结果中提取关键特征
  const { language, narrative, unique } = result;
  
  return `这是一段${narrative.tone}基调的文字，采用${narrative.perspective}视角进行叙述。句式${language.sentencePatterns}，使用${language.vocabulary}，整体节奏${narrative.rhythm}。

这种风格的写作往往关注${unique.themes.join('、')}，通过${language.rhetoric.join('、')}等修辞手法增强表现力。当你细读这段文字，能感受到作者独特的表达方式，尤其是那些${unique.signatures.join('、')}，它们共同构成了这种风格的标志性特征。

模仿这种风格时，关键是把握其中的精髓，而非简单地复制表面特征。真正的模仿是对原作精神的致敬，同时融入自己的创造力，形成既有借鉴又有创新的作品。`;
}; 