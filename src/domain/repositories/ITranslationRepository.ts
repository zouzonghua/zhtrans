import { Translation, TranslationType } from '@/domain/entities/Translation';

/**
 * 翻译仓库接口 (Repository Port)
 * 
 * 职责：
 * 1. 定义翻译结果的持久化行为。
 * 2. 隐藏数据存储的具体实现细节。
 */
export interface ITranslationRepository {
    /**
     * 根据原始内容搜索缓存的翻译
     * @param text 搜索文本
     */
    get(text: string): Promise<Translation | null>;

    /**
     * 保存翻译结果到缓存
     * @param translation 翻译实体
     */
    save(translation: Translation): Promise<void>;

    /**
     * 清除指定文本的缓存
     */
    delete(text: string): Promise<void>;

    /**
     * 清除所有缓存
     */
    clear(): Promise<void>;

    /**
     * 获取所有缓存的翻译
     */
    getAll(): Promise<Translation[]>;

    /**
     * 分页获取翻译列表（性能优化）
     * @param offset 偏移量（从 0 开始）
     * @param limit 每页数量
     * @param type 类型过滤（可选）
     */
    getPage(offset: number, limit: number, type?: TranslationType): Promise<Translation[]>;

    /**
     * 获取翻译总数（用于分页计算）
     * @param type 类型过滤（可选）
     */
    getCount(type?: TranslationType): Promise<number>;
}
