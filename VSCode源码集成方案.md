# 将AI小说插件集成到VSCode源码中的方案

## 1. 概述

将现有的AI小说VSCode插件直接集成到VSCode源码中，可以获得与Void类似的深度集成体验，包括更好的UI整合、性能优化和功能扩展。这种方法不同于开发普通的VSCode扩展，而是直接修改VSCode的源代码，创建一个定制版的VSCode编辑器。

## 2. 准备工作

### 2.1 获取VSCode源码

1. 克隆VSCode仓库：
   ```bash
   git clone https://github.com/microsoft/vscode.git
   cd vscode
   ```

2. 安装依赖并构建：
   ```bash
   yarn
   yarn compile
   ```

### 2.2 了解VSCode源码结构

VSCode的主要源码结构：

- `src/vs/workbench/`: 工作台相关代码
- `src/vs/editor/`: 编辑器相关代码
- `src/vs/platform/`: 平台服务
- `src/vs/base/`: 基础工具类和通用功能

## 3. 集成步骤

### 3.1 创建自定义贡献点

1. 在`src/vs/workbench/contrib/`目录下创建新的目录`ainovel/`：
   ```bash
   mkdir -p src/vs/workbench/contrib/ainovel
   ```

2. 按照VSCode的代码组织方式，创建以下子目录：
   ```bash
   mkdir -p src/vs/workbench/contrib/ainovel/browser
   mkdir -p src/vs/workbench/contrib/ainovel/common
   mkdir -p src/vs/workbench/contrib/ainovel/electron-main
   ```

### 3.2 移植现有插件代码

1. **分析现有插件结构**：
   - 识别插件的主要组件和功能
   - 确定需要移植的核心功能

2. **重构代码以适应VSCode架构**：
   - 将UI组件转换为VSCode的WebView或原生UI组件
   - 将插件的服务转换为VSCode服务
   - 调整API调用以使用VSCode内部API

3. **移植核心功能**：
   - 将AI模型集成代码移植到`common`目录
   - 将UI组件移植到`browser`目录
   - 将需要Node.js访问的代码移植到`electron-main`目录

### 3.3 创建服务和贡献点

1. **创建服务**：

   在`common`目录下创建服务接口：

   ```typescript
   // src/vs/workbench/contrib/ainovel/common/aiNovelService.ts
   import { createDecorator } from 'vs/platform/instantiation/common/instantiation';

   export const IAINovelService = createDecorator<IAINovelService>('aiNovelService');

   export interface IAINovelService {
     readonly _serviceBrand: undefined;
     // 定义您的服务接口
     generateText(prompt: string, options?: any): Promise<string>;
     createOutline(title: string, options?: any): Promise<string>;
     // 其他方法...
   }
   ```

2. **实现服务**：

   在`browser`目录下实现服务：

   ```typescript
   // src/vs/workbench/contrib/ainovel/browser/aiNovelService.ts
   import { registerSingleton } from 'vs/platform/instantiation/common/extensions';
   import { IAINovelService } from 'vs/workbench/contrib/ainovel/common/aiNovelService';

   class AINovelService implements IAINovelService {
     _serviceBrand: undefined;
     
     constructor(
       // 注入依赖服务
     ) {}
     
     async generateText(prompt: string, options?: any): Promise<string> {
       // 实现生成文本的逻辑
       return '';
     }
     
     async createOutline(title: string, options?: any): Promise<string> {
       // 实现创建大纲的逻辑
       return '';
     }
     
     // 其他方法实现...
   }

   registerSingleton(IAINovelService, AINovelService);
   ```

3. **创建贡献点**：

   在`browser`目录下创建贡献点：

   ```typescript
   // src/vs/workbench/contrib/ainovel/browser/aiNovel.contribution.ts
   import { Registry } from 'vs/platform/registry/common/platform';
   import { Extensions as WorkbenchExtensions, IWorkbenchContributionsRegistry } from 'vs/workbench/common/contributions';
   import { LifecyclePhase } from 'vs/workbench/services/lifecycle/common/lifecycle';
   
   // 注册工作台贡献
   class AINovelContribution {
     constructor() {
       // 初始化代码
     }
   }
   
   Registry.as<IWorkbenchContributionsRegistry>(WorkbenchExtensions.Workbench).registerWorkbenchContribution(
     AINovelContribution,
     LifecyclePhase.Restored
   );
   ```

### 3.4 集成UI组件

1. **创建视图容器**：

   ```typescript
   // 在aiNovel.contribution.ts中添加
   import { ViewContainer, ViewContainerRegistry, Extensions as ViewContainerExtensions } from 'vs/workbench/common/views';
   import { localize } from 'vs/nls';
   import { registerIcon } from 'vs/platform/theme/common/iconRegistry';
   
   // 注册图标
   const AINovelViewIcon = registerIcon('ainovel-view-icon', Codicon.book, localize('ainovelViewIcon', "AI Novel View Icon"));
   
   // 注册视图容器
   const viewContainer = Registry.as<ViewContainerRegistry>(ViewContainerExtensions.ViewContainersRegistry).registerViewContainer({
     id: 'ainovelViewContainer',
     title: localize('aiNovel', "AI Novel"),
     icon: AINovelViewIcon,
     ctorDescriptor: new SyncDescriptor(ViewPaneContainer, ['ainovelViewContainer', { mergeViewWithContainerWhenSingleView: true }]),
     storageId: 'ainovelViewContainer',
     order: 6,
     hideIfEmpty: false,
   }, ViewContainerLocation.Sidebar);
   ```

2. **创建视图**：

   ```typescript
   // 在aiNovel.contribution.ts中添加
   import { IViewsRegistry, Extensions as ViewsExtensions } from 'vs/workbench/common/views';
   
   // 注册视图
   Registry.as<IViewsRegistry>(ViewsExtensions.ViewsRegistry).registerViews([
     {
       id: 'ainovelView',
       name: localize('aiNovelView', "AI Novel"),
       ctorDescriptor: new SyncDescriptor(AINovelView),
       canToggleVisibility: true,
       canMoveView: true,
       when: ContextKeyExpr.true(),
     }
   ], viewContainer);
   ```

3. **实现视图组件**：

   ```typescript
   // src/vs/workbench/contrib/ainovel/browser/aiNovelView.ts
   import { IViewletViewOptions } from 'vs/workbench/browser/parts/views/viewsViewlet';
   import { ViewPane } from 'vs/workbench/browser/parts/views/viewPane';
   
   export class AINovelView extends ViewPane {
     static readonly ID = 'ainovelView';
     
     constructor(
       options: IViewletViewOptions,
       @IInstantiationService instantiationService: IInstantiationService,
       // 其他依赖...
     ) {
       super(options, instantiationService);
     }
     
     protected renderBody(container: HTMLElement): void {
       // 实现UI渲染
       // 可以使用DOM API或React组件
     }
   }
   ```

### 3.5 创建命令和快捷键

1. **注册命令**：

   ```typescript
   // 在aiNovel.contribution.ts中添加
   import { MenuRegistry, MenuId } from 'vs/platform/actions/common/actions';
   import { CommandsRegistry } from 'vs/platform/commands/common/commands';
   
   // 注册命令
   CommandsRegistry.registerCommand('ainovel.generateText', (accessor, ...args) => {
     const aiNovelService = accessor.get(IAINovelService);
     return aiNovelService.generateText(args[0]);
   });
   
   // 添加菜单项
   MenuRegistry.appendMenuItem(MenuId.CommandPalette, {
     command: {
       id: 'ainovel.generateText',
       title: localize('generateText', "AI Novel: Generate Text"),
     }
   });
   ```

2. **注册快捷键**：

   ```typescript
   // 在package.json的contributes.keybindings中添加
   import { KeybindingsRegistry } from 'vs/platform/keybinding/common/keybindingsRegistry';
   import { KeyCode, KeyMod } from 'vs/base/common/keyCodes';
   
   // 注册快捷键
   KeybindingsRegistry.registerKeybindingRule({
     id: 'ainovel.generateText',
     weight: KeybindingWeight.WorkbenchContrib,
     primary: KeyMod.CtrlCmd | KeyMod.Alt | KeyCode.KeyG,
     when: EditorContextKeys.focus
   });
   ```

### 3.6 集成设置

1. **注册设置**：

   ```typescript
   // 在aiNovel.contribution.ts中添加
   import { IConfigurationRegistry, Extensions as ConfigurationExtensions } from 'vs/platform/configuration/common/configurationRegistry';
   
   // 注册设置
   Registry.as<IConfigurationRegistry>(ConfigurationExtensions.Configuration).registerConfiguration({
     id: 'ainovel',
     title: localize('aiNovelConfigurationTitle', "AI Novel"),
     type: 'object',
     properties: {
       'ainovel.apiKey': {
         type: 'string',
         default: '',
         description: localize('ainovel.apiKey', "API Key for AI service")
       },
       'ainovel.defaultModel': {
         type: 'string',
         default: 'gpt-4',
         enum: ['gpt-3.5-turbo', 'gpt-4', 'claude-3-opus'],
         description: localize('ainovel.defaultModel', "Default AI model to use")
       },
       // 其他设置...
     }
   });
   ```

### 3.7 集成AI模型

1. **创建AI服务**：

   ```typescript
   // src/vs/workbench/contrib/ainovel/common/aiModelService.ts
   import { createDecorator } from 'vs/platform/instantiation/common/instantiation';
   
   export const IAIModelService = createDecorator<IAIModelService>('aiModelService');
   
   export interface IAIModelService {
     readonly _serviceBrand: undefined;
     callModel(prompt: string, options?: any): Promise<string>;
     // 其他方法...
   }
   ```

2. **实现AI服务**：

   ```typescript
   // src/vs/workbench/contrib/ainovel/browser/aiModelService.ts
   import { registerSingleton } from 'vs/platform/instantiation/common/extensions';
   import { IAIModelService } from 'vs/workbench/contrib/ainovel/common/aiModelService';
   
   class AIModelService implements IAIModelService {
     _serviceBrand: undefined;
     
     constructor(
       @IConfigurationService private readonly configurationService: IConfigurationService,
       // 其他依赖...
     ) {}
     
     async callModel(prompt: string, options?: any): Promise<string> {
       const apiKey = this.configurationService.getValue('ainovel.apiKey');
       const model = options?.model || this.configurationService.getValue('ainovel.defaultModel');
       
       // 实现AI模型调用逻辑
       return '';
     }
     
     // 其他方法实现...
   }
   
   registerSingleton(IAIModelService, AIModelService);
   ```

## 4. 移植12种创作模式

### 4.1 创建模式基础架构

1. **定义模式接口**：

   ```typescript
   // src/vs/workbench/contrib/ainovel/common/novelModes.ts
   export interface NovelMode {
     id: string;
     name: string;
     description: string;
     icon: string;
     execute(input: string, options?: any): Promise<string>;
   }
   ```

2. **创建模式注册表**：

   ```typescript
   // src/vs/workbench/contrib/ainovel/common/novelModeRegistry.ts
   import { NovelMode } from './novelModes';
   
   class NovelModeRegistry {
     private _modes: Map<string, NovelMode> = new Map();
     
     registerMode(mode: NovelMode): void {
       this._modes.set(mode.id, mode);
     }
     
     getMode(id: string): NovelMode | undefined {
       return this._modes.get(id);
     }
     
     getAllModes(): NovelMode[] {
       return Array.from(this._modes.values());
     }
   }
   
   export const novelModeRegistry = new NovelModeRegistry();
   ```

### 4.2 实现各种模式

为每种模式创建实现类：

```typescript
// src/vs/workbench/contrib/ainovel/browser/modes/textGenerationMode.ts
import { NovelMode } from 'vs/workbench/contrib/ainovel/common/novelModes';
import { novelModeRegistry } from 'vs/workbench/contrib/ainovel/common/novelModeRegistry';

class TextGenerationMode implements NovelMode {
  id = 'textGeneration';
  name = '文字生成模式';
  description = '专注于创作高质量的小说内容';
  icon = 'pencil';
  
  constructor(
    @IAIModelService private readonly aiModelService: IAIModelService
  ) {}
  
  async execute(input: string, options?: any): Promise<string> {
    // 实现文字生成逻辑
    const prompt = `请根据以下内容生成高质量的小说文字：\n\n${input}`;
    return this.aiModelService.callModel(prompt, options);
  }
}

// 注册模式
novelModeRegistry.registerMode(new TextGenerationMode());
```

为其他11种模式创建类似的实现。

### 4.3 创建模式选择UI

```typescript
// src/vs/workbench/contrib/ainovel/browser/novelModeSelectorView.ts
import { ViewPane } from 'vs/workbench/browser/parts/views/viewPane';
import { novelModeRegistry } from 'vs/workbench/contrib/ainovel/common/novelModeRegistry';

export class NovelModeSelectorView extends ViewPane {
  static readonly ID = 'ainovelModeSelectorView';
  
  constructor(
    options: IViewletViewOptions,
    @IInstantiationService instantiationService: IInstantiationService,
    // 其他依赖...
  ) {
    super(options, instantiationService);
  }
  
  protected renderBody(container: HTMLElement): void {
    const modes = novelModeRegistry.getAllModes();
    
    // 创建模式选择UI
    const modeList = document.createElement('div');
    modeList.className = 'novel-mode-list';
    
    modes.forEach(mode => {
      const modeItem = document.createElement('div');
      modeItem.className = 'novel-mode-item';
      modeItem.innerHTML = `
        <div class="mode-icon">${mode.icon}</div>
        <div class="mode-info">
          <div class="mode-name">${mode.name}</div>
          <div class="mode-description">${mode.description}</div>
        </div>
      `;
      
      modeItem.addEventListener('click', () => {
        // 处理模式选择
        this.selectMode(mode.id);
      });
      
      modeList.appendChild(modeItem);
    });
    
    container.appendChild(modeList);
  }
  
  private selectMode(modeId: string): void {
    // 实现模式选择逻辑
  }
}
```

## 5. 构建和测试

### 5.1 修改构建脚本

1. 确保新添加的文件被包含在构建过程中：
   - 检查`src/tsconfig.json`和其他相关的TypeScript配置
   - 确保新文件被正确导入和导出

2. 添加自定义构建任务（如果需要）：
   ```json
   // package.json
   "scripts": {
     "build-ainovel": "node ./node_modules/gulp/bin/gulp.js compile-ainovel"
   }
   ```

### 5.2 测试集成

1. 运行VSCode开发版本：
   ```bash
   yarn watch
   ```

2. 在新窗口中打开：
   ```bash
   ./scripts/code.sh
   ```

3. 测试所有功能和模式

## 6. 打包和分发

### 6.1 创建自定义品牌

1. 修改产品定义：
   ```json
   // product.json
   {
     "nameShort": "AI Novel",
     "nameLong": "AI Novel Editor",
     "applicationName": "ainovel",
     "dataFolderName": ".ainovel",
     "win32MutexName": "ainovel",
     "licenseName": "MIT",
     "licenseUrl": "https://github.com/yourusername/ainovel/blob/main/LICENSE.txt",
     // 其他配置...
   }
   ```

2. 添加自定义图标和品牌资源

### 6.2 构建分发包

1. 构建生产版本：
   ```bash
   yarn gulp compile-build
   ```

2. 创建安装包：
   ```bash
   yarn gulp vscode-win32-x64-setup
   yarn gulp vscode-darwin-x64
   yarn gulp vscode-linux-x64-deb
   ```

## 7. 注意事项和最佳实践

1. **保持与VSCode更新同步**：
   - 定期合并VSCode上游更改
   - 确保自定义代码与VSCode API兼容

2. **代码组织**：
   - 遵循VSCode的代码组织约定
   - 使用依赖注入和服务模式
   - 保持关注点分离

3. **性能考虑**：
   - 避免在UI线程中进行重量级操作
   - 使用适当的缓存策略
   - 优化大文本处理

4. **安全性**：
   - 安全存储API密钥和敏感信息
   - 实现适当的错误处理和用户反馈

5. **用户体验**：
   - 遵循VSCode的UI设计语言
   - 提供清晰的用户反馈
   - 实现渐进式功能发现

## 8. 与Void项目的对比

与使用Void项目相比，直接修改VSCode源码的优缺点：

### 优点
- 完全控制整个应用程序
- 可以深度集成到VSCode的核心功能中
- 可以修改VSCode的任何部分以适应AI小说创作需求

### 缺点
- 需要维护自己的VSCode分支
- 需要处理VSCode更新和合并
- 学习曲线更陡峭
- 需要更多的开发资源

## 9. 结论

将AI小说VSCode插件集成到VSCode源码中是一个复杂但可行的方案，可以提供与Void类似的深度集成体验。这种方法需要深入了解VSCode的架构和API，但可以提供最大的定制灵活性和最佳的用户体验。

建议采用渐进式开发策略，先实现核心功能，再逐步添加高级特性，确保每个阶段都有可用的产品。同时，建立良好的测试和发布流程，确保产品的质量和稳定性。 