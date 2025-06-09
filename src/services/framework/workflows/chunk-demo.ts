import * as path from "path";
import * as fs from "fs/promises";
import { ChunkGenerator, ContentBlock, GenerationStatus } from "../utils/chunkGenerators";
import { safeExecute } from "../utils/error-handler";

/**
 * 分块生成示例工作流
 * 演示如何使用分块生成系统生成小说框架内容
 */
export async function handleChunkDemoWorkflow(params: any): Promise<boolean> {
  const { 
    cline, 
    frameworkPath, 
    frameworkContent, 
    askApproval, 
    handleError, 
    pushToolResult, 
    removeClosingTag 
  } = params;
  
  let continueInCurrentSection = false;
  let success = false;
  
  try {
    // 获取工作目录
    const rootPath = cline.cwd || process.cwd();
    
    // 初始化分块生成器
    const chunkGenerator = new ChunkGenerator(rootPath);
    
    // 生成会话ID (使用时间戳作为唯一标识)
    const sessionId = `session_${Date.now()}`;
    
    // 向用户展示可用的模板
    const availableTemplates = chunkGenerator.getAvailableTemplates();
    
    // 提示用户选择要生成的框架部分
    const templateOptions = availableTemplates.map((template, index) => 
      `${index + 1}. ${template.charAt(0).toUpperCase() + template.slice(1)}`
    ).join('\n');
    
    // 向用户提问
    const question = {
      type: "tool_use" as const,
      name: "ask_followup_question" as const,
      params: {
        question: `请选择要生成的框架部分(输入对应数字):\n\n${templateOptions}\n\n您可以输入多个数字(用逗号分隔)或输入"all"生成所有部分`
      },
      partial: false,
    };
    
    let selectedSections: string[] = [];
    
    await safeExecute(
      async () => {
        await cline.toolManager.askFollowupQuestionTool(
          cline,
          question,
          askApproval,
          handleError,
          async (result: unknown) => {
            if (result && typeof result === "string") {
              const selection = result.trim().toLowerCase();
              
              if (selection === 'all') {
                selectedSections = [...availableTemplates];
              } else {
                // 解析数字选项
                const selectedIndexes = selection.split(/[,，]/)
                  .map(s => parseInt(s.trim()))
                  .filter(n => !isNaN(n) && n > 0 && n <= availableTemplates.length);
                
                selectedSections = selectedIndexes.map(index => availableTemplates[index - 1]);
              }
              
              if (selectedSections.length === 0) {
                pushToolResult("未选择有效的框架部分，将默认生成主题和剧情部分。");
                selectedSections = ['theme', 'plot'];
              }
            }
          },
          removeClosingTag
        );
      },
      undefined
    );
    
    // 创建生成会话
    await chunkGenerator.createSession(sessionId, selectedSections);
    pushToolResult(`已创建生成会话，将分块生成以下部分: ${selectedSections.join(', ')}`);
    
    // 模拟分块生成过程
    let pendingBlock: ContentBlock | null = await chunkGenerator.getNextPendingBlock(sessionId);
    
    while (pendingBlock) {
      pushToolResult(`正在生成: ${pendingBlock.title || pendingBlock.id}`);
      
      // 根据块类型生成不同的内容
      if (pendingBlock.id.startsWith('theme')) {
        // 主题部分生成
        if (pendingBlock.id === 'theme.genres') {
          // 询问用户输入类型
          const genresQuestion = {
            type: "tool_use" as const,
            name: "ask_followup_question" as const,
            params: {
              question: "请输入小说类型(多个类型请用逗号分隔):"
            },
            partial: false,
          };
          
          let genres: string[] = [];
          
          await safeExecute(
            async () => {
              await cline.toolManager.askFollowupQuestionTool(
                cline,
                genresQuestion,
                askApproval,
                handleError,
                async (result: unknown) => {
                  if (result && typeof result === "string") {
                    genres = result.split(/[,，]/).map(g => g.trim()).filter(Boolean);
                  }
                },
                removeClosingTag
              );
            },
            undefined
          );
          
          // 生成类型块内容
          await chunkGenerator.generateThemeBlock(sessionId, pendingBlock.id, { genres });
        } else if (pendingBlock.id === 'theme.core') {
          // 询问用户输入核心主题
          const themesQuestion = {
            type: "tool_use" as const,
            name: "ask_followup_question" as const,
            params: {
              question: "请输入小说核心主题(多个主题请用逗号分隔):"
            },
            partial: false,
          };
          
          let themes: string[] = [];
          
          await safeExecute(
            async () => {
              await cline.toolManager.askFollowupQuestionTool(
                cline,
                themesQuestion,
                askApproval,
                handleError,
                async (result: unknown) => {
                  if (result && typeof result === "string") {
                    themes = result.split(/[,，]/).map(t => t.trim()).filter(Boolean);
                  }
                },
                removeClosingTag
              );
            },
            undefined
          );
          
          // 生成核心主题块内容
          await chunkGenerator.generateThemeBlock(sessionId, pendingBlock.id, { themes });
        } else if (pendingBlock.id === 'theme.symbols') {
          // 生成象征元素块内容 (使用默认模板)
          await chunkGenerator.generateThemeBlock(sessionId, pendingBlock.id, {});
        } else if (pendingBlock.id === 'theme') {
          // 直接将section块标记为完成
          await chunkGenerator.generateThemeBlock(sessionId, pendingBlock.id, {});
        }
      } else if (pendingBlock.id.startsWith('plot')) {
        // 剧情部分生成
        if (pendingBlock.id === 'plot.summary') {
          const summaryQuestion = {
            type: "tool_use" as const,
            name: "ask_followup_question" as const,
            params: {
              question: "请输入故事概要:"
            },
            partial: false,
          };
          
          let summary = "";
          
          await safeExecute(
            async () => {
              await cline.toolManager.askFollowupQuestionTool(
                cline,
                summaryQuestion,
                askApproval,
                handleError,
                async (result: unknown) => {
                  if (result && typeof result === "string") {
                    summary = result.trim();
                  }
                },
                removeClosingTag
              );
            },
            undefined
          );
          
          // 生成故事概要块内容
          await chunkGenerator.generatePlotBlock(sessionId, pendingBlock.id, { 
            summary,
            timeline: "", 
            turningPoints: "", 
            subplots: "" 
          });
        } else if (pendingBlock.id === 'plot.timeline') {
          // 生成时间线块内容 (使用默认值)
          await chunkGenerator.generatePlotBlock(sessionId, pendingBlock.id, { 
            summary: "", 
            timeline: "待补充故事时间线", 
            turningPoints: "", 
            subplots: "" 
          });
        } else if (pendingBlock.id === 'plot.turningPoints') {
          // 生成转折点块内容 (使用默认值)
          await chunkGenerator.generatePlotBlock(sessionId, pendingBlock.id, { 
            summary: "", 
            timeline: "", 
            turningPoints: "待补充故事转折点", 
            subplots: "" 
          });
        } else if (pendingBlock.id === 'plot.subplots') {
          // 生成子情节块内容 (使用默认值)
          await chunkGenerator.generatePlotBlock(sessionId, pendingBlock.id, { 
            summary: "", 
            timeline: "", 
            turningPoints: "", 
            subplots: "待补充故事子情节" 
          });
        } else if (pendingBlock.id === 'plot') {
          // 直接将section块标记为完成
          await chunkGenerator.generatePlotBlock(sessionId, pendingBlock.id, { 
            summary: "", 
            timeline: "", 
            turningPoints: "", 
            subplots: "" 
          });
        }
      }
      
      // 获取下一个待生成的块
      pendingBlock = await chunkGenerator.getNextPendingBlock(sessionId);
      
      // 模拟中断恢复: 每生成一个块后询问是否继续
      if (pendingBlock) {
        const continueQuestion = {
          type: "tool_use" as const,
          name: "ask_followup_question" as const,
          params: {
            question: `是否继续生成下一部分 "${pendingBlock.title || pendingBlock.id}"? (是/否)`
          },
          partial: false,
        };
        
        let shouldContinue = true;
        
        await safeExecute(
          async () => {
            await cline.toolManager.askFollowupQuestionTool(
              cline,
              continueQuestion,
              askApproval,
              handleError,
              async (result: unknown) => {
                if (result && typeof result === "string") {
                  const answer = result.trim().toLowerCase();
                  shouldContinue = answer === 'yes' || answer === 'y' || answer === '是' || answer === '继续';
                }
              },
              removeClosingTag
            );
          },
          undefined
        );
        
        if (!shouldContinue) {
          pushToolResult("已暂停生成，您可以稍后继续。系统会记住当前的生成进度。");
          // 在实际应用中，可以通过sessionId恢复生成进度
          break;
        }
      }
    }
    
    // 获取所有已生成的内容
    const generatedContent = await chunkGenerator.getFullFrameworkContent(sessionId);
    
    if (generatedContent) {
      // 确定最终文件路径
      const fullPath = path.isAbsolute(frameworkPath) 
        ? frameworkPath 
        : path.join(rootPath, frameworkPath);
      
      // 读取现有内容(如果有)
      let existingContent = "";
      try {
        existingContent = await fs.readFile(fullPath, "utf-8");
      } catch (error) {
        // 文件可能不存在，忽略错误
      }
      
      // 合并内容
      let finalContent = "";
      if (existingContent) {
        // 将生成的内容替换到现有框架中
        // 这里简化处理，仅添加到文件末尾
        // 在实际应用中，应该根据section标题智能合并
        finalContent = existingContent + "\n\n" + generatedContent;
      } else {
        // 创建新文件
        finalContent = `# 小说框架设计\n\n${generatedContent}`;
      }
      
      // 保存到文件
      await fs.writeFile(fullPath, finalContent, "utf-8");
      
      pushToolResult(`已成功生成并保存框架内容到文件: ${frameworkPath}`);
      
      // 显示生成的内容
      pushToolResult(`已生成的内容:\n\n${generatedContent}`);
      
      success = true;
      
      // 询问是否继续在当前部分工作
      const continueQuestion = {
        type: "tool_use" as const,
        name: "ask_followup_question" as const,
        params: {
          question: "您希望继续完善当前部分，还是返回主菜单? (继续/返回)"
        },
        partial: false,
      };
      
      await safeExecute(
        async () => {
          await cline.toolManager.askFollowupQuestionTool(
            cline,
            continueQuestion,
            askApproval,
            handleError,
            async (result: unknown) => {
              if (result && typeof result === "string") {
                const answer = result.trim().toLowerCase();
                continueInCurrentSection = answer === 'continue' || answer === '继续';
              }
            },
            removeClosingTag
          );
        },
        undefined
      );
    } else {
      pushToolResult("没有生成任何内容。");
      success = false;
    }
    
    return success || continueInCurrentSection;
  } catch (error) {
    if (error instanceof Error) {
      await handleError("执行分块生成示例工作流时出错", error);
    } else {
      await handleError("执行分块生成示例工作流时出现未知错误", new Error(String(error)));
    }
    return false;
  }
} 