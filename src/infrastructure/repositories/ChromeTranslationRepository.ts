import { Translation } from '@/domain/entities/Translation';
import { ITranslationRepository } from '@/domain/interfaces/ITranslationRepository';

/**
 * Chrome Storage 翻译仓库实现 (Infrastructure Adapter)
 * 
 * 使用 chrome.storage.local 实现轻量级持久化缓存。
 */
export class ChromeTranslationRepository implements ITranslationRepository {
    private readonly STORAGE_KEY_PREFIX = 'cache_';

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
        return new Promise((resolve, reject) => {
            chrome.storage.local.set({ [key]: translation }, () => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve();
                }
            });
        });
    }

    async delete(text: string): Promise<void> {
        const key = this.getCacheKey(text);
        return new Promise((resolve, reject) => {
            chrome.storage.local.remove([key], () => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve();
                }
            });
        });
    }

    async clear(): Promise<void> {
        return new Promise((resolve, reject) => {
            // 更加严谨：只搜索并清理带前缀的缓存 key，不影响插件的其他存储
            chrome.storage.local.get(null, (result) => {
                if (chrome.runtime.lastError) {
                    return reject(new Error(chrome.runtime.lastError.message));
                }

                const keysToRemove = Object.keys(result).filter(key =>
                    key.startsWith(this.STORAGE_KEY_PREFIX)
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

    async getAll(): Promise<Translation[]> {
        return new Promise((resolve, reject) => {
            chrome.storage.local.get(null, (result) => {
                if (chrome.runtime.lastError) {
                    return reject(new Error(chrome.runtime.lastError.message));
                }

                const translations: Translation[] = [];
                for (const key in result) {
                    if (key.startsWith(this.STORAGE_KEY_PREFIX)) {
                        translations.push(result[key] as Translation);
                    }
                }
                // 按时间倒序排序 (新 -> 旧)
                translations.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
                resolve(translations);
            });
        });
    }
}
