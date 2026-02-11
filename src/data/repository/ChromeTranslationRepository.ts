import { Translation, TranslationType } from '@/domain/entities/Translation';
import { ITranslationRepository } from '@/domain/repositories/ITranslationRepository';

/**
 * 翻译索引项（轻量级元数据）
 */
interface TranslationIndex {
    key: string;           // Storage key
    timestamp: number;     // 时间戳
    type: TranslationType; // 类型（lookup/subtitle）
}

/**
 * Chrome Storage 翻译仓库实现 (Infrastructure Adapter)
 * 
 * 使用 chrome.storage.local 实现轻量级持久化缓存。
 * 性能优化：维护索引以支持高效的分页查询。
 */
export class ChromeTranslationRepository implements ITranslationRepository {
    private readonly STORAGE_KEY_PREFIX = 'cache_';
    private readonly INDEX_KEY = 'translation_index';

    /**
     * 获取翻译索引（轻量级元数据）
     */
    private async getIndex(): Promise<TranslationIndex[]> {
        return new Promise((resolve) => {
            chrome.storage.local.get([this.INDEX_KEY], (result) => {
                if (chrome.runtime.lastError || !result[this.INDEX_KEY]) {
                    console.log('[Repository] 📋 索引不存在，返回空数组');
                    resolve([]);
                } else {
                    const index = result[this.INDEX_KEY] as TranslationIndex[];
                    console.log(`[Repository] 📋 读取索引成功，共 ${index.length} 条记录`);
                    resolve(index);
                }
            });
        });
    }

    /**
     * 更新索引（添加或更新单个条目）
     */
    private async updateIndex(translation: Translation): Promise<void> {
        const index = await this.getIndex();
        const key = this.getCacheKey(translation.original);

        // 移除旧索引项（如果存在）
        const filtered = index.filter(item => item.key !== key);
        const isUpdate = filtered.length < index.length;

        // 添加新索引项
        filtered.push({
            key,
            timestamp: translation.timestamp || Date.now(),
            type: translation.type
        });

        // 按时间倒序排序
        filtered.sort((a, b) => b.timestamp - a.timestamp);

        console.log(`[Repository] 💾 ${isUpdate ? '更新' : '新增'}索引项: ${translation.original.substring(0, 20)}... (总数: ${filtered.length})`);

        // 保存索引
        return new Promise((resolve, reject) => {
            chrome.storage.local.set({ [this.INDEX_KEY]: filtered }, () => {
                if (chrome.runtime.lastError) {
                    console.error('[Repository] ❌ 保存索引失败:', chrome.runtime.lastError);
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve();
                }
            });
        });
    }

    /**
     * 从索引中删除条目
     */
    private async removeFromIndex(key: string): Promise<void> {
        const index = await this.getIndex();
        const filtered = index.filter(item => item.key !== key);

        return new Promise((resolve, reject) => {
            chrome.storage.local.set({ [this.INDEX_KEY]: filtered }, () => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve();
                }
            });
        });
    }

    async get(text: string): Promise<Translation | null> {
        const key = this.getCacheKey(text);
        return new Promise((resolve) => {
            chrome.storage.local.get([key], (result) => {
                if (chrome.runtime.lastError || !result[key]) {
                    resolve(null);
                } else {
                    resolve(result[key] as Translation);
                }
            });
        });
    }

    async save(translation: Translation): Promise<void> {
        if (!translation.timestamp) {
            translation.timestamp = Date.now();
        }
        const key = this.getCacheKey(translation.original);

        // 保存数据
        await new Promise<void>((resolve, reject) => {
            chrome.storage.local.set({ [key]: translation }, () => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve();
                }
            });
        });

        // 更新索引
        await this.updateIndex(translation);
    }

    async delete(text: string): Promise<void> {
        const key = this.getCacheKey(text);

        // 删除数据
        await new Promise<void>((resolve, reject) => {
            chrome.storage.local.remove([key], () => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve();
                }
            });
        });

        // 从索引中删除
        await this.removeFromIndex(key);
    }

    async clear(): Promise<void> {
        return new Promise((resolve, reject) => {
            // 搜索并清理带前缀的缓存 key，不影响插件的其他存储
            chrome.storage.local.get(null, (result) => {
                if (chrome.runtime.lastError) {
                    return reject(new Error(chrome.runtime.lastError.message));
                }

                const keysToRemove = Object.keys(result).filter(key =>
                    key.startsWith(this.STORAGE_KEY_PREFIX) || key === this.INDEX_KEY
                );

                if (keysToRemove.length === 0) {
                    return resolve();
                }

                chrome.storage.local.remove(keysToRemove, () => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                    } else {
                        resolve();
                    }
                });
            });
        });
    }

    private getCacheKey(text: string): string {
        // 简单打平文本作为 key，实际可考虑混淆或哈希
        return this.STORAGE_KEY_PREFIX + text.trim().toLowerCase();
    }

    /**
     * 分页获取翻译列表（性能优化）
     * @param offset 偏移量
     * @param limit 每页数量
     * @param type 类型过滤（可选）
     */
    async getPage(
        offset: number = 0,
        limit: number = 50,
        type?: TranslationType
    ): Promise<Translation[]> {
        console.log(`[Repository] 📖 开始分页查询: offset=${offset}, limit=${limit}, type=${type || 'all'}`);

        // 1. 读取索引（轻量级）
        let index = await this.getIndex();

        // 如果索引为空但有数据，触发迁移
        if (index.length === 0) {
            console.log('[Repository] ⚠️ 索引为空，检查是否需要迁移数据...');
            await this.migrateToIndex();
            index = await this.getIndex();
        }

        // 2. 类型过滤（在索引层面）
        if (type) {
            const beforeFilter = index.length;
            index = index.filter(item => item.type === type);
            console.log(`[Repository] 🔍 类型过滤 (${type}): ${beforeFilter} → ${index.length} 条`);
        }

        // 3. 分页切片
        const pageIndex = index.slice(offset, offset + limit);
        console.log(`[Repository] 📄 分页切片: 从 ${offset} 取 ${limit} 条，实际获取 ${pageIndex.length} 条`);

        // 4. 批量读取实际数据
        const keys = pageIndex.map(item => item.key);
        if (keys.length === 0) {
            console.log('[Repository] ✅ 无数据返回');
            return [];
        }

        return new Promise((resolve, reject) => {
            chrome.storage.local.get(keys, (result) => {
                if (chrome.runtime.lastError) {
                    console.error('[Repository] ❌ 批量读取数据失败:', chrome.runtime.lastError);
                    return reject(new Error(chrome.runtime.lastError.message));
                }

                const translations = keys
                    .map(key => result[key] as Translation)
                    .filter(Boolean); // 过滤掉可能不存在的数据

                console.log(`[Repository] ✅ 成功读取 ${translations.length} 条翻译数据`);
                resolve(translations);
            });
        });
    }

    /**
     * 获取翻译总数（用于分页计算）
     * @param type 类型过滤（可选）
     */
    async getCount(type?: TranslationType): Promise<number> {
        let index = await this.getIndex();
        if (type) {
            index = index.filter(item => item.type === type);
        }
        return index.length;
    }

    /**
     * 数据迁移：为现有数据构建索引
     */
    private async migrateToIndex(): Promise<void> {
        console.log('[Repository] 🔄 开始数据迁移，构建索引...');

        return new Promise((resolve, reject) => {
            chrome.storage.local.get(null, async (result) => {
                if (chrome.runtime.lastError) {
                    console.error('[Repository] ❌ 读取所有数据失败:', chrome.runtime.lastError);
                    return reject(new Error(chrome.runtime.lastError.message));
                }

                const translations: Translation[] = [];
                for (const key in result) {
                    if (key.startsWith(this.STORAGE_KEY_PREFIX)) {
                        translations.push(result[key] as Translation);
                    }
                }

                console.log(`[Repository] 📊 发现 ${translations.length} 条历史数据，开始构建索引...`);

                if (translations.length === 0) {
                    console.log('[Repository] ℹ️ 无历史数据，跳过迁移');
                    return resolve();
                }

                // 构建索引
                const index: TranslationIndex[] = translations.map(t => ({
                    key: this.getCacheKey(t.original),
                    timestamp: t.timestamp || Date.now(),
                    type: t.type
                }));

                // 按时间倒序排序
                index.sort((a, b) => b.timestamp - a.timestamp);

                // 保存索引
                chrome.storage.local.set({ [this.INDEX_KEY]: index }, () => {
                    if (chrome.runtime.lastError) {
                        console.error('[Repository] ❌ 保存索引失败:', chrome.runtime.lastError);
                        reject(new Error(chrome.runtime.lastError.message));
                    } else {
                        console.log(`[Repository] ✅ 索引构建完成！共 ${index.length} 条记录`);
                        resolve();
                    }
                });
            });
        });
    }

    /**
     * 获取所有翻译（向后兼容）
     * 内部使用 getPage 实现
     */
    async getAll(): Promise<Translation[]> {
        console.log('[Repository] 📚 调用 getAll()');
        const count = await this.getCount();
        console.log(`[Repository] 📚 总数: ${count}，开始读取所有数据...`);
        return this.getPage(0, count);
    }
}
