import { ITranslator } from '@/domain/interfaces/ITranslator';
import { ITextToSpeech } from '@/domain/interfaces/ITextToSpeech';

/**
 * 查词用例 (Use Case)
 * 封装了“查词”这一核心业务逻辑。
 */
export class LookupUseCase {
  constructor(
    private translator: ITranslator,
    private tts: ITextToSpeech
  ) {}

  async execute(text: string) {
    if (!text || text.trim().length === 0) {
      throw new Error("Text is empty");
    }
    
    // 执行翻译
    const result = await this.translator.translate(text);
    
    // --- 业务逻辑：决定展示标题 ---
    // 在整洁架构中，这种根据状态决定展示文案的逻辑应放在用例层或领域层
    const isChinese = /[\u4e00-\u9fa5]/.test(result.original);
    result.displayTitle = isChinese ? "中文-英文" : "简体中文-英文";

    return result;
  }

  playAudio(text: string) {
    this.tts.stop();
    this.tts.speak(text);
  }

  stopAudio() {
    this.tts.stop();
  }
}
