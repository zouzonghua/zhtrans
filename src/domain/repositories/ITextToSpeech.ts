/** 
 * 语音服务契约 (Interface/Port)
 */
export interface ITextToSpeech {
  speak(text: string, lang?: string): Promise<void>;
  stop(): void;
}
