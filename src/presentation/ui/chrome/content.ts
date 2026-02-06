import { LookupUseCase } from '@/domain/usecases/LookupUseCase';
import { GoogleTranslator } from '@/data/remote/api/GoogleTranslator';
import { WebSpeechService } from '@/data/local/tts/WebSpeechService';
import { ChromeTranslationRepository } from '@/data/repository/ChromeTranslationRepository';
import { initUI } from '@/presentation/ui/common/index';

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

