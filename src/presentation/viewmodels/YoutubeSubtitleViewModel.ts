import { TranslateSubtitleUseCase } from '@/domain/usecases/TranslateSubtitleUseCase';
import { CaptionObserver } from '@/presentation/ui/content/youtube/observer/CaptionObserver';

export interface SubtitleState {
    originalText: string;
    translatedText: string;
    isLoading: boolean;
    error: string | null;
    isVisible: boolean;
    cacheHit: boolean;  // 是否命中缓存（用于显示绿色指示器）
}

type Listener = (state: SubtitleState) => void;

/**
 * YouTube 字幕 ViewModel
 * 
 * 职责：
 * 1. 状态管理：维护字幕的原文、译文、加载状态等。
 * 2. 逻辑协调：连接 CaptionObserver (数据源) 和 TranslateSubtitleUseCase (业务逻辑)。
 * 3. 性能优化：处理翻译请求的防抖 (Debounce)。
 */
export class YoutubeSubtitleViewModel {
    private state: SubtitleState = {
        originalText: '',
        translatedText: '',
        isLoading: false,
        error: null,
        isVisible: false,
        cacheHit: false,
    };

    private listeners: Listener[] = [];
    private observer: CaptionObserver;
    private debounceTimer: NodeJS.Timeout | null = null;

    constructor(private useCase: TranslateSubtitleUseCase) {
        // 初始化观察者，并在回调中处理文本变化
        this.observer = new CaptionObserver(this.handleTextChange);
    }

    /**
     * 初始化：开始监听字幕并显示 UI
     */
    public init() {
        this.observer.start();
        this.setState({ isVisible: true });
    }

    /**
     * 销毁：停止监听并隐藏 UI
     */
    public dispose() {
        this.observer.stop();
        this.setState({ isVisible: false });
    }

    /**
     * 订阅状态变化 (MVVM Binding)
     */
    public subscribe(listener: Listener): () => void {
        this.listeners.push(listener);
        listener(this.state); // Initial emission
        return () => {
            this.listeners = this.listeners.filter((l) => l !== listener);
        };
    }

    public getState(): SubtitleState {
        return this.state;
    }

    private setState(partial: Partial<SubtitleState>) {
        this.state = { ...this.state, ...partial };
        this.notify();
    }

    private notify() {
        this.listeners.forEach((listener) => listener(this.state));
    }

    private hideTimer: NodeJS.Timeout | null = null;

    /**
     * 处理字幕文本变化 (核心逻辑)
     */
    private handleTextChange = (text: string) => {
        // 1. 如果有新的文本到来 (非空)
        if (text.trim()) {
            // 清除之前的隐藏定时器，保持显示
            if (this.hideTimer) {
                clearTimeout(this.hideTimer);
                this.hideTimer = null;
            }

            // 优化：处理长文本，避免字幕遮挡屏幕
            // 如果文本超过 100 字符，只保留最后一部分（尽量按单词切分）
            let processedText = text;
            if (processedText.length > 100) {
                const suffix = processedText.slice(-100);
                const firstSpace = suffix.indexOf(' ');
                // 如果前 20 个字符内有空格，就从空格后开始截取，避免切断单词
                if (firstSpace !== -1 && firstSpace < 20) {
                    processedText = '...' + suffix.slice(firstSpace + 1);
                } else {
                    processedText = '...' + suffix;
                }
            }

            // 立即更新原文，保证 UI 响应速度
            this.setState({ originalText: processedText });

            // 防抖处理 (Debounce)
            // 避免因字幕频繁微调或快速变化导致发送过多网络请求
            if (this.debounceTimer) {
                clearTimeout(this.debounceTimer);
            }

            this.setState({ isLoading: true });

            // 100ms 延迟：在人类感知不到的延迟内，合并快速变化的文本事件
            this.debounceTimer = setTimeout(() => {
                // console.log('[zhTrans] Performing translation for:', processedText);
                this.performTranslation(processedText);
            }, 100); // 100ms debounce (Optimized for real-time)
        } else {
            // 2. 如果文本为空 (字幕消失)
            // 不要立即清空，而是延迟 3 秒，给用户更多阅读时间
            if (this.hideTimer) {
                clearTimeout(this.hideTimer);
            }

            this.hideTimer = setTimeout(() => {
                this.setState({
                    originalText: '',
                    translatedText: ''
                });
                this.hideTimer = null;
            }, 3000); // 3秒延迟 (UX 优化)
        }
    };

    /**
     * 执行翻译业务逻辑
     */
    private async performTranslation(text: string) {
        try {
            const result = await this.useCase.execute(text);
            console.log('[zhTrans] Translation result:', result.translation.translated, 'fromCache:', result.fromCache);

            // 更新译文和缓存命中状态
            this.setState({
                translatedText: result.translation.translated,
                isLoading: false,
                error: null,
                cacheHit: result.fromCache
            });
        } catch (error) {
            console.error('[zhTrans] Translation failed:', error);
            this.setState({
                error: (error as Error).message,
                isLoading: false,
                cacheHit: false
            });
        }
    }
}
