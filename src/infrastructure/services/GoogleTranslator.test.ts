import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GoogleTranslator } from './GoogleTranslator';

/**
 * GoogleTranslator 单元测试
 * 
 * 职责：
 * 验证基础设施层的 Google 翻译适配逻辑：
 * 1. 消息通信：确保正确地与 Chrome Background 脚本进行异步通信。
 * 2. 数据解析：验证对谷歌 API 原始多维数组响应的解析准确性。
 * 3. 错误处理：确保网络或运行时错误能够被捕获并转化为 Domain 错误。
 */

// 模拟全局 Chrome API
const mockSendMessage = vi.fn();
(globalThis as any).chrome = {
    runtime: {
        sendMessage: mockSendMessage,
        lastError: null
    }
};

describe('GoogleTranslator', () => {
    let translator: GoogleTranslator;

    beforeEach(() => {
        translator = new GoogleTranslator();
        mockSendMessage.mockReset();
        (chrome.runtime as any).lastError = null;
    });

    it('应能正确组装消息并发送给 Background 脚本', async () => {
        // 模拟 API 原始响应
        const mockResponse = {
            success: true,
            data: [
                [["hello translated", "hello", null, null, 1]],
                null,
                "en"
            ]
        };
        // 模拟消息监听器的回调行为
        mockSendMessage.mockImplementation((_msg, cb) => cb(mockResponse));

        const result = await translator.translate('hello');

        // 验证解析后的字段
        expect(result.original).toBe('hello');
        expect(result.translated).toBe('hello translated');
        expect(result.srcLang).toBe('en');
        // 验证调用的参数是否正确
        expect(mockSendMessage).toHaveBeenCalledWith(
            expect.objectContaining({ action: 'translate', text: 'hello' }),
            expect.any(Function)
        );
    });

    it('当存在详细释义时，应能正确解析词典条目', async () => {
        // 模拟包含词典条目的二进制/数组响应
        const mockResponse = {
            success: true,
            data: [
                [["apple translated", "apple", null, null, 1]],
                [
                    ["noun", ["apple", "malus pumila"], [["apple", ["noun"]]], "apple"]
                ],
                "en"
            ]
        };
        mockSendMessage.mockImplementation((_msg, cb) => cb(mockResponse));

        const result = await translator.translate('apple');

        // 验证词典解析逻辑
        expect(result.dictionary).toBeDefined();
        expect(result.dictionary![0].pos).toBe('noun');
        expect(result.dictionary![0].definitions).toContain('apple');
    });

    it('如果 Background 脚本返回失败，应抛出相应的异常', async () => {
        // 模拟网络或 API 错误
        mockSendMessage.mockImplementation((_msg, cb) => cb({ success: false, error: 'Network Error' }));

        await expect(translator.translate('fail')).rejects.toThrow('Network Error');
    });
});
