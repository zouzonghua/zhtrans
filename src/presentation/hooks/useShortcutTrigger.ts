import { useEffect } from 'preact/hooks';

/**
 * 快捷键触发 Hook
 * 监听 Option + T (Mac) 或 Alt + T (Windows)
 * 触发时获取当前选区并执行回调
 */
export function useShortcutTrigger(onTrigger: (text: string, rect: DOMRect) => void) {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Option + T (Mac) or Alt + T (Windows/Linux)
            if (event.altKey && !event.metaKey && !event.ctrlKey && event.code === 'KeyT') {
                const selection = window.getSelection();
                if (selection && selection.toString().trim().length > 0) {
                    const text = selection.toString().trim();
                    const range = selection.getRangeAt(0);
                    const rect = range.getBoundingClientRect();

                    onTrigger(text, rect);
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [onTrigger]);
}
