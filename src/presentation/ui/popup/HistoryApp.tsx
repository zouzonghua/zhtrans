import { SpeakIcon } from '@/presentation/ui/common/icons';
import { useHistoryModel } from '@/presentation/ui/hooks/useHistoryModel';
import { HistoryUseCase } from '@/domain/usecases/HistoryUseCase';
import styles from './history.css?inline';

declare const __APP_VERSION__: string;

interface Props {
    useCase: HistoryUseCase;
}

/**
 * 历史记录弹窗应用
 * 
 * Refactored to clean architecture:
 * - Dumb Component: Only responsible for rendering
 * - Logic delegated to useHistoryModel -> HistoryViewModel
 */
export const HistoryApp = ({ useCase }: Props) => {
    // 1. 获取 Model (State & Actions)
    const { state, actions } = useHistoryModel(useCase);
    const { loading, filteredHistory, speakingItem, searchQuery } = state;
    const { handleDelete, handleSpeak, handleSearch } = actions;

    return (
        <div className="linxtrans-history">
            <header className="linxtrans-history__header">
                <h2>Translation History</h2>
                <div className="linxtrans-history__search">
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onInput={(e) => handleSearch(e.currentTarget.value)}
                    />
                </div>
            </header>

            <div className="linxtrans-history__content">
                {loading ? (
                    <div className="linxtrans-history__empty">Loading...</div>
                ) : filteredHistory.length === 0 ? (
                    <div className="linxtrans-history__empty">
                        {searchQuery ? 'No matching history found.' : 'No history found.'}
                    </div>
                ) : (
                    <ul className="linxtrans-history__list">
                        {filteredHistory.map((item) => (
                            <li key={item.original} className="linxtrans-history__item">
                                <div className="linxtrans-history__main">
                                    <div className="linxtrans-history__original">
                                        {item.original}
                                        <button
                                            className={`linxtrans-icon-btn ${speakingItem === item.original ? 'linxtrans-btn--speaking' : ''}`}
                                            onClick={() => handleSpeak(item.original)}
                                        >
                                            <SpeakIcon />
                                        </button>
                                    </div>
                                    <div className="linxtrans-history__translated">{item.translated}</div>
                                </div>
                                <button
                                    className="linxtrans-history__delete"
                                    onClick={() => handleDelete(item.original)}
                                    title="Remove"
                                >
                                    ×
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <footer className="linxtrans-history__footer">
                v{__APP_VERSION__}
            </footer>
            <style>{styles}</style>
        </div>
    );
};
