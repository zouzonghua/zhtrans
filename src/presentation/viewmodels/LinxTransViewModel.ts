import { Translation } from '@/domain/entities/Translation';
import { LookupUseCase } from '@/domain/usecases/LookupUseCase';
import { calculatePopupPosition, PopupPosition } from '@/presentation/ui/utils/positioning';

// UI 状态定义 (框架无关)
export interface LinxTransState {
    // 选区 / 触发器
    triggerPos: { x: number; y: number } | null;

    // 翻译流程
    isLoading: boolean;
    result: Translation | null;
    popupPos: PopupPosition | null;
    isSpeaking: boolean;
    error: string | null;

    // 关闭/销毁状态
    isClosing: boolean;
}

// 初始状态
const INITIAL_STATE: LinxTransState = {
    triggerPos: null,
    isLoading: false,
    result: null,
    popupPos: null,
    isSpeaking: false,
    error: null,
    isClosing: false
};

type Listener = (state: LinxTransState) => void;

/**
 * LinxTrans 纯视图模型
 * 
 * 这是一个纯 TypeScript 类，不依赖 React/Vue 等任何 UI 框架。
 * 它管理了应用所有的状态和交互逻辑。
 */
export class LinxTransViewModel {
    private state: LinxTransState = { ...INITIAL_STATE };
    private listeners: Listener[] = [];
    private useCase: LookupUseCase;
    private requestId = 0;
    private activeRequestId = 0;
    private lastRequest: { text: string; rect: { top: number; right: number; bottom: number; left: number; width: number; height: number } } | null = null;

    constructor(useCase: LookupUseCase) {
        this.useCase = useCase;
    }

    // --- 核心: 状态管理 (发布/订阅模式) ---
    public getState(): LinxTransState {
        return this.state;
    }

    public subscribe(listener: Listener): () => void {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private setState(partial: Partial<LinxTransState>) {
        this.state = { ...this.state, ...partial };
        this.notify();
    }

    private notify() {
        this.listeners.forEach(listener => listener(this.state));
    }

    // --- 纯业务逻辑 ---

    // 显示触发图标
    public showTrigger(x: number, y: number, text: string, rect: DOMRect) {
        // 如果上次请求相同，且已有结果或正在加载，则忽略 (防抖/去重逻辑)
        if (this.lastRequest && text === this.lastRequest.text) {
            if (this.state.result || this.state.isLoading || this.state.error) {
                return;
            }
        }

        this.setState({
            triggerPos: { x, y }
        });
        // 临时存储当前选区，供点击触发图标时使用
        this._currentSelection = { text, rect };
    }

    private _currentSelection: { text: string; rect: DOMRect } | null = null;

    // 点击触发图标 (Action)
    public handleTriggerClick = () => {
        if (this._currentSelection) {
            this.setState({ triggerPos: null });
            this.translate(this._currentSelection.text, this._currentSelection.rect);
        }
    }

    // 执行翻译 (接收通用 Rect 接口以便跨平台兼容，虽然后续 calculatePopupPosition 可能还需要 DOMRect，但在 VM 层我们尽量保持宽泛)
    public async translate(text: string, rect: { top: number; right: number; bottom: number; left: number; width: number; height: number }) {
        const requestId = ++this.requestId;
        this.activeRequestId = requestId;
        this.lastRequest = { text, rect };

        // 初始加载位置
        // 注意: calculatePopupPosition 目前仍依赖 window，但在 VM 中调用这是可接受的，只要不是直接监听事件
        // 未来可以注入 WindowMetrics 接口来完全解耦
        const initialPos = calculatePopupPosition(rect as DOMRect, window.innerWidth, window.innerHeight, false);
        this.setState({
            isLoading: true,
            popupPos: initialPos,
            result: null,
            triggerPos: null,
            error: null
        });

        try {
            const result = await this.useCase.execute(text);
            if (this.activeRequestId !== requestId) return;

            // 最终位置 (根据结果大小调整)
            const finalPos = calculatePopupPosition(
                rect as DOMRect,
                window.innerWidth,
                window.innerHeight,
                !!result.dictionary && result.dictionary.length > 0
            );

            this.setState({
                isLoading: false,
                result: result,
                popupPos: finalPos
            });
        } catch (error) {
            if (this.activeRequestId !== requestId) return;
            console.error(error);
            const message = error instanceof Error ? error.message : 'Translation failed.';
            this.setState({ isLoading: false, error: message });
        }
    }

    // 组合动作: 翻译并自动朗读
    public async translateAndSpeak(text: string, rect: { top: number; right: number; bottom: number; left: number; width: number; height: number }) {
        // 复用 translate 逻辑
        await this.translate(text, rect);

        // 翻译成功且有结果时，触发朗读
        if (this.state.result && !this.state.error) {
            this.speak();
        }
    }

    public speak = () => {
        if (this.state.result) {
            this.setState({ isSpeaking: true });
            this.useCase.playAudio(this.state.result.original)
                .then(() => this.setState({ isSpeaking: false }))
                .catch(() => this.setState({ isSpeaking: false }));
        }
    }

    public stopSpeak = () => {
        if (this.state.isSpeaking) {
            this.useCase.stopAudio();
            this.setState({ isSpeaking: false });
        }
    }

    // 切换播放状态 (供快捷键调用)
    public toggleSpeak() {
        if (this.state.isSpeaking) {
            this.stopSpeak();
        } else {
            this.speak();
        }
    }

    public handleExternalClick = (type: 'dict' | 'wiki') => {
        const { result } = this.state;
        if (!result) return;
        let url = "";
        if (type === 'dict') {
            url = `https://translate.google.com/?sl=auto&tl=${result.targetLang}&text=${encodeURIComponent(result.original)}&op=translate`;
        } else {
            const wikiLang = result.targetLang.startsWith('zh') ? 'zh' : 'en';
            url = `https://${wikiLang}.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(result.original)}`;
        }
        window.open(url, '_blank');
    }

    public reset = () => {
        this.activeRequestId = ++this.requestId;
        this.setState({
            triggerPos: null,
            result: null,
            popupPos: null,
            error: null,
            isLoading: false
        });
        this._currentSelection = null;
        this.useCase.stopAudio();
    }

    // 手动触发关闭 (例如从 UI 遮罩层点击)
    public dismiss = () => {
        this.reset();
    }

    public retryLast = () => {
        if (this.lastRequest) {
            this.translate(this.lastRequest.text, this.lastRequest.rect);
        }
    }

    public updatePopupPosition = (popupRect: DOMRect) => {
        if (!this.lastRequest || !this.state.popupPos) return;
        const isDictionary = !!this.state.result?.dictionary && this.state.result.dictionary.length > 0;
        const nextPos = calculatePopupPosition(
            this.lastRequest.rect as DOMRect,
            window.innerWidth,
            window.innerHeight,
            isDictionary,
            { width: popupRect.width, height: popupRect.height }
        );

        const current = this.state.popupPos;
        const epsilon = 0.5;
        if (
            Math.abs(current.x - nextPos.x) < epsilon &&
            Math.abs(current.y - nextPos.y) < epsilon &&
            Math.abs(current.tailPos - nextPos.tailPos) < epsilon &&
            current.isBottom === nextPos.isBottom
        ) {
            return;
        }

        this.setState({ popupPos: nextPos });
    }
}
