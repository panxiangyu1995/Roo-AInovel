/**
 * 全局错误处理工具
 * 用于处理验证失败和网络问题
 */

/**
 * 处理API调用错误
 * @param error 错误对象
 * @returns 用户友好的错误消息
 */
export function handleApiError(error: any): string {
    // 检查是否是验证错误
    if (error.message && typeof error.message === 'string' && 
        (error.message.includes('验证失败') || 
         error.message.includes('authentication') ||
         error.message.includes('auth') ||
         error.message.includes('fetch failed'))) {
        return '验证失败，可能是网络问题或API密钥无效。这不会影响工具的基本功能，您可以继续使用。';
    }
    
    // 检查是否是网络错误
    if (error.message && typeof error.message === 'string' && 
        (error.message.includes('network') ||
         error.message.includes('fetch') ||
         error.message.includes('timeout') ||
         error.message.includes('连接'))) {
        return '网络连接错误，请检查您的网络连接。工具将尝试使用本地功能继续运行。';
    }
    
    // 检查是否是文件错误
    if (error.message && typeof error.message === 'string' && 
        (error.message.includes('file') ||
         error.message.includes('文件') ||
         error.message.includes('permission') ||
         error.message.includes('权限'))) {
        return '文件操作错误，可能是权限问题。工具将尝试使用替代方法继续运行。';
    }
    
    // 默认错误消息
    return error.message || '发生未知错误，工具将尝试继续运行。';
}

/**
 * 检查是否是致命错误（无法继续工作流的错误）
 * @param error 错误对象
 * @returns 是否是致命错误
 */
export function isFatalError(error: any): boolean {
    if (!error || !error.message || typeof error.message !== 'string') {
        return false;
    }
    
    // 某些错误是致命的，必须停止流程
    return error.message.includes('FATAL') || 
           error.message.includes('致命') ||
           error.message.includes('corrupted') ||
           error.message.includes('损坏');
}

/**
 * 安全执行异步函数
 * @param fn 要执行的异步函数
 * @param fallback 失败时的返回值
 * @param errorHandler 可选的错误处理函数
 * @returns 函数执行结果或fallback值
 */
export async function safeExecute<T>(
    fn: () => Promise<T>, 
    fallback: T,
    errorHandler?: (error: any) => void
): Promise<T> {
    try {
        return await fn();
    } catch (error) {
        if (errorHandler) {
            errorHandler(error);
        }
        return fallback;
    }
} 