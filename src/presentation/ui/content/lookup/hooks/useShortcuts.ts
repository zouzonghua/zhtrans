import { useEffect } from 'preact/hooks';

interface Handlers {
    onTranslate: (text: string, rect: DOMRect) => void;
    onSpeak: (text?: string, rect?: DOMRect) => void;
}

/**
 * 监听全局快捷键
 * Option+T: 翻译选区
 * Option+S: 朗读 / 播放控制
 */
export function useShortcuts(handlers: Handlers) {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Option+T: 翻译选区
            if (event.altKey && !event.metaKey && !event.ctrlKey && event.code === 'KeyT') {
                const sel = window.getSelection();
                if (sel && sel.toString().trim().length > 0) {
                    const text = sel.toString().trim();
                    const rect = sel.getRangeAt(0).getBoundingClientRect();
                    handlers.onTranslate(text, rect);
                }
            }

            // Option+S: 播放/暂停 或 翻译并朗读
            if (event.altKey && !event.metaKey && !event.ctrlKey && event.code === 'KeyS') {
                const sel = window.getSelection();
                const text = sel?.toString().trim();

                if (text && text.length > 0) {
                    // 如果有选区，传递给处理器，由上层决定是"翻译并朗读"还是"仅朗读当前结果"
                    const rect = sel!.getRangeAt(0).getBoundingClientRect();
                    handlers.onSpeak(text, rect);
                } else {
                    // 无选区，仅触发朗读控制
                    handlers.onSpeak();
                }
            }
        }

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handlers]);
}
