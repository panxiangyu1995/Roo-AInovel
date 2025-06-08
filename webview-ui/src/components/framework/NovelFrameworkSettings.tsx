import React, { useState, useEffect } from 'react';
import { VSCodeCheckbox, VSCodeDivider } from '@vscode/webview-ui-toolkit/react';
import { Book, Info } from 'lucide-react';

import { vscode } from '@/utils/vscode';

const NovelFrameworkSettings: React.FC = () => {
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState<boolean>(false);
  
  // 初始化设置
  useEffect(() => {
    // 从配置中加载设置
    vscode.postMessage({
      type: "getFrameworkSettings"
    });
  }, []);
  
  // 处理来自扩展的消息
  useEffect(() => {
    const messageHandler = (event: MessageEvent) => {
      const message = event.data;
      
      if (message.type === "frameworkSettings") {
        setAutoUpdateEnabled(message.autoUpdateEnabled || false);
      }
    };
    
    window.addEventListener('message', messageHandler);
    return () => {
      window.removeEventListener('message', messageHandler);
    };
  }, []);
  
  // 切换自动更新设置
  const toggleAutoUpdate = () => {
    const newValue = !autoUpdateEnabled;
    setAutoUpdateEnabled(newValue);
    
    vscode.postMessage({
      type: "updateFrameworkSettings",
      settings: {
        autoUpdateEnabled: newValue
      }
    });
  };
  
  return (
    <div className="novel-framework-settings p-4">
      <div className="flex items-center mb-4">
        <Book className="w-5 h-5 mr-2 text-vscode-foreground" />
        <h2 className="text-lg font-medium text-vscode-foreground">小说框架设置</h2>
      </div>
      
      <VSCodeDivider />
      
      <div className="mt-4 mb-6">
        <h3 className="text-sm font-medium mb-2">框架使用说明</h3>
        <div className="text-xs text-vscode-descriptionForeground bg-vscode-editor-background p-3 rounded">
          <p className="mb-2">
            <strong>什么是小说框架？</strong> 小说框架是指导AI创作的全局规则，包含角色、情节、世界观等设定。
          </p>
          <p className="mb-2">
            <strong>如何使用？</strong> 将小说框架文件拖入对话框后，点击对话框底部的"设为框架"按钮激活。
          </p>
          <p>
            <strong>提示：</strong> 您可以使用小说框架模式(🏗️ Novel Framework)创建和优化您的小说框架。
          </p>
        </div>
      </div>
      
      <div className="mt-4">
        <VSCodeCheckbox 
          checked={autoUpdateEnabled}
          onChange={toggleAutoUpdate}
        >
          启用自动更新框架功能
        </VSCodeCheckbox>
        <p className="text-xs text-vscode-descriptionForeground ml-6 mt-1">
          当AI完成章节创作或优化后，自动总结并更新框架中的章节大纲
        </p>
      </div>
    </div>
  );
};

export default NovelFrameworkSettings; 