import React from 'react';
import { Book, Info } from 'lucide-react';

import { VSCodeCheckbox, VSCodeDivider } from '@vscode/webview-ui-toolkit/react';
import { vscode } from '@/utils/vscode';
import { SectionHeader } from './SectionHeader';
import { Section } from './Section';
import { SetCachedStateField } from './types';
import { ExtensionStateContextType } from '@/context/ExtensionStateContext';

interface NovelFrameworkSettingsProps {
  autoUpdateEnabled?: boolean;
  setCachedStateField: SetCachedStateField<keyof ExtensionStateContextType>;
}

export const NovelFrameworkSettings: React.FC<NovelFrameworkSettingsProps> = ({
  autoUpdateEnabled = false,
  setCachedStateField
}) => {
  // 切换自动更新设置
  const toggleAutoUpdate = () => {
    setCachedStateField('autoUpdateEnabled', !autoUpdateEnabled);
  };
  
  return (
    <div>
      <SectionHeader>
        <div className="flex items-center gap-2">
          <Book className="w-4" />
          <div>小说框架设置</div>
        </div>
      </SectionHeader>
      
      <Section>
        <div className="space-y-4">
          <div className="mt-2 mb-4">
            <h3 className="text-sm font-medium mb-2">框架使用说明</h3>
            <div className="text-xs text-vscode-descriptionForeground bg-vscode-editor-background p-3 rounded">
              <p className="mb-2">
                <strong>什么是小说框架？</strong> 小说框架是指导AI创作的全局规则，包含角色、情节、世界观等设定，设置了以后AI任何创作都会遵循框架中的设定。
              </p>
              <p className="mb-2">
                <strong>如何使用？</strong> 左侧工作区选择小说框架文件，点击对话框底部的"设为框架"按钮激活，或者将框架文件移动到工作区内的.roo\rules目录下。
              </p>
              <p className="mb-2">
                <strong>适用范围：</strong> 框架将对除小说框架模式外的所有模式生效。
              </p>
              <p>
                <strong>提示：</strong> 您可以使用小说框架模式(🏗️ Novel Framework)创建和优化您的小说框架。
              </p>
              <p>
                <strong>移除方式：</strong> 将生效的框架文件重命名去掉文件中的.rules.和_Frameworkframework。
              </p>
            </div>
          </div>
          
          <VSCodeDivider />
          
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
      </Section>
    </div>
  );
};

export default NovelFrameworkSettings; 