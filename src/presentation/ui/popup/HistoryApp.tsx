import { SpeakIcon, ArrowUpIcon } from '@/presentation/ui/shared/icons';
import { useHistoryModel } from '@/presentation/ui/popup/hooks/useHistoryModel';
import { HistoryUseCase } from '@/domain/usecases/HistoryUseCase';
import styles from './history.css?inline';
import { useRef, useEffect, useState } from 'preact/hooks';

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
    const { loading, loadingMore, hasMore, totalCount, filteredHistory, speakingItem, searchQuery, selectedTab } = state;
    const { handleDelete, handleSpeak, handleSearch, handleTabChange, handleLoadMore } = actions;

    console.log(`[UI] 🚀 Rendering v1.0.3 | loading: ${loading}, count: ${filteredHistory.length}, hasMore: ${hasMore}`);

    // 2. 滚动加载监听
    const contentRef = useRef<HTMLDivElement>(null);
    const isLoadingRef = useRef(false); // 防止重复触发
    const [showScrollTop, setShowScrollTop] = useState(false); // 回到顶部按钮状态

    useEffect(() => {
        const content = contentRef.current;
        if (!content) return;

        console.log('[UI] 📏 Size Check (Effect):', {
            clientHeight: content.clientHeight,
            scrollHeight: content.scrollHeight,
            itemsCount: filteredHistory.length,
            hasMore,
            loadingMore
        });

        const checkScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = content;
            const distance = scrollHeight - (scrollTop + clientHeight);

            if (scrollTop > 0) {
                console.log(`[UI] 📜 Scrolling: scrollTop=${scrollTop}, distance=${distance}`);
            }

            // 更新回到顶部按钮可见性 (超过 300px 显示)
            if (scrollTop > 300) {
                setShowScrollTop(true);
            } else {
                setShowScrollTop(false);
            }

            // 关键逻辑：如果距离底部小于 100px (包括没有滚动条的情况 distance=0)，且还有更多数据，则加载
            if (hasMore && !loadingMore && !loading && distance < 100 && !isLoadingRef.current) {
                console.log('[UI] 🎯 触发加载: 列表未填满或接近底部');
                isLoadingRef.current = true;
                handleLoadMore().finally(() => {
                    // 给 DOM 留出渲染时间后再重置锁
                    setTimeout(() => { isLoadingRef.current = false; }, 500);
                });
            }
        };

        // 绑定滚动事件
        content.addEventListener('scroll', checkScroll, { passive: true });

        // 渲染后立即检查一次（处理内容不足以产生滚动条的情况）
        const timer = setTimeout(checkScroll, 100);

        return () => {
            content.removeEventListener('scroll', checkScroll);
            clearTimeout(timer);
        };
    }, [handleLoadMore, filteredHistory.length, hasMore, loadingMore, loading]);

    return (
        <div className="zhtrans-history">
            <header className="zhtrans-history__header">
                <div className="zhtrans-history__top-bar">
                    <h2>
                        History <span style={{ fontSize: '11px', fontWeight: 'normal', opacity: 0.5, marginLeft: '4px' }}>v{__APP_VERSION__}</span>
                    </h2>
                </div>

                {/* Segmented Control Tabs */}
                <div className="zhtrans-history__tabs">
                    {/* Sliding indicator background */}
                    <div
                        className="zhtrans-tab-indicator"
                        style={{
                            transform: `translateX(${selectedTab === 'all' ? '0px' :
                                selectedTab === 'lookup' ? 'calc(100% + 6px)' :
                                    'calc(200% + 12px)'
                                })`
                        }}
                    />
                    <button
                        className={`zhtrans-tab-btn ${selectedTab === 'all' ? 'zhtrans-tab-btn--active' : ''}`}
                        onClick={() => handleTabChange('all')}
                    >
                        全部
                    </button>
                    <button
                        className={`zhtrans-tab-btn ${selectedTab === 'lookup' ? 'zhtrans-tab-btn--active' : ''}`}
                        onClick={() => handleTabChange('lookup')}
                    >
                        划词
                    </button>
                    <button
                        className={`zhtrans-tab-btn ${selectedTab === 'subtitle' ? 'zhtrans-tab-btn--active' : ''}`}
                        onClick={() => handleTabChange('subtitle')}
                    >
                        字幕
                    </button>
                </div>

                <div className="zhtrans-history__search">
                    <div className="zhtrans-search-wrapper">
                        <svg className="zhtrans-search-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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


            <div className="zhtrans-history__content" ref={contentRef}>
                {loading ? (
                    <div className="zhtrans-history__empty">Loading...</div>
                ) : filteredHistory.length === 0 ? (
                    <div className="zhtrans-history__empty">
                        {searchQuery ? 'No matching history found.' : 'No history yet.'}
                    </div>
                ) : (
                    <>
                        <ul className="zhtrans-history__list">
                            {filteredHistory.map((item) => (
                                <li key={item.original} className="zhtrans-history__item group">
                                    <div className="zhtrans-history__row">
                                        <div className="zhtrans-history__original">{item.original}</div>

                                        {/* Actions: Speak & Delete (Hover to show) */}
                                        <div className="zhtrans-history__actions">
                                            <button
                                                className={`zhtrans-icon-btn ${speakingItem === item.original ? 'zhtrans-btn--speaking' : ''}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSpeak(item.original);
                                                }}
                                                title="Speak"
                                            >
                                                <SpeakIcon />
                                            </button>
                                            <button
                                                className="zhtrans-icon-btn zhtrans-icon-btn--delete"
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
                                    <div className="zhtrans-history__translated">{item.translated}</div>
                                </li>
                            ))}
                        </ul>

                        {/* 加载更多指示器 */}
                        {loadingMore && (
                            <div className="zhtrans-loading-more">Loading more...</div>
                        )}

                        {/* 已加载全部提示 */}
                        {!hasMore && filteredHistory.length > 0 && (
                            <div className="zhtrans-all-loaded">
                                All {totalCount} items loaded
                            </div>
                        )}
                    </>
                )}

            </div>
            {/* 回到顶部按钮 - 移到外层容器以固定位置 */}
            <button
                className={`zhtrans-scroll-top ${showScrollTop ? 'zhtrans-scroll-top--visible' : ''}`}
                onClick={() => {
                    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                title="Scroll to top"
            >
                <ArrowUpIcon />
            </button>

            <style>{styles}</style>
        </div>
    );
};
