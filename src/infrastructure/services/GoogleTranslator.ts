import { Translation, DictionaryEntry } from '@/domain/entities/Translation';
import { ITranslator } from '@/domain/interfaces/ITranslator';

/**
 * 谷歌翻译适配器 (Infrastructure Layer)
 * 
 * 职责：
 * 1. 实现 Domain 层定义的 ITranslator 接口。
 * 2. 处理与外部 Google Translate API 的具体通信细节。
 * 3. 负责将外部原始、复杂的 JSON 结构解析为 Domain 层通用的实体。
 */
export class GoogleTranslator implements ITranslator {
  async translate(text: string): Promise<Translation> {
    const isChinese = /[\u4e00-\u9fa5]/.test(text);
    const targetLang = isChinese ? 'en' : 'zh-CN';
    const TRANSLATE_TIMEOUT_MS = 8000;

    if (typeof chrome === 'undefined' || !chrome.runtime) {
      throw new Error("Extension context invalidated. Please refresh the page.");
    }

    return new Promise((resolve, reject) => {
      let settled = false;
      const finalizeReject = (error: Error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        reject(error);
      };
      const finalizeResolve = (value: Translation) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        resolve(value);
      };
      const timeoutId = setTimeout(() => {
        finalizeReject(new Error('Translation timed out.'));
      }, TRANSLATE_TIMEOUT_MS);

      chrome.runtime.sendMessage({ action: "translate", text, targetLang }, (response) => {
        if (settled) return;
        if (chrome.runtime.lastError) {
          return finalizeReject(new Error(chrome.runtime.lastError.message));
        }

        if (!response) {
          return finalizeReject(new Error('No response from background script.'));
        }

        if (!response.success) {
          return finalizeReject(new Error(response.error || 'Translation failed.'));
        }

        try {
          const { data } = response;
          if (!Array.isArray(data) || !Array.isArray(data[0])) {
            throw new Error('Unexpected translation response.');
          }

          // --- 数据解析 (Adapter Logic) ---

          // 1. 提取基本翻译结果 (支持多段合并)
          const translation = data[0].map((item: any) => item[0]).join('').trim();

          // 2. 智能提取读音 (Phonetic / Transliteration)
          let phonetic = undefined;
          const sentenceData = data[0];
          // 读音通常在第一个数组的最后一项，且特征是 item[1] 为 null (区别于翻译段落)
          const lastItem = sentenceData[sentenceData.length - 1];

          if (Array.isArray(lastItem) && lastItem[1] === null) {
            // 策略：始终优先显示英文音标
            if (targetLang === 'en') {
              // 译文是英文 -> 取目标语读音 (Index 0)
              phonetic = lastItem[0];
            } else {
              // 原文是英文 -> 取源语读音 (Index 3)
              phonetic = lastItem[3];
            }

            // Fallback: 如果首选语言没有音标，尝试获取存在的那个 (比如 index 3 没数据单 index 2/0 有)
            if (!phonetic) {
              phonetic = lastItem[3] || lastItem[2] || lastItem[0];
            }
          }

          // 3. 提取词典条目 (只有单个单词才会有此字段)
          let dictionary: DictionaryEntry[] = [];
          if (data[1] && Array.isArray(data[1])) {
            dictionary = data[1].map((entry: any) => ({
              pos: entry[0],
              definitions: Array.isArray(entry[1]) ? entry[1].slice(0, 3) : []
            }));
          }

          finalizeResolve({
            original: text,
            translated: translation,
            phonetic: typeof phonetic === 'string' ? phonetic : undefined,
            dictionary: dictionary.length > 0 ? dictionary : undefined,
            srcLang: data[2],
            targetLang
          });
        } catch (error) {
          finalizeReject(error instanceof Error ? error : new Error('Unexpected translation response.'));
        }
      });
    });
  }
}
