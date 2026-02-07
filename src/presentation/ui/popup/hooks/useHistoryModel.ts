import { useEffect, useState, useMemo } from 'preact/hooks';
import { HistoryViewModel, HistoryState } from '@/presentation/viewmodels/HistoryViewModel';
import { HistoryUseCase } from '@/domain/usecases/HistoryUseCase';


/**
 * useHistoryModel
 * 连接 Preact UI 与 HistoryViewModel
 */
import { SpeakTextUseCase } from '@/domain/usecases/SpeakTextUseCase';

/**
 * useHistoryModel
 * 连接 Preact UI 与 HistoryViewModel
 */
export function useHistoryModel(useCase: HistoryUseCase, speakUseCase: SpeakTextUseCase) {
    // 依赖注入 (DI): 直接使用传入的 UseCase
    const viewModel = useMemo(() => {
        return new HistoryViewModel(useCase, speakUseCase);
    }, [useCase, speakUseCase]);

    const [state, setState] = useState<HistoryState>(viewModel.getState());

    useEffect(() => {
        // 订阅 ViewModel 状态变化
        const unsubscribe = viewModel.subscribe((newState) => {
            setState({ ...newState });
        });

        // 初始加载
        viewModel.loadHistory();

        return () => {
            unsubscribe();
            viewModel.stopSpeak();
        };
    }, [viewModel]);

    return {
        state,
        actions: {
            handleDelete: viewModel.deleteItem,
            handleSpeak: viewModel.toggleSpeak,
            handleSearch: viewModel.setSearchQuery,
            handleLoad: viewModel.loadHistory,
            handleTabChange: viewModel.setSelectedTab
        }
    };
}
