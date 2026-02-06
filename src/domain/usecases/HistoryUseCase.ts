import { ITranslationRepository } from '@/domain/repositories/ITranslationRepository';
import { ITextToSpeech } from '@/domain/repositories/ITextToSpeech';
import { Translation } from '@/domain/entities/Translation';

/**
 * 历史记录业务逻辑
 * 包含：获取历史、删除历史、朗读
 */
export class HistoryUseCase {
    constructor(
        private repository: ITranslationRepository,
        private tts: ITextToSpeech
    ) { }

    async getAll(): Promise<Translation[]> {
        return this.repository.getAll();
    }

    async delete(originalText: string): Promise<void> {
        return this.repository.delete(originalText);
    }

    // 复用 TTS 逻辑，保持 domain 层纯净
    async playAudio(text: string): Promise<void> {
        this.tts.stop();
        return this.tts.speak(text);
    }

    stopAudio(): void {
        this.tts.stop();
    }
}
