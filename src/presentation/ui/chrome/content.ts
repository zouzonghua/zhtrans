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
const translator = new GoogleTranslator('lookup'); // 划词翻译类型
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
            // 为字幕翻译创建单独的 translator 实例，类型为 'subtitle'
            const subtitleTranslator = new GoogleTranslator('subtitle');
            const subtitleUseCase = new TranslateSubtitleUseCase(subtitleTranslator, repository);
            mountYoutubeSubtitleUI(subtitleUseCase);
        });
    });
}

const teamsHosts = ['teams.microsoft.com', 'teams.cloud.microsoft', 'teams.live.com'];
const isTeamsWeb = teamsHosts.some((host) =>
    window.location.hostname === host || window.location.hostname.endsWith(`.${host}`)
);

if (isTeamsWeb) {
    Promise.all([
        import('@/presentation/ui/content/teams/mount'),
        import('@/domain/usecases/TranslateSubtitleUseCase'),
    ]).then(([{ mountTeamsSubtitleUI }, { TranslateSubtitleUseCase }]) => {
        const subtitleTranslator = new GoogleTranslator('subtitle');
        // Teams 会议字幕可能包含敏感内容，MVP 仅使用内存缓存，不写入翻译历史。
        const subtitleUseCase = new TranslateSubtitleUseCase(subtitleTranslator);
        mountTeamsSubtitleUI(subtitleUseCase);
    });
}


