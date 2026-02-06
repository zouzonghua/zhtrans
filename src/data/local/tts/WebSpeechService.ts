import { ITextToSpeech } from '@/domain/repositories/ITextToSpeech';

/**
 * 浏览器原生语音服务适配器 (Infrastructure Layer)
 * 
 * 职责：
 * 1. 实现 Domain 层的 ITextToSpeech 接口。
 * 2. 封装浏览器原生的 window.speechSynthesis API。
 * 3. 处理语音播放的异步状态和错误回调。
 */
export class WebSpeechService implements ITextToSpeech {
  /**
   * 播放指定文本
   * @param text 要朗读的文本
   * @param lang (可选) 语言代码，如 'en-US'
   */
  speak(text: string, lang?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // 创建语音合成实例
      const utterance = new SpeechSynthesisUtterance(text);
      if (lang) utterance.lang = lang;
      
      // 绑定生命周期事件
      utterance.onend = () => resolve();
      utterance.onerror = (e) => reject(e);
      
      // 调用浏览器 API
      window.speechSynthesis.speak(utterance);
    });
  }

  /**
   * 立即停止当前播放和播放队列
   */
  stop(): void {
    window.speechSynthesis.cancel();
  }
}
