const fs = require('fs').promises;
const path = require('path');

// 工作流文件所在目录
const workflowsDir = path.join(__dirname, 'src', 'services', 'framework', 'workflows');

// 需要处理的工作流文件列表
const workflowFiles = [
    'chunk-demo.ts',
    'market.ts',
    'plot.ts',
    'style.ts',
    'theme.ts',
    'world.ts',
    'tech.ts',
    'writing-technique.ts',
    'reflection.ts',
    'genre.ts',
    'emotion.ts',
    'character.ts',
    'chapter-outline.ts'
];

// 处理单个文件
async function processFile(filePath) {
    try {
        console.log(`处理文件: ${filePath}`);
        
        // 读取文件内容
        const content = await fs.readFile(filePath, 'utf8');
        
        // 检查是否已经导入 updateFrameworkFile
        const hasUpdateFrameworkFile = content.includes('updateFrameworkFile');
        
        // 修改导入语句
        let updatedContent = content;
        if (!hasUpdateFrameworkFile) {
            // 查找导入 common 的语句
            const commonImportRegex = /import\s+\{([^}]*)\}\s+from\s+["']\.\.\/utils\/common["']/;
            const match = content.match(commonImportRegex);
            
            if (match) {
                const imports = match[1];
                // 检查是否已经包含 updateFrameworkFile
                if (!imports.includes('updateFrameworkFile')) {
                    const newImports = imports.trim() + ', updateFrameworkFile';
                    updatedContent = content.replace(commonImportRegex, `import {${newImports}} from "../utils/common"`);
                }
            } else {
                // 如果没有导入 common，添加导入语句
                updatedContent = `import { updateFrameworkFile } from "../utils/common";\n${content}`;
            }
        }
        
        // 替换 fs.writeFile 为 updateFrameworkFile
        const writeFileRegex = /await\s+fs\.writeFile\s*\(\s*([^,]+),\s*([^,]+),\s*["']utf-?8?["']\s*\)/g;
        updatedContent = updatedContent.replace(writeFileRegex, 'await updateFrameworkFile($1, $2)');
        
        // 写回文件
        if (content !== updatedContent) {
            await fs.writeFile(filePath, updatedContent, 'utf8');
            console.log(`已更新文件: ${filePath}`);
        } else {
            console.log(`无需更新文件: ${filePath}`);
        }
    } catch (error) {
        console.error(`处理文件 ${filePath} 时出错:`, error);
    }
}

// 主函数
async function main() {
    try {
        console.log('开始批量更新工作流文件...');
        
        // 处理所有工作流文件
        for (const file of workflowFiles) {
            const filePath = path.join(workflowsDir, file);
            await processFile(filePath);
        }
        
        console.log('所有工作流文件更新完成！');
    } catch (error) {
        console.error('批量更新工作流文件时出错:', error);
    }
}

// 执行主函数
main(); 