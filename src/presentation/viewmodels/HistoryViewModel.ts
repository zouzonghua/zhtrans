import { Translation } from '@/domain/entities/Translation';
import { HistoryUseCase } from '@/domain/usecases/HistoryUseCase';
import { SpeakTextUseCase } from '@/domain/usecases/SpeakTextUseCase';

// UI State
export interface HistoryState {
    history: Translation[];
    loading: boolean;
    speakingItem: string | null;
    searchQuery: string;
    filteredHistory: Translation[];
}

const INITIAL_STATE: HistoryState = {
    history: [],
    loading: true,
    speakingItem: null,
    searchQuery: '',
    filteredHistory: []
};

type Listener = (state: HistoryState) => void;

// ... (State interface remains same)

export class HistoryViewModel {
    private state: HistoryState = { ...INITIAL_STATE };
    private listeners: Listener[] = [];
    private useCase: HistoryUseCase;
    private speakUseCase: SpeakTextUseCase;

    constructor(useCase: HistoryUseCase, speakUseCase: SpeakTextUseCase) {
        this.useCase = useCase;
        this.speakUseCase = speakUseCase;
    }

    public getState(): HistoryState {
        return this.state;
    }

    public subscribe(listener: Listener): () => void {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private setState(partial: Partial<HistoryState>) {
        this.state = { ...this.state, ...partial };
        // 如果更新了 history 或 searchQuery，自动更新过滤结果
        if (partial.history || partial.searchQuery !== undefined) {
            this.updateFilteredHistory();
        } else {
            this.notify();
        }
    }

    private updateFilteredHistory() {
        const query = this.state.searchQuery.toLowerCase();
        const filtered = this.state.history.filter(item =>
            item.original.toLowerCase().includes(query) ||
            item.translated.toLowerCase().includes(query)
        );
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
}
