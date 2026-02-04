import { LookupUseCase } from '@/application/usecases/LookupUseCase';
import { GoogleTranslator } from '@/infrastructure/services/GoogleTranslator';
import { WebSpeechService } from '@/infrastructure/services/WebSpeechService';
import { ChromeTranslationRepository } from '@/infrastructure/repositories/ChromeTranslationRepository';
import { initUI } from '@/presentation/index';

/**
 * 插件入口点 (Main / Composition Root)
 * 负责依赖注入、对象组装以及将各模块绑定到 DOM 事件。
 */

// 1. 初始化依赖 (Dependency Injection)
const translator = new GoogleTranslator();
const tts = new WebSpeechService();
const repository = new ChromeTranslationRepository();
const useCase = new LookupUseCase(translator, tts, repository);

// 2. 初始化 UI (Preact)
initUI(useCase);

