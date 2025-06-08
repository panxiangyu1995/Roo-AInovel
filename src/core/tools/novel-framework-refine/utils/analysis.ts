import { RefinementOption } from "../types"

/**
 * 分析框架内容，确定可完善的方向
 */
export function analyzeFramework(content: string): RefinementOption[] {
    const options: RefinementOption[] = []
    
    // 检查小说题材部分
    if (content.includes("## 小说题材") || content.includes("## 题材") || content.includes("## 类型")) {
        // 检查是否缺少具体的题材类型
        const genreTypes = ["仙侠", "玄幻", "科幻", "奇幻", "都市", "穿越", "重生", "异世界", "修真", "武侠", "悬疑", "恐怖", "言情", "历史"];
        const hasGenreTypes = genreTypes.some(genre => content.includes(genre));
        
        if (!hasGenreTypes) {
            options.push({
                id: "genre_type",
                area: "genre",
                title: "明确题材类型",
                description: "选择并定义具体的题材类型（如修仙、武侠、科幻、都市等）",
            });
        }
        
        if (!content.includes("题材特色") && !content.includes("题材创新")) {
            options.push({
                id: "genre_uniqueness",
                area: "genre",
                title: "设计题材特色",
                description: "明确本作品在该题材中的创新点和独特之处",
            });
        }
        
        if (!content.includes("题材规则") && !content.includes("世界规则")) {
            options.push({
                id: "genre_rules",
                area: "genre",
                title: "确定题材规则",
                description: "建立该题材特有的规则体系和设定",
            });
        }
        
        if (!content.includes("题材融合") && !content.includes("混合题材")) {
            options.push({
                id: "genre_fusion",
                area: "genre",
                title: "探索题材融合",
                description: "设计多种题材元素的融合方式和比例",
            });
        }
    } else {
        // 如果没有小说题材部分，添加创建小说题材部分的选项
        options.push({
            id: "add_genre_section",
            area: "genre",
            title: "添加小说题材部分",
            description: "创建专门的小说题材部分，确定作品的具体类型和特色",
        });
    }

    // 检查角色部分
    if (content.includes("## 主要角色") || content.includes("## 角色设计")) {
        if (!content.includes("性格特点") || !content.includes("背景故事")) {
            options.push({
                id: "character_detail",
                area: "character",
                title: "完善角色详情",
                description: "为主要角色添加更详细的性格特点、背景故事和动机描述",
            })
        }

        if (!content.includes("角色关系图") || !content.includes("角色成长轨迹")) {
            options.push({
                id: "character_relations",
                area: "character",
                title: "完善角色关系",
                description: "添加或完善角色之间的关系网络和互动模式",
            })
        }

        if (!content.includes("角色对话风格") && !content.includes("语言特点")) {
            options.push({
                id: "character_voice",
                area: "character",
                title: "添加角色对话风格",
                description: "为每个主要角色定义独特的对话风格和语言特点",
            })
        }
    }

    // 检查情节部分
    if (content.includes("## 故事大纲") || content.includes("## 主要情节线")) {
        if (!content.includes("故事流程图") && !content.includes("故事时间线")) {
            options.push({
                id: "plot_timeline",
                area: "plot",
                title: "添加故事时间线",
                description: "创建详细的故事时间线或流程图，明确事件发生的顺序和因果关系",
            })
        }

        if (!content.includes("转折点") || !content.includes("高潮")) {
            options.push({
                id: "plot_structure",
                area: "plot",
                title: "完善故事结构",
                description: "明确故事的关键转折点、冲突升级和高潮部分",
            })
        }

        if (!content.includes("支线") || !content.includes("subplot")) {
            options.push({
                id: "subplots",
                area: "plot",
                title: "设计支线故事",
                description: "添加与主线相关的支线故事，丰富整体叙事",
            })
        }

        if (!content.includes("章节大纲")) {
            options.push({
                id: "chapter_outline",
                area: "plot",
                title: "创建章节大纲",
                description: "将故事划分为具体章节，并为每章设定内容概要",
            })
        }
    }

    // 检查世界观部分
    if (content.includes("## 世界观") || content.includes("## 世界观设定")) {
        if (!content.includes("社会结构") && !content.includes("政治体系")) {
            options.push({
                id: "world_society",
                area: "world",
                title: "完善社会结构",
                description: "详细描述故事世界的社会组织、政治体系和权力结构",
            })
        }

        if (!content.includes("地理环境") && !content.includes("世界地图")) {
            options.push({
                id: "world_geography",
                area: "world",
                title: "添加地理环境",
                description: "描述故事发生地的地理环境、气候特点和重要地标",
            })
        }

        if (!content.includes("历史背景") && !content.includes("历史事件")) {
            options.push({
                id: "world_history",
                area: "world",
                title: "补充历史背景",
                description: "添加影响当前故事的重要历史事件和背景",
            })
        }

        if (!content.includes("文化习俗") && !content.includes("宗教信仰")) {
            options.push({
                id: "world_culture",
                area: "world",
                title: "丰富文化元素",
                description: "添加故事世界的文化习俗、宗教信仰和价值观念",
            })
        }
    }

    // 检查主题元素部分
    if (content.includes("## 主题") || content.includes("## 主题元素")) {
        if (!content.includes("核心主题") && !content.includes("中心思想")) {
            options.push({
                id: "theme_core",
                area: "theme",
                title: "明确核心主题",
                description: "确定小说要探讨的核心思想和中心主题",
            });
        }
        
        if (!content.includes("象征元素") && !content.includes("隐喻")) {
            options.push({
                id: "theme_symbols",
                area: "theme",
                title: "设计象征元素",
                description: "创建与主题相关的象征物、隐喻和意象",
            });
        }
    } else {
        // 如果没有主题部分，添加创建主题部分的选项
        options.push({
            id: "add_theme_section",
            area: "theme",
            title: "添加主题元素部分",
            description: "创建专门的主题部分，定义小说的核心思想和表达方式",
        });
    }

    // 检查叙事视角部分
    if (!content.includes("## 叙事视角") && !content.includes("## 视角设计") && !content.includes("## 叙事风格")) {
        options.push({
            id: "add_narrative_perspective",
            area: "style",
            title: "添加叙事视角设计",
            description: "确定小说的叙事视角（第一人称/第三人称/全知视角等）及其效果",
        });
    } else if (content.includes("## 叙事视角") || content.includes("## 视角设计") || content.includes("## 叙事风格")) {
        if (!content.includes("视角转换") && !content.includes("多视角")) {
            options.push({
                id: "perspective_switching",
                area: "style",
                title: "完善视角转换策略",
                description: "设计多视角叙事或视角转换的具体实施方案",
            });
        }
    }

    // 检查写作风格部分
    if (!content.includes("## 写作风格") && !content.includes("## 语言风格")) {
        options.push({
            id: "add_writing_style",
            area: "style",
            title: "添加写作风格设计",
            description: "确定小说的整体语言风格（简洁/华丽/幽默等）",
        });
    } else if (content.includes("## 写作风格") || content.includes("## 语言风格")) {
        if (!content.includes("修辞手法") && !content.includes("语言特色")) {
            options.push({
                id: "rhetoric_techniques",
                area: "style",
                title: "丰富修辞手法",
                description: "设计特色修辞手法和语言表达方式",
            });
        }
    }
    
    // 检查写作手法部分
    if (content.includes("## 写作手法") || content.includes("## 叙事技巧") || content.includes("## 表达技法")) {
        if (!content.includes("描写技巧") && !content.includes("人物描写")) {
            options.push({
                id: "description_techniques",
                area: "writing-technique",
                title: "完善描写技巧",
                description: "设计人物、场景和心理的描写方法和重点",
            });
        }
        
        if (!content.includes("对话设计") && !content.includes("对话特色")) {
            options.push({
                id: "dialogue_design",
                area: "writing-technique",
                title: "优化对话设计",
                description: "规划对话的风格、功能和表现方式",
            });
        }
        
        if (!content.includes("节奏控制") && !content.includes("节奏变化")) {
            options.push({
                id: "pacing_control",
                area: "writing-technique",
                title: "添加节奏控制",
                description: "设计叙事节奏的快慢变化和张弛有度",
            });
        }
        
        if (!content.includes("特色手法") && !content.includes("创新技巧")) {
            options.push({
                id: "special_techniques",
                area: "writing-technique",
                title: "规划特色手法",
                description: "确定作品中将采用的特殊表现手法和创新技巧",
            });
        }
    } else {
        // 如果没有写作手法部分，添加创建写作手法部分的选项
        options.push({
            id: "add_writing_technique_section",
            area: "writing-technique",
            title: "添加写作手法部分",
            description: "创建专门的写作手法部分，规划具体的描写技巧和表现方法",
        });
    }

    // 检查节奏控制部分
    if (!content.includes("## 节奏控制") && !content.includes("## 节奏设计")) {
        options.push({
            id: "add_pacing",
            area: "style",
            title: "添加节奏控制设计",
            description: "设计小说的整体节奏和紧张感变化",
        });
    }

    // 检查市场定位部分
    if (!content.includes("## 市场定位") && !content.includes("## 读者定位")) {
        options.push({
            id: "add_market_positioning",
            area: "market",
            title: "添加市场定位分析",
            description: "确定目标读者群体、竞品分析和市场差异化策略",
        });
    } else if (content.includes("## 市场定位") || content.includes("## 读者定位")) {
        if (!content.includes("目标读者") && !content.includes("读者群")) {
            options.push({
                id: "target_readers",
                area: "market",
                title: "明确目标读者",
                description: "详细分析目标读者的年龄、性别、兴趣和阅读习惯",
            });
        }
        
        if (!content.includes("竞品分析") && !content.includes("市场差异")) {
            options.push({
                id: "competitive_analysis",
                area: "market",
                title: "添加竞品分析",
                description: "分析市场上类似作品的特点和差异化策略",
            });
        }
    }

    // 检查多媒体适配部分
    if (!content.includes("## 多媒体适配") && !content.includes("## 改编潜力")) {
        options.push({
            id: "add_multimedia_adaptation",
            area: "market",
            title: "添加多媒体适配规划",
            description: "考虑作品向有声书、漫画、影视等媒介改编的潜力和要点",
        });
    }

    // 检查创作计划部分
    if (!content.includes("## 创作计划") && !content.includes("## 写作计划")) {
        options.push({
            id: "add_creation_plan",
            area: "plan",
            title: "添加创作计划",
            description: "制定写作时间表、章节发布计划和创作目标",
        });
    } else if (content.includes("## 创作计划") || content.includes("## 写作计划")) {
        if (!content.includes("时间表") && !content.includes("进度")) {
            options.push({
                id: "writing_schedule",
                area: "plan",
                title: "制定写作时间表",
                description: "规划具体的写作进度和时间安排",
            });
        }
        
        if (!content.includes("里程碑") && !content.includes("阶段目标")) {
            options.push({
                id: "writing_milestones",
                area: "plan",
                title: "设置创作里程碑",
                description: "确定关键的创作阶段和阶段性目标",
            });
        }
    }

    // 检查系统设定部分
    if (content.includes("## 系统设定") || content.includes("## 特殊系统") || content.includes("## 世界规则") || 
        content.includes("## 修仙系统") || content.includes("## 武功系统")) {
        if (!content.includes("基本规则") && !content.includes("核心规则")) {
            options.push({
                id: "system_core_rules",
                area: "tech",
                title: "完善系统核心规则",
                description: "明确定义系统的基本原理和运作方式",
            });
        }
        
        if (!content.includes("等级划分") && !content.includes("境界划分") && !content.includes("进阶路径")) {
            options.push({
                id: "system_levels",
                area: "tech",
                title: "设计系统等级与进阶",
                description: "创建系统的等级结构、晋升条件和进阶路径",
            });
        }
        
        if (!content.includes("特殊能力") && !content.includes("独特技能")) {
            options.push({
                id: "system_abilities",
                area: "tech",
                title: "增加系统独特能力",
                description: "设计系统提供的独特能力、技能和效果",
            });
        }
        
        if (!content.includes("限制条件") && !content.includes("代价") && !content.includes("副作用")) {
            options.push({
                id: "system_limitations",
                area: "tech",
                title: "添加系统限制与代价",
                description: "设计系统的使用限制、代价和平衡机制",
            });
        }
    } else {
        // 如果没有系统设定部分，添加创建系统设定部分的选项
        options.push({
            id: "add_system",
            area: "tech",
            title: "添加系统设定",
            description: "创建专门的系统设定部分，定义小说中的特殊系统和规则",
        });
    }

    // 检查情感设计部分
    if (!content.includes("## 情感设计") && !content.includes("## 情感基调")) {
        options.push({
            id: "add_emotional_design",
            area: "emotion",
            title: "添加情感设计",
            description: "规划作品的情感基调、情感冲突和情感节奏",
        });
    } else if (content.includes("## 情感设计") || content.includes("## 情感基调")) {
        if (!content.includes("情感冲突") && !content.includes("情感对比")) {
            options.push({
                id: "emotional_conflicts",
                area: "emotion",
                title: "设计情感冲突",
                description: "创建角色间的情感冲突和矛盾",
            });
        }
        
        if (!content.includes("情感节奏") && !content.includes("情感起伏")) {
            options.push({
                id: "emotional_pacing",
                area: "emotion",
                title: "规划情感节奏",
                description: "设计情感强度的变化和起伏",
            });
        }
    }
    
    // 检查自我反思部分
    if (!content.includes("## 自我反思") && !content.includes("## 创作意图") && !content.includes("## 创作反思")) {
        options.push({
            id: "add_self_reflection",
            area: "reflection",
            title: "添加自我反思",
            description: "记录创作意图、个人风格和创新点",
        });
    } else if (content.includes("## 自我反思") || content.includes("## 创作意图") || content.includes("## 创作反思")) {
        if (!content.includes("创作挑战") && !content.includes("困难")) {
            options.push({
                id: "creative_challenges",
                area: "reflection",
                title: "分析创作挑战",
                description: "识别可能面临的创作困难和应对策略",
            });
        }
        
        if (!content.includes("成长目标") && !content.includes("提升")) {
            options.push({
                id: "growth_goals",
                area: "reflection",
                title: "设定成长目标",
                description: "确定通过创作希望达成的个人成长目标",
            });
        }
    }

    // 如果没有找到特定区域的内容，添加通用选项
    if (options.length === 0) {
        options.push(
            {
                id: "add_characters",
                area: "character",
                title: "添加角色设计",
                description: "创建主要角色、反派角色和次要角色的详细设计",
            },
            {
                id: "add_plot",
                area: "plot",
                title: "添加故事大纲",
                description: "设计故事的整体架构、主要情节线和转折点",
            },
            {
                id: "add_world",
                area: "world",
                title: "添加世界观设定",
                description: "创建故事发生的世界背景、规则和历史",
            },
            {
                id: "add_themes",
                area: "theme",
                title: "添加主题探索",
                description: "定义故事要探索的核心主题和思想",
            },
            {
                id: "add_style",
                area: "style",
                title: "添加写作风格设计",
                description: "确定叙事视角、语言风格和节奏控制",
            },
            {
                id: "add_market",
                area: "market",
                title: "添加市场定位分析",
                description: "确定目标读者群和市场策略",
            },
            {
                id: "add_plan",
                area: "plan",
                title: "添加创作计划",
                description: "制定写作时间表和创作目标",
            },
            {
                id: "add_tech",
                area: "tech",
                title: "添加技术元素",
                description: "规划写作技巧、悬念和伏笔设计",
            },
            {
                id: "add_emotion",
                area: "emotion",
                title: "添加情感设计",
                description: "规划情感基调、冲突和节奏",
            },
            {
                id: "add_reflection",
                area: "reflection",
                title: "添加自我反思",
                description: "记录创作意图和个人风格特点",
            }
        )
    }

    // 始终添加一个整体完善选项
    options.push({
        id: "comprehensive_review",
        area: "all",
        title: "全面审查与完善",
        description: "对整个框架进行全面审查，找出不一致之处并提供完善建议",
    })

    return options
} 