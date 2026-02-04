/**
 * 翻译实体 (Domain Entity)
 * 描述业务核心数据结构，不依赖任何外部逻辑。
 */

/** 词典条目：包含词性及对应的释义列表 */
export interface DictionaryEntry {
  pos: string; // 词性
  definitions: string[]; // 释义列表
}

/** 翻译结果实体 */
export interface Translation {
  original: string;    // 源文本
  translated: string;  // 翻译文本
  phonetic?: string;   // 音标
  dictionary?: DictionaryEntry[]; // 详细释义
  srcLang: string;     // 源语种
  targetLang: string;  // 目标语种
}