import { Translation, TranslationType } from '@/domain/entities/Translation';
import { HistoryUseCase } from '@/domain/usecases/HistoryUseCase';
import { SpeakTextUseCase } from '@/domain/usecases/SpeakTextUseCase';

// UI State
export interface HistoryState {
    history: Translation[];
    loading: boolean;
    speakingItem: string | null;
    searchQuery: string;
    filteredHistory: Translation[];
    selectedTab: 'all' | TranslationType;  // Tab 筛选：全部/划词/字幕
}

const INITIAL_STATE: HistoryState = {
    history: [],
    loading: true,
    speakingItem: null,
    searchQuery: '',
    filteredHistory: [],
    selectedTab: 'all'
};

type Listener = (state: HistoryState) => void;

// ... (State interface remains same)

export class HistoryViewModel {
    private state: HistoryState = { ...INITIAL_STATE };
    private listeners: Listener[] = [];
    private useCase: HistoryUseCase;
    private speakUseCase: SpeakTextUseCase;

    /**
     * @param useCase 历史记录管理用例 (增删查)
     * @param speakUseCase TTS 朗读用例
     * 
     * 架构说明:
     * HistoryViewModel 充当 MVVM 中的 "ViewModel"。
     * 1. 它持有 UI 所需的所有状态 (State)。
     * 2. 它暴露修改状态的方法 (Actions)。
     * 3. 它不包含任何 UI 框架特定的代码 (如 Hooks/Components)。
     */
    constructor(useCase: HistoryUseCase, speakUseCase: SpeakTextUseCase) {
        this.useCase = useCase;
        this.speakUseCase = speakUseCase;
    }

    public getState(): HistoryState {
        return this.state;
    }

    // --- 核心架构设计: 为什么手写发布订阅 (Observer Pattern)? ---
    //
    // 1. 架构解耦 (Clean Architecture):
    //    HistoryViewModel 是 UI 的“大脑”，它只关心“怎么处理数据”，不关心“怎么渲染像素”。
    //    通过手写 subscribe，我们切断了对具体 UI 库 (Preact/React) 的依赖。
    //    未来如果 UI 换成 Vue，这个文件不需要改动哪怕一个字符。
    //
    // 2. 纯逻辑测试:
    //    你可以像测试普通函数一样测试这段逻辑，不需要启动组件渲染树。
    //    例如: const vm = new HistoryViewModel(...); vm.subscribe(...);
    public subscribe(listener: Listener): () => void {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private setState(partial: Partial<HistoryState>) {
        // 1. 状态更新 (State Update)
        this.state = { ...this.state, ...partial };
        // 2. 副作用处理与通知 (Side Effects & Notify)
        // 如果更新了 history、searchQuery 或 selectedTab，自动更新过滤结果
        if (partial.history || partial.searchQuery !== undefined || partial.selectedTab !== undefined) {
            this.updateFilteredHistory();
        } else {
            this.notify();
        }
    }

    // --- Actions (业务操作) ---
    // 下面的方法由 UI 组件直接触发 (例如 onClick)

    /**
     * 自动更新过滤后的列表
     * 当 `history` 原数据变化，或者 `searchQuery`/`selectedTab` 变化时，重新计算 `filteredHistory`。
     * 这种逻辑放在 VM 里的好处是：UI 层不需要写 useEffect 来监听变化，只需要渲染 `filteredHistory` 即可。
     */
    private updateFilteredHistory() {
        const query = this.state.searchQuery.toLowerCase();
        const tab = this.state.selectedTab;

        let filtered = this.state.history;

        // 1. 按类型筛选
        if (tab !== 'all') {
            filtered = filtered.filter(item => item.type === tab);
        }

        // 2. 按搜索关键词筛选
        if (query) {
            filtered = filtered.filter(item =>
                item.original.toLowerCase().includes(query) ||
                item.translated.toLowerCase().includes(query)
            );
        }

        this.state = { ...this.state, filteredHistory: filtered };
        this.notify();
    }

    private notify() {
        this.listeners.forEach(listener => listener(this.state));
    }

    // --- Actions ---

    public loadHistory = async () => {
        this.setState({ loading: true });
        try {
            const items = await this.useCase.getAll();
            this.setState({ history: items, loading: false });
        } catch (e) {
            console.error(e);
            this.setState({ loading: false });
        }
    }

    public deleteItem = async (text: string) => {
        // 如果正在播放被删除的项，停止播放
        if (this.state.speakingItem === text) {
            this.speakUseCase.stop();
            this.setState({ speakingItem: null });
        }

        await this.useCase.delete(text);
        await this.loadHistory();
    }

    public toggleSpeak = (text: string) => {
        if (this.state.speakingItem === text) {
            this.speakUseCase.stop();
            this.setState({ speakingItem: null });
            return;
        }

        this.speakUseCase.stop();
        this.setState({ speakingItem: text });

        this.speakUseCase.execute(text)
            .then(() => this.setState({ speakingItem: null }))
            .catch(() => this.setState({ speakingItem: null }));
    }

    public stopSpeak = () => {
        if (this.state.speakingItem) {
            this.speakUseCase.stop();
            this.setState({ speakingItem: null });
        }
    }

    public setSearchQuery = (query: string) => {
        this.setState({ searchQuery: query });
    }

    public setSelectedTab = (tab: 'all' | TranslationType) => {
        this.setState({ selectedTab: tab });
    }
}
