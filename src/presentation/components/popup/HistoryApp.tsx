import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { Translation } from '@/domain/entities/Translation';
import { ChromeTranslationRepository } from '@/infrastructure/repositories/ChromeTranslationRepository';
import { SpeakIcon } from '../../icons';
import { WebSpeechService } from '@/infrastructure/services/WebSpeechService';

declare const __APP_VERSION__: string;

/**
 * 历史记录弹窗应用
 */
export const HistoryApp = () => {
    const [history, setHistory] = useState<Translation[]>([]);
    const [loading, setLoading] = useState(true);
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
        tts.stop();
        tts.speak(text);
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
                                        <button className="linxtrans-icon-btn" onClick={() => handleSpeak(item.original)}>
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

            <style>{`
                :root {
                    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
                }
                body {
                    margin: 0;
                    width: 320px;
                    height: 480px;
                    background: #f5f5f7;
                }
                .linxtrans-history {
                    display: flex;
                    flex-direction: column;
                    height: 480px;
                }
                .linxtrans-history__header {
                    flex-shrink: 0;
                    height: 48px;
                    padding: 12px 16px;
                    background: white;
                    border-bottom: 1px solid rgba(0,0,0,0.1);
                    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
                    display: flex;
                    align-items: center;
                }
                .linxtrans-history__header h2 {
                    margin: 0;
                    font-size: 16px;
                    font-weight: 600;
                    color: #1d1d1f;
                }
                .linxtrans-history__content {
                    flex: 1 1 auto;
                    min-height: 0;
                    overflow-y: auto;
                }
                .linxtrans-history__empty {
                    padding: 20px;
                    text-align: center;
                    color: #86868b;
                    font-size: 14px;
                }
                .linxtrans-history__list {
                    list-style: none;
                    margin: 0;
                    padding: 0;
                }
                .linxtrans-history__item {
                    display: flex;
                    align-items: flex-start;
                    padding: 12px 16px;
                    background: white;
                    border-bottom: 1px solid rgba(0,0,0,0.05);
                    transition: background 0.2s;
                }
                .linxtrans-history__item:hover {
                    background: #fbfbfd;
                }
                .linxtrans-history__main {
                    flex: 1;
                    min-width: 0;
                }
                .linxtrans-history__original {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 14px;
                    color: #1d1d1f;
                    font-weight: 500;
                    margin-bottom: 4px;
                }
                .linxtrans-history__translated {
                    font-size: 13px;
                    color: #6e6e73;
                }
                .linxtrans-history__delete {
                    margin-left: 8px;
                    background: none;
                    border: none;
                    color: #86868b;
                    font-size: 18px;
                    cursor: pointer;
                    padding: 0 4px;
                }
                .linxtrans-history__delete:hover {
                    color: #ff3b30;
                }
                .linxtrans-icon-btn {
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 2px;
                    display: flex;
                    align-items: center;
                }
                .linxtrans-icon-btn svg {
                    width: 12px;
                    height: 12px;
                    fill: #007aff;
                }
                .linxtrans-history__footer {
                    flex-shrink: 0;
                    height: 32px;
                    padding: 8px;
                    text-align: center;
                    font-size: 12px;
                    color: #86868b;
                    border-top: 1px solid rgba(0,0,0,0.05);
                    background: #ffffff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
            `}</style>
        </div>
    );
};
