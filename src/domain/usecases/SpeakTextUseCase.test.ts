import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SpeakTextUseCase } from './SpeakTextUseCase';
import { ITextToSpeech } from '@/domain/repositories/ITextToSpeech';

/**
 * SpeakTextUseCase 单元测试
 * 
 * 验证核心功能：
 * 1. 朗读功能：确保先停止当前音频再播放新音频。
 * 2. 停止功能：确保能正确停止音频播放。
 */
describe('SpeakTextUseCase', () => {
    let mockTTS: ITextToSpeech;
    let useCase: SpeakTextUseCase;

    beforeEach(() => {
        // 模拟 TTS 服务
        mockTTS = {
            speak: vi.fn(),
            stop: vi.fn()
        };

        // 实例化被测用例
        useCase = new SpeakTextUseCase(mockTTS);
    });

    it('execute 方法应先停止当前音频，再开始朗读新文本', async () => {
        const text = 'Hello world';

        await useCase.execute(text);

        // 验证调用顺序：先 stop 后 speak
        expect(mockTTS.stop).toHaveBeenCalled();
        expect(mockTTS.speak).toHaveBeenCalledWith(text);
    });

    it('stop 方法应调用 TTS 服务的 stop 方法', () => {
        useCase.stop();

        expect(mockTTS.stop).toHaveBeenCalled();
    });
});
