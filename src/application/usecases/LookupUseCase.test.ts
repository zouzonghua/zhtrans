import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LookupUseCase } from './LookupUseCase';
import { ITranslator } from '@/domain/interfaces/ITranslator';
import { ITextToSpeech } from '@/domain/interfaces/ITextToSpeech';
import { ITranslationRepository } from '@/domain/interfaces/ITranslationRepository';
import { Translation } from '@/domain/entities/Translation';

/**
 * LookupUseCase 单元测试
 * 
 * 验证查词核心业务逻辑：
 * 1. 缓存优先：如果仓库已有缓存，则直接返回。
 * 2. 翻译备份：如果缓存未击中，则调用翻译引擎并保存结果。
 * 3. 输入校验：确保非法输入会被拦截。
 * 4. 语音集成：确保正确调用 TTS 服务。
 */
describe('LookupUseCase', () => {
    let mockTranslator: ITranslator;
    let mockTTS: ITextToSpeech;
    let mockRepository: ITranslationRepository;
    let useCase: LookupUseCase;

    // 模拟翻译数据
    const sampleTranslation: Translation = {
        original: 'hello',
        translated: '你好',
        srcLang: 'en',
        targetLang: 'zh-CN'
    };

    beforeEach(() => {
        // 初始化 Mock 对象
        mockTranslator = {
            translate: vi.fn().mockResolvedValue(sampleTranslation)
        };
        mockTTS = {
            speak: vi.fn().mockResolvedValue(undefined),
            stop: vi.fn()
        };
        mockRepository = {
            get: vi.fn().mockResolvedValue(null),
            save: vi.fn().mockResolvedValue(undefined),
            delete: vi.fn(),
            clear: vi.fn()
        };
        // 实例化被测对象
        useCase = new LookupUseCase(mockTranslator, mockTTS, mockRepository);
    });

    it('如果仓库中存在缓存，应直接返回缓存结果', async () => {
        // 准备：模拟仓库返回已有数据
        mockRepository.get = vi.fn().mockResolvedValue(sampleTranslation);

        const result = await useCase.execute('hello');

        // 验证
        expect(result).toEqual(sampleTranslation);
        expect(mockRepository.get).toHaveBeenCalledWith('hello');
        // 关键点：不应调用远程翻译引擎
        expect(mockTranslator.translate).not.toHaveBeenCalled();
    });

    it('如果缓存未击中，应调用翻译服务并保存结果到仓库', async () => {
        const result = await useCase.execute('hello');

        // 验证
        expect(result).toEqual(sampleTranslation);
        expect(mockTranslator.translate).toHaveBeenCalledWith('hello');
        // 关键点：翻译结果应同步到缓存仓库
        expect(mockRepository.save).toHaveBeenCalledWith(sampleTranslation);
    });

    it('如果输入文本为空或仅包含空格，应抛出错误', async () => {
        // 验证：拦截无效输入
        await expect(useCase.execute('')).rejects.toThrow('Text is empty');
        await expect(useCase.execute('   ')).rejects.toThrow('Text is empty');
    });

    it('应能够正确调用语音合成服务播放音频', async () => {
        await useCase.playAudio('hello');

        // 验证
        expect(mockTTS.stop).toHaveBeenCalled();
        expect(mockTTS.speak).toHaveBeenCalledWith('hello');
    });
});

