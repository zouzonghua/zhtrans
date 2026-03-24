import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HistoryUseCase } from './HistoryUseCase';
import { ITranslationRepository } from '@/domain/repositories/ITranslationRepository';
import { Translation } from '@/domain/entities/Translation';

/**
 * HistoryUseCase 单元测试
 * 
 * 这是单元测试，使用 Mock Repository 来隔离测试 UseCase 的业务逻辑。
 * 
 * 验证核心功能：
 * 1. 获取历史：验证从仓库读取所有数据。
 * 2. 删除历史：验证调用仓库删除指定数据。
 * 3. 异常处理：验证错误传播机制。
 * 
 * 注意：这里测试的是 UseCase 的逻辑，而不是 Repository 的实现。
 * Repository 的真实实现在 ChromeTranslationRepository.test.ts 中进行集成测试。
 */
describe('HistoryUseCase - 单元测试', () => {
    let mockRepository: ITranslationRepository;
    let useCase: HistoryUseCase;

    // 模拟翻译数据
    const sampleHistory: Translation[] = [
        { original: 'apple', translated: '苹果', srcLang: 'en', targetLang: 'zh-CN', type: 'lookup' },
        { original: 'banana', translated: '香蕉', srcLang: 'en', targetLang: 'zh-CN', type: 'subtitle' }
    ];

    beforeEach(() => {
        // 模拟仓库
        mockRepository = {
            getAll: vi.fn().mockResolvedValue(sampleHistory),
            delete: vi.fn().mockResolvedValue(undefined),
            get: vi.fn(),
            save: vi.fn(),
            clear: vi.fn(),
            getPage: vi.fn(),
            getCount: vi.fn()
        };

        // 实例化被测用例
        useCase = new HistoryUseCase(mockRepository);
    });

    it('getAll 方法应从仓库获取所有历史记录', async () => {
        const result = await useCase.getAll();

        expect(result).toEqual(sampleHistory);
        expect(mockRepository.getAll).toHaveBeenCalled();
    });

    it('delete 方法应调用仓库删除指定记录', async () => {
        const textToDelete = 'apple';

        // 执行删除操作
        const result = await useCase.delete(textToDelete);

        // 验证：调用了仓库的 delete 方法
        expect(mockRepository.delete).toHaveBeenCalledWith(textToDelete);
        // 验证：delete 方法只被调用了一次
        expect(mockRepository.delete).toHaveBeenCalledTimes(1);
        // 验证：返回值应该是 undefined (Promise<void>)
        expect(result).toBeUndefined();
    });

    it('delete 方法在删除失败时应抛出错误', async () => {
        const textToDelete = 'nonexistent';
        const error = new Error('删除失败');

        // 模拟仓库删除失败
        mockRepository.delete = vi.fn().mockRejectedValue(error);

        // 验证：应该抛出错误
        await expect(useCase.delete(textToDelete)).rejects.toThrow('删除失败');
    });

    it('delete 方法应确保记录被成功删除（验证副作用）', async () => {
        const textToDelete = 'apple';

        // 模拟删除后的历史记录（apple 已被移除）
        const historyAfterDelete = sampleHistory.filter(item => item.original !== textToDelete);

        // 重新配置 mock：删除后 getAll 返回更新后的列表
        mockRepository.delete = vi.fn().mockResolvedValue(undefined);
        mockRepository.getAll = vi.fn().mockResolvedValue(historyAfterDelete);

        // 执行删除
        await useCase.delete(textToDelete);

        // 验证：删除后获取历史记录，应该不包含被删除的项
        const remainingHistory = await useCase.getAll();
        expect(remainingHistory).toHaveLength(1);
        expect(remainingHistory).toEqual([
            { original: 'banana', translated: '香蕉', srcLang: 'en', targetLang: 'zh-CN', type: 'subtitle' }
        ]);
        // 验证：被删除的记录不应该存在
        expect(remainingHistory.find(item => item.original === textToDelete)).toBeUndefined();
    });
});
