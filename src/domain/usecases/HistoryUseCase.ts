import { ITranslationRepository } from '@/domain/repositories/ITranslationRepository';
import { Translation } from '@/domain/entities/Translation';

/**
 * 历史记录用例(Use Case)
 * 包含：获取历史、删除历史
 */
export class HistoryUseCase {
    constructor(
        private repository: ITranslationRepository
    ) { }

    async getAll(): Promise<Translation[]> {
        return this.repository.getAll();
    }

    async delete(originalText: string): Promise<void> {
        return this.repository.delete(originalText);
    }
}
