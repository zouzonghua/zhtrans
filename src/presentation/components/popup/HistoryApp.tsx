import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { Translation } from '@/domain/entities/Translation';
import { ChromeTranslationRepository } from '@/infrastructure/repositories/ChromeTranslationRepository';
import { SpeakIcon } from '../../icons';
import { WebSpeechService } from '@/infrastructure/services/WebSpeechService';
import styles from './history.css?inline';

declare const __APP_VERSION__: string;

/**
 * 历史记录弹窗应用
 */
export const HistoryApp = () => {
    const [history, setHistory] = useState<Translation[]>([]);
    const [loading, setLoading] = useState(true);
    const [speakingItem, setSpeakingItem] = useState<string | null>(null);
    const repo = new ChromeTranslationRepository();
    const tts = new WebSpeechService();

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        setLoading(true);
        try {
            const items = await repo.getAll();
            setHistory(items.reverse()); // 简单的倒序显示
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (text: string) => {
        await repo.delete(text);
        loadHistory();
    };

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

    return (
        <div className="linxtrans-history">
            <header className="linxtrans-history__header">
                <h2>Translation History</h2>
            </header>

            <div className="linxtrans-history__content">
                {loading ? (
                    <div className="linxtrans-history__empty">Loading...</div>
                ) : history.length === 0 ? (
                    <div className="linxtrans-history__empty">No history found.</div>
                ) : (
                    <ul className="linxtrans-history__list">
                        {history.map((item, index) => (
                            <li key={index} className="linxtrans-history__item">
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
