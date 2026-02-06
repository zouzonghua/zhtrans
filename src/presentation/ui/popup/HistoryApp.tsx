import { h } from 'preact';
import { useEffect, useState, useMemo, useCallback } from 'preact/hooks';
import { Translation } from '@/domain/entities/Translation';
import { ChromeTranslationRepository } from '@/data/repository/ChromeTranslationRepository';
import { SpeakIcon } from '@/presentation/ui/common/icons';
import { WebSpeechService } from '@/data/local/tts/WebSpeechService';
import styles from './history.css?inline';

declare const __APP_VERSION__: string;

/**
 * 历史记录弹窗应用
 */
export const HistoryApp = () => {
    const [history, setHistory] = useState<Translation[]>([]);
    const [loading, setLoading] = useState(true);
    const [speakingItem, setSpeakingItem] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const repo = useMemo(() => new ChromeTranslationRepository(), []);
    const tts = useMemo(() => new WebSpeechService(), []);

    const loadHistory = useCallback(async () => {
        setLoading(true);
        try {
            const items = await repo.getAll();
            setHistory(items);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [repo]);

    useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    const handleDelete = useCallback(async (text: string) => {
        await repo.delete(text);
        loadHistory();
    }, [repo, loadHistory]);

    const handleSpeak = (text: string) => {
        // 如果正在播放同一条，则停止
        if (speakingItem === text) {
            tts.stop();
            setSpeakingItem(null);
            return;
        }

        tts.stop();
        setSpeakingItem(text);
        tts.speak(text)
            .then(() => setSpeakingItem(null))
            .catch(() => setSpeakingItem(null));
    };

    const filteredHistory = history.filter(item => {
        const query = searchQuery.toLowerCase();
        return item.original.toLowerCase().includes(query) ||
            item.translated.toLowerCase().includes(query);
    });

    return (
        <div className="linxtrans-history">
            <header className="linxtrans-history__header">
                <h2>Translation History</h2>
                <div className="linxtrans-history__search">
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onInput={(e) => setSearchQuery(e.currentTarget.value)}
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
