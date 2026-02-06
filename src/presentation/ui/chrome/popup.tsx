import { render } from 'preact';
import { HistoryApp } from '@/presentation/ui/popup/HistoryApp';
import { ChromeTranslationRepository } from '@/data/repository/ChromeTranslationRepository';
import { WebSpeechService } from '@/data/local/tts/WebSpeechService';
import { HistoryUseCase } from '@/domain/usecases/HistoryUseCase';

// Composition Root - Extension Popup
// 运行环境: 扩展程序独立页面 (Extension Context)
// 特点: 拥有独立的 DOM 环境，不需要 Shadow DOM 隔离
const root = document.getElementById('app');
if (root) {
    // 1. 初始化依赖 (Dependency Injection) - 与 content.ts 保持这一致的组装逻辑
    const repository = new ChromeTranslationRepository();
    const tts = new WebSpeechService();
    const useCase = new HistoryUseCase(repository, tts);

    // 2. 注入依赖 (Inject)
    // 直接渲染即可，无需 initUI，因为这是我们就自己的地盘
    render(<HistoryApp useCase={useCase} />, root);
}
