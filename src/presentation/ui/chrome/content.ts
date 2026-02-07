import { LookupUseCase } from '@/domain/usecases/LookupUseCase';
import { GoogleTranslator } from '@/data/remote/api/GoogleTranslator';
import { WebSpeechService } from '@/data/local/tts/WebSpeechService';
import { ChromeTranslationRepository } from '@/data/repository/ChromeTranslationRepository';
import { mountLookupUI } from '@/presentation/ui/content/lookup/mount';

/**
 * 插件入口点 (Main / Composition Root) - Content Script
 * 
 * 运行环境: 宿主网页 (Host Page)
 * 职责: 
 * 1. 负责依赖注入 (Dependency Injection)
 * 2. 负责构建 UI 隔离环境 (Shadow DOM via mountLookupUI)
 * 3. 将插件功能注入到当前浏览的网页中
 */

import { SpeakTextUseCase } from '@/domain/usecases/SpeakTextUseCase';

// 1. 初始化依赖 (Dependency Injection)
// 在这里手动组装对象图 (Object Graph)，这是 Pure DI 的最佳实践
const translator = new GoogleTranslator();
const repository = new ChromeTranslationRepository();
const tts = new WebSpeechService();
const useCase = new LookupUseCase(translator, repository);
const speakUseCase = new SpeakTextUseCase(tts);

// 2. 初始化 UI (Preact)
// Content Script 需要 mountLookupUI 来创建 Shadow DOM，防止宿主网页的 CSS 污染我们的组件
mountLookupUI(useCase, speakUseCase);

// // 3. 初始化 YouTube 字幕功能 (仅在 YouTube 页面生效)
if (window.location.hostname.includes('youtube.com')) {
    // 动态导入以通过代码分割优化性能 (可选，此处直接引用即可)
    import('@/presentation/ui/content/youtube/mount').then(({ mountYoutubeSubtitleUI }) => {
        import('@/domain/usecases/TranslateSubtitleUseCase').then(({ TranslateSubtitleUseCase }) => {
            const subtitleUseCase = new TranslateSubtitleUseCase(translator); // Reuse translator? Yes. No repo needed?
            // TODO: Add separate repo if caching is needed, or reuse ChromeTranslationRepository if keys don't collide.
            // Keys in ChromeTranslationRepository are just strings. It might collide if logic is same.
            // Let's pass undefined for repo for now (Real-time usually doesn't cache persistently or uses strict keys)
            // Or create a new repository instance if needed.
            mountYoutubeSubtitleUI(subtitleUseCase);
        });
    });
}

