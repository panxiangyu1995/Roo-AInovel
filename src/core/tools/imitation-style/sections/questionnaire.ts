import { Task } from "../../../task/Task";
import { StyleAnswer, StyleQuestion, StyleQuestionnaire, QuestionType } from "../types";

/**
 * 默认风格问卷问题
 */
export const defaultStyleQuestions: StyleQuestion[] = [
  {
    id: "perspective",
    type: QuestionType.CHOICE,
    question: "您的写作通常使用哪种叙事视角？",
    options: ["第一人称", "第二人称", "第三人称限制视角", "第三人称全知视角", "多视角切换"],
    required: true
  },
  {
    id: "tone",
    type: QuestionType.CHOICE,
    question: "您的写作风格通常带有什么样的情感基调？",
    options: ["冷静客观", "热情洋溢", "幽默诙谐", "忧郁深沉", "讽刺辛辣", "温暖亲切"],
    required: true
  },
  {
    id: "sentence_length",
    type: QuestionType.CHOICE,
    question: "您偏好使用什么样的句子长度？",
    options: ["短句为主", "长句为主", "长短结合", "根据情境变化"],
    required: true
  },
  {
    id: "vocabulary",
    type: QuestionType.CHOICE,
    question: "您的词汇使用风格是？",
    options: ["朴实无华", "华丽辞藻", "专业术语", "口语化表达", "古典文雅"],
    required: true
  },
  {
    id: "rhetoric",
    type: QuestionType.MULTI_CHOICE,
    question: "您常用的修辞手法有哪些？",
    options: ["比喻", "排比", "对比", "拟人", "夸张", "反问", "设问", "引用"],
    required: false
  },
  {
    id: "structure",
    type: QuestionType.CHOICE,
    question: "您偏好的叙事结构是？",
    options: ["线性叙事", "插叙", "倒叙", "多线并行", "环形结构"],
    required: true
  },
  {
    id: "description_detail",
    type: QuestionType.SCALE,
    question: "您的描写通常有多详细？(1表示简洁，10表示非常详细)",
    min: 1,
    max: 10,
    required: true
  },
  {
    id: "themes",
    type: QuestionType.MULTI_CHOICE,
    question: "您的写作常关注哪些主题？",
    options: ["爱情", "成长", "家庭", "社会", "历史", "科技", "自然", "哲学", "人性", "冒险"],
    required: false
  },
  {
    id: "dialogue_frequency",
    type: QuestionType.SCALE,
    question: "您的写作中对话的比重有多大？(1表示很少，10表示非常多)",
    min: 1,
    max: 10,
    required: true
  },
  {
    id: "special_features",
    type: QuestionType.TEXT,
    question: "您认为自己写作风格的独特之处是什么？",
    required: false
  }
];

/**
 * 问卷管理器
 * 负责问卷的展示和收集答案
 */
export class QuestionnaireManager {
  private questions: StyleQuestion[];
  private answers: StyleAnswer[] = [];
  private currentQuestionIndex = 0;
  private cline: Task;
  
  constructor(cline: Task, questions: StyleQuestion[] = defaultStyleQuestions) {
    this.questions = questions;
    this.cline = cline;
  }
  
  /**
   * 开始问卷调查
   */
  async startQuestionnaire(): Promise<StyleQuestionnaire> {
    await this.cline.say("text", "接下来，我将通过几个问题来了解您的写作风格。请根据实际情况回答。");
    
    while (this.currentQuestionIndex < this.questions.length) {
      await this.askCurrentQuestion();
      this.currentQuestionIndex++;
    }
    
    await this.cline.say("text", "问卷调查完成！感谢您的回答。");
    
    return {
      questions: this.questions,
      answers: this.answers
    };
  }
  
  /**
   * 提问当前问题
   */
  private async askCurrentQuestion(): Promise<void> {
    const question = this.questions[this.currentQuestionIndex];
    let prompt = `问题 ${this.currentQuestionIndex + 1}/${this.questions.length}: ${question.question}`;
    
    if (question.type === QuestionType.CHOICE && question.options) {
      prompt += "\n\n选项:";
      question.options.forEach((option, index) => {
        prompt += `\n${index + 1}. ${option}`;
      });
      prompt += "\n\n请输入选项编号:";
    } else if (question.type === QuestionType.MULTI_CHOICE && question.options) {
      prompt += "\n\n选项:";
      question.options.forEach((option, index) => {
        prompt += `\n${index + 1}. ${option}`;
      });
      prompt += "\n\n请输入选项编号(多选请用逗号分隔，如: 1,3,5):";
    } else if (question.type === QuestionType.SCALE) {
      prompt += `\n\n请输入${question.min}到${question.max}之间的数字:`;
    } else {
      prompt += "\n\n请输入您的回答:";
    }
    
    const response = await this.cline.ask("followup", prompt);
    const responseText = response.text || "";
    
    // 处理回答
    if (question.type === QuestionType.CHOICE && question.options) {
      const optionIndex = parseInt(responseText.trim()) - 1;
      if (optionIndex >= 0 && optionIndex < question.options.length) {
        this.answers.push({
          questionId: question.id,
          answer: question.options[optionIndex]
        });
      } else {
        await this.cline.say("text", "无效的选项，请重新选择。");
        await this.askCurrentQuestion();
        return;
      }
    } else if (question.type === QuestionType.MULTI_CHOICE && question.options) {
      const selectedIndices = responseText.split(",").map((s: string) => parseInt(s.trim()) - 1);
      const validIndices = selectedIndices.filter((i: number) => i >= 0 && i < question.options!.length);
      
      if (validIndices.length > 0) {
        const selectedOptions = validIndices.map((i: number) => question.options![i]);
        this.answers.push({
          questionId: question.id,
          answer: selectedOptions
        });
      } else {
        await this.cline.say("text", "无效的选项，请重新选择。");
        await this.askCurrentQuestion();
        return;
      }
    } else if (question.type === QuestionType.SCALE) {
      const value = parseInt(responseText.trim());
      if (value >= question.min! && value <= question.max!) {
        this.answers.push({
          questionId: question.id,
          answer: value
        });
      } else {
        await this.cline.say("text", `请输入${question.min}到${question.max}之间的数字。`);
        await this.askCurrentQuestion();
        return;
      }
    } else {
      this.answers.push({
        questionId: question.id,
        answer: responseText
      });
    }
  }
  
  /**
   * 将问卷答案转换为风格描述
   */
  getStyleDescription(): string {
    let description = "## 基于问卷的风格描述\n\n";
    
    // 处理叙事视角
    const perspectiveAnswer = this.findAnswer("perspective");
    if (perspectiveAnswer) {
      description += `- **叙事视角**: ${perspectiveAnswer.answer}\n`;
    }
    
    // 处理情感基调
    const toneAnswer = this.findAnswer("tone");
    if (toneAnswer) {
      description += `- **情感基调**: ${toneAnswer.answer}\n`;
    }
    
    // 处理句子长度
    const sentenceLengthAnswer = this.findAnswer("sentence_length");
    if (sentenceLengthAnswer) {
      description += `- **句子长度**: ${sentenceLengthAnswer.answer}\n`;
    }
    
    // 处理词汇风格
    const vocabularyAnswer = this.findAnswer("vocabulary");
    if (vocabularyAnswer) {
      description += `- **词汇风格**: ${vocabularyAnswer.answer}\n`;
    }
    
    // 处理修辞手法
    const rhetoricAnswer = this.findAnswer("rhetoric");
    if (rhetoricAnswer && Array.isArray(rhetoricAnswer.answer)) {
      description += `- **常用修辞**: ${(rhetoricAnswer.answer as string[]).join("、")}\n`;
    }
    
    // 处理叙事结构
    const structureAnswer = this.findAnswer("structure");
    if (structureAnswer) {
      description += `- **叙事结构**: ${structureAnswer.answer}\n`;
    }
    
    // 处理描写详细程度
    const descriptionDetailAnswer = this.findAnswer("description_detail");
    if (descriptionDetailAnswer && typeof descriptionDetailAnswer.answer === "number") {
      const level = descriptionDetailAnswer.answer;
      let detailDescription = "一般";
      
      if (level <= 3) detailDescription = "简洁";
      else if (level <= 6) detailDescription = "适中";
      else detailDescription = "详细";
      
      description += `- **描写详细程度**: ${detailDescription}\n`;
    }
    
    // 处理主题
    const themesAnswer = this.findAnswer("themes");
    if (themesAnswer && Array.isArray(themesAnswer.answer)) {
      description += `- **常见主题**: ${(themesAnswer.answer as string[]).join("、")}\n`;
    }
    
    // 处理对话频率
    const dialogueFrequencyAnswer = this.findAnswer("dialogue_frequency");
    if (dialogueFrequencyAnswer && typeof dialogueFrequencyAnswer.answer === "number") {
      const level = dialogueFrequencyAnswer.answer;
      let frequencyDescription = "适中";
      
      if (level <= 3) frequencyDescription = "较少";
      else if (level <= 6) frequencyDescription = "适中";
      else frequencyDescription = "频繁";
      
      description += `- **对话频率**: ${frequencyDescription}\n`;
    }
    
    // 处理特殊特点
    const specialFeaturesAnswer = this.findAnswer("special_features");
    if (specialFeaturesAnswer) {
      description += `- **独特特点**: ${specialFeaturesAnswer.answer}\n`;
    }
    
    return description;
  }
  
  /**
   * 查找特定问题的答案
   */
  private findAnswer(questionId: string): StyleAnswer | undefined {
    return this.answers.find(answer => answer.questionId === questionId);
  }
} 