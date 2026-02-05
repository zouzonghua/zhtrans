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
        document.addEventListener('mousedown', this.handleMouseDown);
        document.addEventListener('keydown', this.handleKeyDown);
    }

    // 框架适配器 (Binder) 应该在卸载时调用此方法
    public unmount() {
        document.removeEventListener('mouseup', this.handleMouseUp);
        document.removeEventListener('mousedown', this.handleMouseDown);
        document.removeEventListener('keydown', this.handleKeyDown);
    }

    // --- 事件处理器 (逻辑层) ---

    // 1. 选区逻辑 (源自 useSelection)
    private handleMouseUp = () => {
        // 如果弹窗已打开，不要立即触发新选区，除非我们需要这种行为
        // 保持逻辑简单以匹配原始设计：

        const sel = window.getSelection();
        const text = sel?.toString().trim();

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

    // 3. 关闭逻辑 (点击外部)
    private handleMouseDown = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const isInternal = target.closest('#glimpse-host'); // 假设有 ShadowHost 检查或类似逻辑
        // 注意：在 ShadowDOM 上下文中，e.target 逻辑可能需要仔细处理或传入 host 检查。
        // 简单起见，如果我们能在 document 上接收到此事件，我们可能需要重置。

        // 原始逻辑检查了 target.id !== 'glimpse-host'
        // 如果我们是完全纯净的，我们可能需要 View 告诉我们“点击了外部”。
        // 但是，既然我们在 document 上添加了监听器，我们可以尝试推断。

        // 目前，为了简单起见，我们公开一个 "reset" 动作供 View 调用，
        // 或者如果我们信任事件 target，也可以实现相同的逻辑。
        // 让我们坚持使用 "reset" 方法，让 binder/view helper 决定，
        // 或者使用标准的 "点击外部" 逻辑。

        // 重新实现简单的检查：
        if (this.state.result || this.state.triggerPos) {
            // 如果真的想检测 Shadow Root 外部的点击，在没有 ref 的纯类中比较棘手。
            // 让我们推迟到公开的 reset() 方法，或者如果我们可以访问 host 的话再处理。
        }
    };

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
        // 初始加载位置
        const initialPos = calculatePopupPosition(rect, window.innerWidth, window.innerHeight, false);
        this.setState({
            isLoading: true,
            popupPos: initialPos,
            result: null,
            triggerPos: null
        });

        try {
            const result = await this.useCase.execute(text);

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
            console.error(error);
            this.setState({ isLoading: false });
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
        // 动画关闭？
        // 先实现简单逻辑：
        this.setState({
            triggerPos: null,
            result: null,
            popupPos: null
        });
        this._currentSelection = null;
        this.useCase.stopAudio();
    }

    // 手动触发关闭 (例如从 UI 遮罩层点击)
    public dismiss = () => {
        // 如果需要，可以在这里实现关闭动画逻辑，或者直接重置
        this.reset();
    }
}
