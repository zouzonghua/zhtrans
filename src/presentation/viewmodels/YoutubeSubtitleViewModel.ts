import { TranslateSubtitleUseCase } from '@/domain/usecases/TranslateSubtitleUseCase';
import { CaptionObserver } from '@/presentation/ui/content/youtube/observer/CaptionObserver';

export interface SubtitleState {
    originalText: string;
    translatedText: string;
    isLoading: boolean;
    error: string | null;
    isVisible: boolean;
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

    /**
     * 处理字幕文本变化 (核心逻辑)
     */
    private handleTextChange = (text: string) => {
        // 1. 立即更新原文，保证 UI 响应速度
        this.setState({ originalText: text });

        if (!text.trim()) {
            this.setState({ translatedText: '' });
            return;
        }

        // 2. 防抖处理 (Debounce)
        // 避免因字幕频繁微调或快速变化导致发送过多网络请求
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        this.setState({ isLoading: true });

        // 100ms 延迟：在人类感知不到的延迟内，合并快速变化的文本事件
        this.debounceTimer = setTimeout(() => {
            // console.log('[LinxTrans] Performing translation for:', text);
            this.performTranslation(text);
        }, 100); // 100ms debounce (Optimized for real-time)
    };

    /**
     * 执行翻译业务逻辑
     */
    private async performTranslation(text: string) {
        try {
            const result = await this.useCase.execute(text);
            console.log('[LinxTrans] Translation result:', result.translated);

            // 更新译文
            this.setState({
                translatedText: result.translated,
                isLoading: false,
                error: null
            });
        } catch (error) {
            console.error('[LinxTrans] Translation failed:', error);
            this.setState({
                error: (error as Error).message,
                isLoading: false
            });
        }
    }
}
