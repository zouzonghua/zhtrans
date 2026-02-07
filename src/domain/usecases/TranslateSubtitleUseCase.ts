import { ITranslator } from '@/domain/repositories/ITranslator';
import { ITranslationRepository } from '@/domain/repositories/ITranslationRepository';
import { Translation } from '@/domain/entities/Translation';

/**
 * 字幕翻译结果（包含缓存命中状态）
 */
export interface SubtitleTranslationResult {
    translation: Translation;
    fromCache: boolean;  // 是否命中缓存（内存或持久化）
}

/**
 * 字幕翻译用例
 * 
 * 专为实时字幕场景优化的翻译逻辑。
 * 特性：
 * 1. 内存缓存 (Memory Cache): 极速响应重复的字幕 (如歌词、口头禅)。
 * 2. 持久化缓存 (Repo): 利用已有的查词记录。
 * 3. 缓存命中指示：返回 fromCache 标志，用于 UI 显示绿色指示器。
 */
export class TranslateSubtitleUseCase {
    // 内存缓存：使用 Map 实现 O(1) 查找，根据 key (原文) 获取 value (译文)
    private memoryCache = new Map<string, Translation>();

    constructor(
        private translator: ITranslator,
        private repository?: ITranslationRepository
    ) { }

    async execute(text: string): Promise<SubtitleTranslationResult> {
        const trimmedText = text.trim();
        if (!trimmedText) {
            throw new Error('Text to translate is empty');
        }

        // 0. 检查内存缓存 (最快，无 IO)
        if (this.memoryCache.has(trimmedText)) {
            console.log('[LinxTrans] Memory Cache Hit:', trimmedText);
            return {
                translation: this.memoryCache.get(trimmedText)!,
                fromCache: true
            };
        }

        // 1. 检查仓库/持久化缓存 (较快，可能有磁盘/IndexedDB IO)
        if (this.repository) {
            const cached = await this.repository.get(trimmedText);
            if (cached) {
                this.memoryCache.set(trimmedText, cached); // 升级到内存缓存，下次更快
                return {
                    translation: cached,
                    fromCache: true
                };
            }
        }

        // 2. 执行网络翻译 (最慢，网络 IO)
        const result = await this.translator.translate(trimmedText);

        // 3. 写入双层缓存
        this.memoryCache.set(trimmedText, result);
        if (this.repository) {
            await this.repository.save(result);
        }

        return {
            translation: result,
            fromCache: false
        };
    }
}
