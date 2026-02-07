import { SpeakIcon } from '@/presentation/ui/shared/icons';
import { useHistoryModel } from '@/presentation/ui/popup/hooks/useHistoryModel';
import { HistoryUseCase } from '@/domain/usecases/HistoryUseCase';
import styles from './history.css?inline';

declare const __APP_VERSION__: string;

import { SpeakTextUseCase } from '@/domain/usecases/SpeakTextUseCase';



interface Props {
    useCase: HistoryUseCase;
    speakUseCase: SpeakTextUseCase;
}

/**
 * 历史记录弹窗应用
 * 
 * Refactored to clean architecture:
 * - Dumb Component: Only responsible for rendering
 * - Logic delegated to useHistoryModel -> HistoryViewModel
 */
export const HistoryApp = ({ useCase, speakUseCase }: Props) => {
    // 1. 获取 Model (State & Actions)
    const { state, actions } = useHistoryModel(useCase, speakUseCase);
    const { loading, filteredHistory, speakingItem, searchQuery, selectedTab } = state;
    const { handleDelete, handleSpeak, handleSearch, handleTabChange } = actions;

    return (
        <div className="linxtrans-history">
            <header className="linxtrans-history__header">
                <div className="linxtrans-history__top-bar">
                    <h2>
                        History <span style={{ fontSize: '11px', fontWeight: 'normal', opacity: 0.5, marginLeft: '4px' }}>v{__APP_VERSION__}</span>
                    </h2>
                </div>

                {/* Segmented Control Tabs */}
                <div className="linxtrans-history__tabs">
                    {/* Sliding indicator background */}
                    <div
                        className="linxtrans-tab-indicator"
                        style={{
                            transform: `translateX(${selectedTab === 'all' ? '0px' :
                                selectedTab === 'lookup' ? 'calc(100% + 6px)' :
                                    'calc(200% + 12px)'
                                })`
                        }}
                    />
                    <button
                        className={`linxtrans-tab-btn ${selectedTab === 'all' ? 'linxtrans-tab-btn--active' : ''}`}
                        onClick={() => handleTabChange('all')}
                    >
                        全部
                    </button>
                    <button
                        className={`linxtrans-tab-btn ${selectedTab === 'lookup' ? 'linxtrans-tab-btn--active' : ''}`}
                        onClick={() => handleTabChange('lookup')}
                    >
                        划词
                    </button>
                    <button
                        className={`linxtrans-tab-btn ${selectedTab === 'subtitle' ? 'linxtrans-tab-btn--active' : ''}`}
                        onClick={() => handleTabChange('subtitle')}
                    >
                        字幕
                    </button>
                </div>

                <div className="linxtrans-history__search">
                    <div className="linxtrans-search-wrapper">
                        <svg className="linxtrans-search-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search translations..."
                            value={searchQuery}
                            onInput={(e) => handleSearch(e.currentTarget.value)}
                        />
                    </div>
                </div>
            </header>

            <div className="linxtrans-history__content">
                {loading ? (
                    <div className="linxtrans-history__empty">Loading...</div>
                ) : filteredHistory.length === 0 ? (
                    <div className="linxtrans-history__empty">
                        {searchQuery ? 'No matching history found.' : 'No history yet.'}
                    </div>
                ) : (
                    <ul className="linxtrans-history__list">
                        {filteredHistory.map((item) => (
                            <li key={item.original} className="linxtrans-history__item group">
                                <div className="linxtrans-history__row">
                                    <div className="linxtrans-history__original">{item.original}</div>

                                    {/* Actions: Speak & Delete (Hover to show) */}
                                    <div className="linxtrans-history__actions">
                                        <button
                                            className={`linxtrans-icon-btn ${speakingItem === item.original ? 'linxtrans-btn--speaking' : ''}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleSpeak(item.original);
                                            }}
                                            title="Speak"
                                        >
                                            <SpeakIcon />
                                        </button>
                                        <button
                                            className="linxtrans-icon-btn linxtrans-icon-btn--delete"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(item.original);
                                            }}
                                            title="Delete"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                                                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                <div className="linxtrans-history__translated">{item.translated}</div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <style>{styles}</style>
        </div>
    );
};
