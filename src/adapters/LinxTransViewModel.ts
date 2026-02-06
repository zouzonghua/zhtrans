import { Translation } from '@/domain/entities/Translation';
import { LookupUseCase } from '@/application/usecases/LookupUseCase';
import { calculatePopupPosition, PopupPosition } from '@/presentation/utils/positioning';
import { SELECTION_MAX_LENGTH, OFFSET_TRIGGER_X, OFFSET_TRIGGER_Y } from '@/presentation/constants';

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
    private lastRequest: { text: string; rect: DOMRect } | null = null;

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

    // --- 生命周期: 绑定 DOM 事件 ---
    // 框架适配器 (Binder) 应该在挂载时调用此方法
    public mount() {
        document.addEventListener('mouseup', this.handleMouseUp);
        document.addEventListener('keydown', this.handleKeyDown);
    }

    // 框架适配器 (Binder) 应该在卸载时调用此方法
    public unmount() {
        document.removeEventListener('mouseup', this.handleMouseUp);
        document.removeEventListener('keydown', this.handleKeyDown);
    }

    // --- 事件处理器 (逻辑层) ---

    // 1. 选区逻辑 (源自 useSelection)
    private handleMouseUp = () => {
        // 如果弹窗已打开，不要立即触发新选区，除非我们需要这种行为
        // 保持逻辑简单以匹配原始设计：

        const sel = window.getSelection();
        const text = sel?.toString().trim();

        if (text && (this.state.result || this.state.isLoading || this.state.error)) {
            if (this.lastRequest && text === this.lastRequest.text) {
                return;
            }
        }

        if (text && text.length > 0 && text.length < SELECTION_MAX_LENGTH) {
            const range = sel!.getRangeAt(0);
            const rect = range.getBoundingClientRect();

            // 仅在当前未翻译时显示触发图标？
            // 原始逻辑：仅设置触发位置
            this.setState({
                triggerPos: {
                    x: rect.right + OFFSET_TRIGGER_X,
                    y: rect.top - OFFSET_TRIGGER_Y
                },
                // 概念上存储选区信息，但 state 仅包含 UI 所需的 props
                // 我们会在点击时重新获取选区以保安全，或者将其存储在私有字段中
            });
            this._currentSelection = { text, rect };
        }
    };

    private _currentSelection: { text: string; rect: DOMRect } | null = null;

    // 2. 全局键盘监听 (源自 useShortcutTrigger)
    private handleKeyDown = (event: KeyboardEvent) => {
        // Option+T: 翻译选区 (Legacy)
        if (event.altKey && !event.metaKey && !event.ctrlKey && event.code === 'KeyT') {
            this.handleTranslateShortcut();
        }

        // Option+S: 翻译并朗读 / 播放控制
        if (event.altKey && !event.metaKey && !event.ctrlKey && event.code === 'KeyS') {
            this.handleSpeakShortcut();
        }
    };

    private handleTranslateShortcut() {
        const sel = window.getSelection();
        if (sel && sel.toString().trim().length > 0) {
            const text = sel.toString().trim();
            const rect = sel.getRangeAt(0).getBoundingClientRect();

            this.setState({ triggerPos: null }); // 隐藏触发图标
            this.translate(text, rect);
        }
    }

    private handleSpeakShortcut() {
        // 场景 1: Popup 已打开 -> 切换播放/暂停
        if (this.state.result) {
            if (this.state.isSpeaking) {
                this.stopSpeak();
            } else {
                this.speak();
            }
            return;
        }

        // 场景 2: Popup 未打开 -> 翻译选区并自动播放
        const sel = window.getSelection();
        if (sel && sel.toString().trim().length > 0) {
            const text = sel.toString().trim();
            const rect = sel.getRangeAt(0).getBoundingClientRect();

            this.setState({ triggerPos: null });
            this.translate(text, rect)
                .then(() => {
                    // 翻译成功后自动播放
                    if (this.state.result) {
                        this.speak();
                    }
                });
        }
    }

    // --- 动作 (公开 API) ---

    // 点击触发图标
    public handleTriggerClick = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (this._currentSelection) {
            this.setState({ triggerPos: null });
            this.translate(this._currentSelection.text, this._currentSelection.rect);
        }
    }

    public async translate(text: string, rect: DOMRect) {
        const requestId = ++this.requestId;
        this.activeRequestId = requestId;
        this.lastRequest = { text, rect };

        // 初始加载位置
        const initialPos = calculatePopupPosition(rect, window.innerWidth, window.innerHeight, false);
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
                rect,
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
        // 动画关闭？
        // 先实现简单逻辑：
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
        // 如果需要，可以在这里实现关闭动画逻辑，或者直接重置
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
            this.lastRequest.rect,
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
