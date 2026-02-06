import { ITextToSpeech } from '@/domain/repositories/ITextToSpeech';

/**
 * 朗读用例 (Use Case)
 * 专门负责文本朗读逻辑，遵循 SRP 原则。
 */
export class SpeakTextUseCase {
    constructor(private tts: ITextToSpeech) { }

    /**
     * 朗读文本
     * 会自动停止当前正在播放的音频
     */
    async execute(text: string): Promise<void> {
        this.tts.stop();
        return this.tts.speak(text);
    }

    /**
     * 停止朗读
     */
    stop(): void {
        this.tts.stop();
    }
}
