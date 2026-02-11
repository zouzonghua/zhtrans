import { Translation, TranslationType } from '@/domain/entities/Translation';
import { HistoryUseCase } from '@/domain/usecases/HistoryUseCase';
import { SpeakTextUseCase } from '@/domain/usecases/SpeakTextUseCase';

// UI State
export interface HistoryState {
    history: Translation[];
    loading: boolean;
    loadingMore: boolean;  // 加载更多状态
    hasMore: boolean;      // 是否还有更多数据
    totalCount: number;    // 总数
    speakingItem: string | null;
    searchQuery: string;
    filteredHistory: Translation[];
    selectedTab: 'all' | TranslationType;  // Tab 筛选：全部/划词/字幕
}

const INITIAL_STATE: HistoryState = {
    history: [],
    loading: true,
    loadingMore: false,
    hasMore: true,
    totalCount: 0,
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

    // 分页相关
    private readonly PAGE_SIZE = 50;
    private currentOffset = 0;

    // 搜索优化
    private searchDebounceTimer: number | null = null;
    private searchCache = new Map<string, Translation[]>();  // 搜索缓存

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

    /**
     * 加载历史记录（重置分页）
     */
    public loadHistory = async () => {
        console.log('[ViewModel] 🔄 开始加载历史记录（重置分页）');
        this.setState({ loading: true, history: [], filteredHistory: [] });
        this.currentOffset = 0;
        await this.loadMore();
        this.setState({ loading: false });
        console.log('[ViewModel] ✅ 历史记录加载完成');
    }

    /**
     * 加载更多数据（增量加载）
     */
    public loadMore = async () => {
        if (this.state.loadingMore || !this.state.hasMore) {
            console.log(`[ViewModel] ⏭️ 跳过加载更多: loadingMore=${this.state.loadingMore}, hasMore=${this.state.hasMore}`);
            return;
        }

        console.log(`[ViewModel] 📥 开始加载更多: offset=${this.currentOffset}, pageSize=${this.PAGE_SIZE}`);
        this.setState({ loadingMore: true });

        try {
            const type = this.state.selectedTab === 'all' ? undefined : this.state.selectedTab;

            // 并行获取数据和总数
            const [items, totalCount] = await Promise.all([
                this.useCase.getPage(this.currentOffset, this.PAGE_SIZE, type),
                this.useCase.getCount(type)
            ]);

            // 延时500ms
            if (this.currentOffset !== 0) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            console.log(`[ViewModel] 📊 获取到 ${items.length} 条数据，总数: ${totalCount}`);

            const newHistory = [...this.state.history, ...items];
            this.currentOffset += items.length;

            this.setState({
                history: newHistory,
                totalCount,
                hasMore: this.currentOffset < totalCount,
                loadingMore: false
            });

            console.log(`[ViewModel] ✅ 加载更多完成: 当前已加载 ${this.currentOffset}/${totalCount} 条`);
        } catch (e) {
            console.error('[ViewModel] ❌ 加载更多失败:', e);
            this.setState({ loadingMore: false });
        }
    }

    public deleteItem = async (text: string) => {
        // 如果正在播放被删除的项，停止播放
        if (this.state.speakingItem === text) {
            this.speakUseCase.stop();
            this.setState({ speakingItem: null });
        }

        await this.useCase.delete(text);

        // 删除后重新加载（重置分页）
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

    /**
     * 设置搜索关键词（带防抖优化）
     */
    public setSearchQuery = (query: string) => {
        // 清除之前的定时器
        if (this.searchDebounceTimer) {
            clearTimeout(this.searchDebounceTimer);
        }

        // 立即更新 UI 显示的搜索词
        this.state = { ...this.state, searchQuery: query };
        this.notify();

        // 300ms 后执行搜索
        this.searchDebounceTimer = setTimeout(() => {
            this.performSearch(query);
        }, 300) as any;
    }

    /**
     * 执行搜索（带缓存）
     */
    private performSearch(query: string) {
        const cacheKey = `${this.state.selectedTab}_${query.toLowerCase()}`;

        // 检查缓存
        if (this.searchCache.has(cacheKey)) {
            console.log(`[ViewModel] 🎯 搜索缓存命中: "${query}"`);
            this.state = {
                ...this.state,
                filteredHistory: this.searchCache.get(cacheKey)!
            };
            this.notify();
            return;
        }

        console.log(`[ViewModel] 🔍 执行搜索: "${query}"`);
        // 执行搜索
        this.updateFilteredHistory();

        // 缓存结果（最多缓存 20 个搜索结果）
        if (this.searchCache.size > 20) {
            const firstKey = this.searchCache.keys().next().value as string;
            this.searchCache.delete(firstKey);
        }
        this.searchCache.set(cacheKey, this.state.filteredHistory);
        console.log(`[ViewModel] 💾 搜索结果已缓存，找到 ${this.state.filteredHistory.length} 条`);
    }

    /**
     * 切换 Tab（重置分页和缓存）
     */
    public setSelectedTab = (tab: 'all' | TranslationType) => {
        console.log(`[ViewModel] 🔀 切换 Tab: ${this.state.selectedTab} → ${tab}`);

        // 切换 Tab 时清空搜索缓存
        this.searchCache.clear();
        console.log('[ViewModel] 🗑️ 已清空搜索缓存');

        // 重置分页
        this.currentOffset = 0;
        this.setState({
            selectedTab: tab,
            history: [],
            filteredHistory: [],
            hasMore: true
        });

        // 重新加载数据
        this.loadHistory();
    }
}
