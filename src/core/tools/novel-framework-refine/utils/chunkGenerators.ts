import { ChapterConfig, EmotionConfig, MarketConfig, PlanConfig, ReflectionConfig, StyleConfig, SystemConfig, ThemeConfig } from "../types";
import * as fs from "fs/promises";
import * as path from "path";

/**
 * 内容生成进度状态
 */
export enum GenerationStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

/**
 * 内容块类型
 */
export enum ContentBlockType {
  TITLE = 'title',
  SECTION = 'section',
  SUBSECTION = 'subsection',
  LIST = 'list',
  PARAGRAPH = 'paragraph',
  CUSTOM = 'custom'
}

/**
 * 内容块定义
 */
export interface ContentBlock {
  id: string;
  type: ContentBlockType;
  title?: string;
  content?: string;
  template?: string;
  children?: ContentBlock[];
  status: GenerationStatus;
  parent?: string;
  data?: any;
}

/**
 * 内容模板管理器
 */
export class ContentTemplateManager {
  private templates: Map<string, ContentBlock> = new Map();
  private sessionPath: string;
  private progressFile: string;

  constructor(workspacePath: string) {
    this.sessionPath = path.join(workspacePath, '.novel-framework', 'sessions');
    this.progressFile = path.join(this.sessionPath, 'progress.json');
    this.initializeTemplates();
  }

  /**
   * 初始化内容模板
   */
  private initializeTemplates() {
    // 主题模板
    this.registerTemplate('theme', {
      id: 'theme',
      type: ContentBlockType.SECTION,
      title: '主题元素',
      status: GenerationStatus.NOT_STARTED,
      children: [
        {
          id: 'theme.genres',
          type: ContentBlockType.SUBSECTION,
          title: '类型',
          template: '### 类型\n\n{{#if genres.length}}\n{{#each genres}}\n- {{this}}\n{{/each}}\n{{else}}\n*此处添加小说类型，如奇幻、科幻、悬疑等*\n{{/if}}',
          status: GenerationStatus.NOT_STARTED,
          parent: 'theme'
        },
        {
          id: 'theme.core',
          type: ContentBlockType.SUBSECTION,
          title: '核心主题',
          template: '### 核心主题\n\n{{#if themes.length}}\n{{#each themes}}\n- {{this}}\n{{/each}}\n{{else}}\n*此处添加小说探讨的核心主题，如成长、救赎、友情等*\n{{/if}}',
          status: GenerationStatus.NOT_STARTED,
          parent: 'theme'
        },
        {
          id: 'theme.symbols',
          type: ContentBlockType.SUBSECTION,
          title: '象征元素',
          template: '### 象征元素\n\n*此处可添加小说中的象征元素及其含义*',
          status: GenerationStatus.NOT_STARTED,
          parent: 'theme'
        }
      ]
    });

    // 剧情模板
    this.registerTemplate('plot', {
      id: 'plot',
      type: ContentBlockType.SECTION,
      title: '故事大纲',
      status: GenerationStatus.NOT_STARTED,
      children: [
        {
          id: 'plot.summary',
          type: ContentBlockType.SUBSECTION,
          title: '故事概要',
          template: '### 故事概要\n\n{{summary}}',
          status: GenerationStatus.NOT_STARTED,
          parent: 'plot'
        },
        {
          id: 'plot.timeline',
          type: ContentBlockType.SUBSECTION,
          title: '时间线',
          template: '### 时间线\n\n{{timeline}}',
          status: GenerationStatus.NOT_STARTED,
          parent: 'plot'
        },
        {
          id: 'plot.turningPoints',
          type: ContentBlockType.SUBSECTION,
          title: '主要转折点',
          template: '### 主要转折点\n\n{{turningPoints}}',
          status: GenerationStatus.NOT_STARTED,
          parent: 'plot'
        },
        {
          id: 'plot.subplots',
          type: ContentBlockType.SUBSECTION,
          title: '子情节',
          template: '### 子情节\n\n{{subplots}}',
          status: GenerationStatus.NOT_STARTED,
          parent: 'plot'
        }
      ]
    });

    // 世界设定模板
    this.registerTemplate('world', {
      id: 'world',
      type: ContentBlockType.SECTION,
      title: '世界设定',
      status: GenerationStatus.NOT_STARTED,
      children: [
        {
          id: 'world.society',
          type: ContentBlockType.SUBSECTION,
          title: '社会结构',
          template: '### 社会结构\n\n{{society}}',
          status: GenerationStatus.NOT_STARTED,
          parent: 'world'
        },
        {
          id: 'world.geography',
          type: ContentBlockType.SUBSECTION,
          title: '地理环境',
          template: '### 地理环境\n\n{{geography}}',
          status: GenerationStatus.NOT_STARTED,
          parent: 'world'
        },
        {
          id: 'world.history',
          type: ContentBlockType.SUBSECTION,
          title: '历史背景',
          template: '### 历史背景\n\n{{history}}',
          status: GenerationStatus.NOT_STARTED,
          parent: 'world'
        },
        {
          id: 'world.culture',
          type: ContentBlockType.SUBSECTION,
          title: '文化特色',
          template: '### 文化特色\n\n{{culture}}',
          status: GenerationStatus.NOT_STARTED,
          parent: 'world'
        }
      ]
    });

    // 角色设计模板
    this.registerTemplate('character', {
      id: 'character',
      type: ContentBlockType.SECTION,
      title: '主要角色',
      status: GenerationStatus.NOT_STARTED,
      children: [
        {
          id: 'character.protagonist',
          type: ContentBlockType.SUBSECTION,
          title: '主角',
          template: '### 主角\n\n{{protagonist}}',
          status: GenerationStatus.NOT_STARTED,
          parent: 'character'
        },
        {
          id: 'character.antagonist',
          type: ContentBlockType.SUBSECTION,
          title: '反派',
          template: '### 反派\n\n{{antagonist}}',
          status: GenerationStatus.NOT_STARTED,
          parent: 'character'
        },
        {
          id: 'character.supporting',
          type: ContentBlockType.SUBSECTION,
          title: '重要配角',
          template: '### 重要配角\n\n{{supporting}}',
          status: GenerationStatus.NOT_STARTED,
          parent: 'character'
        },
        {
          id: 'character.relationships',
          type: ContentBlockType.SUBSECTION,
          title: '角色关系',
          template: '### 角色关系\n\n{{relationships}}',
          status: GenerationStatus.NOT_STARTED,
          parent: 'character'
        }
      ]
    });

    // 章节规划模板
    this.registerTemplate('chapter', {
      id: 'chapter',
      type: ContentBlockType.SECTION,
      title: '章节规划',
      status: GenerationStatus.NOT_STARTED,
      children: [
        {
          id: 'chapter.volume',
          type: ContentBlockType.SUBSECTION,
          title: '卷数设计',
          template: '### 卷数设计\n\n{{#if volumeCount}}预计分为 {{volumeCount}} 卷{{else}}*此处添加卷数设计*{{/if}}',
          status: GenerationStatus.NOT_STARTED,
          parent: 'chapter'
        },
        {
          id: 'chapter.count',
          type: ContentBlockType.SUBSECTION,
          title: '章节数量',
          template: '### 章节数量\n\n{{#if chapterCount}}预计共 {{chapterCount}} 章{{else}}*此处添加章节数量*{{/if}}',
          status: GenerationStatus.NOT_STARTED,
          parent: 'chapter'
        },
        {
          id: 'chapter.wordcount',
          type: ContentBlockType.SUBSECTION,
          title: '字数规划',
          template: '### 字数规划\n\n{{#if wordsPerChapter}}每章预计 {{wordsPerChapter}} 字，总计约 {{multiply chapterCount wordsPerChapter}} 字{{else}}*此处添加字数规划*{{/if}}',
          status: GenerationStatus.NOT_STARTED,
          parent: 'chapter'
        },
        {
          id: 'chapter.structure',
          type: ContentBlockType.SUBSECTION,
          title: '章节结构',
          template: '### 章节结构\n\n*此处可添加详细章节标题和内容概要*',
          status: GenerationStatus.NOT_STARTED,
          parent: 'chapter'
        }
      ]
    });

    // 其他模板同理...
  }

  /**
   * 注册模板
   */
  registerTemplate(key: string, template: ContentBlock) {
    this.templates.set(key, template);
  }

  /**
   * 获取模板
   */
  getTemplate(key: string): ContentBlock | undefined {
    return this.templates.get(key);
  }

  /**
   * 获取所有模板名称
   */
  getTemplateKeys(): string[] {
    return Array.from(this.templates.keys());
  }

  /**
   * 基于模板创建新的内容生成会话
   */
  async createSession(sessionId: string, templateKeys: string[]): Promise<string> {
    const session = {
      id: sessionId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      blocks: [] as ContentBlock[]
    };

    // 为会话添加所选模板
    for (const key of templateKeys) {
      const template = this.getTemplate(key);
      if (template) {
        session.blocks.push(JSON.parse(JSON.stringify(template))); // 深拷贝
      }
    }

    // 确保会话目录存在
    await fs.mkdir(this.sessionPath, { recursive: true });

    // 保存会话
    const sessionFile = path.join(this.sessionPath, `${sessionId}.json`);
    await fs.writeFile(sessionFile, JSON.stringify(session, null, 2), 'utf-8');

    return sessionId;
  }

  /**
   * 生成指定块的内容
   */
  async generateBlockContent(sessionId: string, blockId: string, data: any): Promise<ContentBlock | null> {
    try {
      // 读取会话
      const sessionFile = path.join(this.sessionPath, `${sessionId}.json`);
      const sessionContent = await fs.readFile(sessionFile, 'utf-8');
      const session = JSON.parse(sessionContent);

      // 查找并更新块
      let targetBlock: ContentBlock | null = null;
      const findBlock = (blocks: ContentBlock[]) => {
        for (const block of blocks) {
          if (block.id === blockId) {
            targetBlock = block;
            // 更新块状态和内容
            block.status = GenerationStatus.COMPLETED;
            block.data = data;
            block.content = this.renderTemplate(block.template || '', data);
            return true;
          }
          if (block.children && block.children.length > 0) {
            if (findBlock(block.children)) {
              return true;
            }
          }
        }
        return false;
      };

      findBlock(session.blocks);

      if (!targetBlock) {
        return null;
      }

      // 更新会话
      session.updatedAt = new Date().toISOString();
      await fs.writeFile(sessionFile, JSON.stringify(session, null, 2), 'utf-8');

      // 更新进度
      await this.updateProgress(sessionId, blockId, GenerationStatus.COMPLETED);

      return targetBlock;
    } catch (error) {
      console.error('Error generating block content:', error);
      await this.updateProgress(sessionId, blockId, GenerationStatus.FAILED);
      return null;
    }
  }

  /**
   * 更新生成进度
   */
  private async updateProgress(sessionId: string, blockId: string, status: GenerationStatus) {
    try {
      // 确保进度文件存在
      let progress: Record<string, Record<string, string>> = {};
      try {
        const progressContent = await fs.readFile(this.progressFile, 'utf-8');
        progress = JSON.parse(progressContent);
      } catch (error) {
        // 文件不存在，创建新的进度记录
      }

      // 更新进度
      if (!progress[sessionId]) {
        progress[sessionId] = {};
      }
      progress[sessionId][blockId] = status;

      // 保存进度
      await fs.writeFile(this.progressFile, JSON.stringify(progress, null, 2), 'utf-8');
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  }

  /**
   * 渲染模板内容
   */
  private renderTemplate(template: string, data: any): string {
    // 简单的模板替换实现
    // 在实际项目中可以使用更成熟的模板引擎如Handlebars
    let result = template;
    for (const key in data) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, data[key] || '');
    }
    
    // 处理条件表达式 {{#if xxx}}...{{else}}...{{/if}}
    const ifRegex = /{{#if ([^}]+)}}([\s\S]*?)(?:{{else}}([\s\S]*?))?{{\/if}}/g;
    result = result.replace(ifRegex, (match, condition, ifContent, elseContent = '') => {
      const value = this.evaluateCondition(condition, data);
      return value ? ifContent : elseContent;
    });
    
    // 处理循环 {{#each xxx}}...{{/each}}
    const eachRegex = /{{#each ([^}]+)}}([\s\S]*?){{\/each}}/g;
    result = result.replace(eachRegex, (match, arrayName, content) => {
      const array = this.getPropertyValue(arrayName, data);
      if (!Array.isArray(array) || array.length === 0) {
        return '';
      }
      
      return array.map(item => {
        let itemContent = content;
        // 替换 {{this}} 为当前项
        itemContent = itemContent.replace(/{{this}}/g, item);
        // 替换其他属性
        if (typeof item === 'object') {
          for (const key in item) {
            const regex = new RegExp(`{{this.${key}}}`, 'g');
            itemContent = itemContent.replace(regex, item[key] || '');
          }
        }
        return itemContent;
      }).join('');
    });
    
    // 处理函数 {{multiply x y}}
    const functionRegex = /{{multiply ([^}]+) ([^}]+)}}/g;
    result = result.replace(functionRegex, (match, a, b) => {
      const valA = Number(this.getPropertyValue(a, data)) || 0;
      const valB = Number(this.getPropertyValue(b, data)) || 0;
      return String(valA * valB);
    });
    
    return result;
  }
  
  /**
   * 获取对象属性值
   */
  private getPropertyValue(path: string, data: any): any {
    path = path.trim();
    if (path === 'this') return data;
    
    const parts = path.split('.');
    let value = data;
    
    for (const part of parts) {
      if (value === null || value === undefined) return undefined;
      value = value[part];
    }
    
    return value;
  }
  
  /**
   * 评估条件表达式
   */
  private evaluateCondition(condition: string, data: any): boolean {
    condition = condition.trim();
    
    // 处理简单条件: xxx.length, xxx > yyy 等
    if (condition.endsWith('.length')) {
      const arrayPath = condition.slice(0, -7);
      const array = this.getPropertyValue(arrayPath, data);
      return Array.isArray(array) && array.length > 0;
    }
    
    // 简单变量条件
    const value = this.getPropertyValue(condition, data);
    return Boolean(value);
  }

  /**
   * 获取完整框架内容
   */
  async getFullFrameworkContent(sessionId: string): Promise<string | null> {
    try {
      // 读取会话
      const sessionFile = path.join(this.sessionPath, `${sessionId}.json`);
      const sessionContent = await fs.readFile(sessionFile, 'utf-8');
      const session = JSON.parse(sessionContent);

      // 构建完整内容
      let fullContent = '';

      const processBlocks = (blocks: ContentBlock[], level: number = 0) => {
        for (const block of blocks) {
          // 只包含已完成的块
          if (block.status === GenerationStatus.COMPLETED) {
            if (block.type === ContentBlockType.SECTION) {
              fullContent += `\n## ${block.title}\n\n`;
            } else if (block.content) {
              fullContent += block.content + '\n\n';
            }

            if (block.children && block.children.length > 0) {
              processBlocks(block.children, level + 1);
            }
          }
        }
      };

      processBlocks(session.blocks);

      return fullContent.trim();
    } catch (error) {
      console.error('Error getting full framework content:', error);
      return null;
    }
  }

  /**
   * 获取所有待生成的块
   */
  async getPendingBlocks(sessionId: string): Promise<ContentBlock[]> {
    try {
      // 读取会话
      const sessionFile = path.join(this.sessionPath, `${sessionId}.json`);
      const sessionContent = await fs.readFile(sessionFile, 'utf-8');
      const session = JSON.parse(sessionContent);

      const pendingBlocks: ContentBlock[] = [];

      const findPendingBlocks = (blocks: ContentBlock[]) => {
        for (const block of blocks) {
          if (block.status === GenerationStatus.NOT_STARTED) {
            pendingBlocks.push(block);
          }
          if (block.children && block.children.length > 0) {
            findPendingBlocks(block.children);
          }
        }
      };

      findPendingBlocks(session.blocks);

      return pendingBlocks;
    } catch (error) {
      console.error('Error getting pending blocks:', error);
      return [];
    }
  }

  /**
   * 恢复中断的生成过程
   */
  async resumeGeneration(sessionId: string): Promise<ContentBlock | null> {
    // 获取所有待生成的块
    const pendingBlocks = await this.getPendingBlocks(sessionId);
    if (pendingBlocks.length === 0) {
      return null;
    }

    // 返回第一个待生成的块
    return pendingBlocks[0];
  }

  /**
   * 检查会话是否完成
   */
  async isSessionComplete(sessionId: string): Promise<boolean> {
    const pendingBlocks = await this.getPendingBlocks(sessionId);
    return pendingBlocks.length === 0;
  }
}

/**
 * 分块生成工具
 * 封装各个分块生成相关功能
 */
export class ChunkGenerator {
  private templateManager: ContentTemplateManager;

  constructor(workspacePath: string) {
    this.templateManager = new ContentTemplateManager(workspacePath);
  }

  /**
   * 创建新的生成会话
   */
  async createSession(sessionId: string, sections: string[]): Promise<string> {
    return this.templateManager.createSession(sessionId, sections);
  }

  /**
   * 生成剧情部分内容块
   */
  async generatePlotBlock(sessionId: string, blockId: string, config: {
    summary: string;
    timeline: string;
    turningPoints: string;
    subplots: string;
  }): Promise<ContentBlock | null> {
    return this.templateManager.generateBlockContent(sessionId, blockId, config);
  }

  /**
   * 生成世界设定内容块
   */
  async generateWorldBlock(sessionId: string, blockId: string, config: {
    society: string;
    geography: string;
    history: string;
    culture: string;
  }): Promise<ContentBlock | null> {
    return this.templateManager.generateBlockContent(sessionId, blockId, config);
  }

  /**
   * 生成主题元素内容块
   */
  async generateThemeBlock(sessionId: string, blockId: string, config: ThemeConfig): Promise<ContentBlock | null> {
    return this.templateManager.generateBlockContent(sessionId, blockId, config);
  }

  /**
   * 生成系统设定内容块
   */
  async generateSystemBlock(sessionId: string, blockId: string, config: SystemConfig): Promise<ContentBlock | null> {
    return this.templateManager.generateBlockContent(sessionId, blockId, config);
  }

  /**
   * 生成章节规划内容块
   */
  async generateChapterBlock(sessionId: string, blockId: string, config: ChapterConfig): Promise<ContentBlock | null> {
    return this.templateManager.generateBlockContent(sessionId, blockId, config);
  }

  /**
   * 生成风格内容块
   */
  async generateStyleBlock(sessionId: string, blockId: string, config: StyleConfig): Promise<ContentBlock | null> {
    return this.templateManager.generateBlockContent(sessionId, blockId, config);
  }

  /**
   * 生成情感设计内容块
   */
  async generateEmotionBlock(sessionId: string, blockId: string, config: EmotionConfig): Promise<ContentBlock | null> {
    return this.templateManager.generateBlockContent(sessionId, blockId, config);
  }

  /**
   * 生成市场定位内容块
   */
  async generateMarketBlock(sessionId: string, blockId: string, config: MarketConfig): Promise<ContentBlock | null> {
    return this.templateManager.generateBlockContent(sessionId, blockId, config);
  }

  /**
   * 生成自我反思内容块
   */
  async generateReflectionBlock(sessionId: string, blockId: string, config: ReflectionConfig): Promise<ContentBlock | null> {
    return this.templateManager.generateBlockContent(sessionId, blockId, config);
  }

  /**
   * 生成创作计划内容块
   */
  async generatePlanBlock(sessionId: string, blockId: string, config: PlanConfig): Promise<ContentBlock | null> {
    return this.templateManager.generateBlockContent(sessionId, blockId, config);
  }

  /**
   * 获取待生成的下一个块
   */
  async getNextPendingBlock(sessionId: string): Promise<ContentBlock | null> {
    return this.templateManager.resumeGeneration(sessionId);
  }

  /**
   * 获取完整的框架内容
   */
  async getFullFrameworkContent(sessionId: string): Promise<string | null> {
    return this.templateManager.getFullFrameworkContent(sessionId);
  }

  /**
   * 检查会话是否完成
   */
  async isSessionComplete(sessionId: string): Promise<boolean> {
    return this.templateManager.isSessionComplete(sessionId);
  }

  /**
   * 获取所有模板块类型
   */
  getAvailableTemplates(): string[] {
    return this.templateManager.getTemplateKeys();
  }
} 