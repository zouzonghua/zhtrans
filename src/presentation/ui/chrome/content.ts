import { LookupUseCase } from '@/domain/usecases/LookupUseCase';
import { GoogleTranslator } from '@/data/remote/api/GoogleTranslator';
import { WebSpeechService } from '@/data/local/tts/WebSpeechService';
import { ChromeTranslationRepository } from '@/data/repository/ChromeTranslationRepository';
import { mountLookupUI } from '@/presentation/ui/content/mount';

/**
 * 插件入口点 (Main / Composition Root) - Content Script
 * 
 * 运行环境: 宿主网页 (Host Page)
 * 职责: 
 * 1. 负责依赖注入 (Dependency Injection)
 * 2. 负责构建 UI 隔离环境 (Shadow DOM via mountLookupUI)
 * 3. 将插件功能注入到当前浏览的网页中
 */

// 1. 初始化依赖 (Dependency Injection)
// 在这里手动组装对象图 (Object Graph)，这是 Pure DI 的最佳实践
const translator = new GoogleTranslator();
const tts = new WebSpeechService();
const repository = new ChromeTranslationRepository();
const useCase = new LookupUseCase(translator, tts, repository);

// 2. 初始化 UI (Preact)
// Content Script 需要 mountLookupUI 来创建 Shadow DOM，防止宿主网页的 CSS 污染我们的组件
mountLookupUI(useCase);

