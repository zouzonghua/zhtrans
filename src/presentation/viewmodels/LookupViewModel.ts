import { Translation } from '@/domain/entities/Translation';
import { LookupUseCase } from '@/domain/usecases/LookupUseCase';
import { SpeakTextUseCase } from '@/domain/usecases/SpeakTextUseCase';
import { calculatePopupPosition, PopupPosition } from '@/presentation/ui/utils/positioning';

// UI 状态定义 (框架无关)
export interface LookupState {
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
const INITIAL_STATE: LookupState = {
    triggerPos: null,
    isLoading: false,
    result: null,
    popupPos: null,
    isSpeaking: false,
    error: null,
    isClosing: false
};

type Listener = (state: LookupState) => void;

export class LookupViewModel {
    private state: LookupState = { ...INITIAL_STATE };
    private listeners: Listener[] = [];
    private useCase: LookupUseCase;
    private speakUseCase: SpeakTextUseCase;
    private requestId = 0;
    private activeRequestId = 0;
    private lastRequest: { text: string; rect: { top: number; right: number; bottom: number; left: number; width: number; height: number } } | null = null;

    /**
     * @param useCase 核心翻译业务逻辑 (Domain Layer)
     * @param speakUseCase 朗读业务逻辑
     * 依赖注入 (Dependency Injection):
     * ViewModel 不直接实例化依赖，而是通过构造函数接收。
     * 这使得我们可以轻松注入 Mock 对象进行单元测试。
     */
    constructor(useCase: LookupUseCase, speakUseCase: SpeakTextUseCase) {
        this.useCase = useCase;
        this.speakUseCase = speakUseCase;
    }

    // --- 核心: 状态管理 (发布/订阅模式) ---
    public getState(): LookupState {
        return this.state;
    }

    // --- 核心架构设计: 为什么这里要手写发布订阅模式 (Observer Pattern)? ---
    // 
    // 1. 解耦 UI 框架 (Framework Agnostic): 
    //    这个 ViewModel 是纯 TypeScript 类，不依赖 React/Preact 的 setState 或 Hooks。
    //    这意味着核心业务逻辑可以无缝移植到 Vue, Svelte, Flutter (JS/Dart bridge) 或原生 JS 环境中，
    //    而不需要重写一行逻辑代码。UI 层只需要适配这个 `subscribe` 方法即可。
    //
    // 2. 极致的可测试性 (Testability):
    //    这里的逻辑可以直接在 Node.js 环境下通过单元测试验证 (new ViewModel -> call methods -> check state)，
    //    完全不需要模拟 DOM 或引入 JSDOM/TestingLibrary 等笨重的测试环境。
    //
    // 3. 避免闭包陷阱:
    //    React Hooks (useEffect/useCallback) 经常因为闭包导致拿不到最新的 State。
    //    而 Class 组件使用的是 `this.state`，永远指向最新的实例引用，逻辑更加简单直观。
    public subscribe(listener: Listener): () => void {
        this.listeners.push(listener);
        return () => {
            // 返回取消订阅函数 (Unsubscribe)，类似于 useEffect 的 cleanup
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private setState(partial: Partial<LookupState>) {
        // 更新内部状态 (Source of Truth)
        this.state = { ...this.state, ...partial };
        // 只有数据真正改变后，才通知 UI 层重绘
        this.notify();
    }

    private notify() {
        // 遍历所有订阅者 (通常是 React/Preact 组件的 hook) 并通知最新状态
        this.listeners.forEach(listener => listener(this.state));
    }

    // --- 纯业务逻辑 ---

    // 显示触发图标
    /**
     * 显示触发图标 (Trigger Icon)
     * 
     * 这是一个中间状态：用户选中文本后，先显示一个小图标。
     * 只有当用户点击这个图标时，才会真正触发翻译请求。
     * 这种设计是为了避免用户只是单纯选中文本（例如为了复制）时频繁打扰用户。
     * 
     * @param x 鼠标/选区 X 坐标
     * @param y 鼠标/选区 Y 坐标
     * @param text 选中的文本
     * @param rect 选区的几何位置 (用于后续定位 Popup)
     */
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
        // 未来如果有更严格的测试需求，可以注入 WindowMetrics 接口来完全解耦
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
            this.speakUseCase.execute(this.state.result.original)
                .then(() => this.setState({ isSpeaking: false }))
                .catch(() => this.setState({ isSpeaking: false }));
        }
    }

    public stopSpeak = () => {
        if (this.state.isSpeaking) {
            this.speakUseCase.stop();
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
        this.speakUseCase.stop();
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

    /**
     * 更新 Popup 位置
     * 当 Popup 渲染完成（尺寸变化）或内容更新（如词典展开）时，需要重新计算位置以防止溢出屏幕。
     */
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
