import { ITranslationRepository } from '@/domain/repositories/ITranslationRepository';
import { Translation, TranslationType } from '@/domain/entities/Translation';

/**
 * 历史记录用例(Use Case)
 * 包含：获取历史、删除历史、分页查询
 */
export class HistoryUseCase {
    constructor(
        private repository: ITranslationRepository
    ) { }

    async getAll(): Promise<Translation[]> {
        return this.repository.getAll();
    }

    /**
     * 分页获取历史记录（性能优化）
     * @param offset 偏移量
     * @param limit 每页数量
     * @param type 类型过滤（可选）
     */
    async getPage(
        offset: number = 0,
        limit: number = 50,
        type?: TranslationType
    ): Promise<Translation[]> {
        return this.repository.getPage(offset, limit, type);
    }

    /**
     * 获取历史记录总数
     * @param type 类型过滤（可选）
     */
    async getCount(type?: TranslationType): Promise<number> {
        return this.repository.getCount(type);
    }

    async delete(originalText: string): Promise<void> {
        return this.repository.delete(originalText);
    }
}
