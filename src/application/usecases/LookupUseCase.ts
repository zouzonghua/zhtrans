import { ITranslator } from '@/domain/interfaces/ITranslator';
import { ITextToSpeech } from '@/domain/interfaces/ITextToSpeech';
import { ITranslationRepository } from '@/domain/interfaces/ITranslationRepository';

/**
 * 查词用例 (Use Case)
 * 封装了“查词”这一核心业务逻辑。
 */
export class LookupUseCase {
  constructor(
    private translator: ITranslator,
    private tts: ITextToSpeech,
    private repository?: ITranslationRepository // 选填，支持无缓存模式
  ) { }

  async execute(text: string) {
    if (!text || text.trim().length === 0) {
      throw new Error("Text is empty");
    }

    const trimmedText = text.trim();

    // 1. 尝试从仓库获取缓存
    if (this.repository) {
      const cached = await this.repository.get(trimmedText);
      // console.log(`[Glimpse] Cache hit: "${trimmedText}"`);
      if (cached) {
        // console.log(`[Glimpse] Cache hit: "${trimmedText}"`);
        return cached;
      }
    }

    // 2. 缓存未击中，执行网络请求翻译
    const result = await this.translator.translate(trimmedText);
    // console.log(`[Glimpse] Cache miss: "${trimmedText}"`);

    // 4. 将结果持久化到仓库
    if (this.repository) {
      await this.repository.save(result);
    }

    return result;
  }

  async playAudio(text: string): Promise<void> {
    this.tts.stop();
    return this.tts.speak(text);
  }

  stopAudio() {
    this.tts.stop();
  }
}
