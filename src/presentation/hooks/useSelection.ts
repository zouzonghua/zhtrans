import { useState, useEffect } from 'preact/hooks';
import { SELECTION_MAX_LENGTH, OFFSET_TRIGGER_X, OFFSET_TRIGGER_Y } from '../constants';

export interface SelectionState {
    text: string;
    rect: DOMRect;
}

export interface TriggerState {
    x: number;
    y: number;
}

/**
 * 文本选区管理 Hook
 * 监听全局 mouseup 事件，检测用户选中文本
 */
export function useSelection() {
    const [selection, setSelection] = useState<SelectionState | null>(null);
    const [triggerPos, setTriggerPos] = useState<TriggerState | null>(null);

    useEffect(() => {
        const handleMouseUp = () => {
            const sel = window.getSelection();
            const text = sel?.toString().trim();

            if (text && text.length > 0 && text.length < SELECTION_MAX_LENGTH) {
                const range = sel!.getRangeAt(0);
                const rect = range.getBoundingClientRect();

                setSelection({ text, rect });
                setTriggerPos({
                    x: rect.right + OFFSET_TRIGGER_X,
                    y: rect.top - OFFSET_TRIGGER_Y
                });
            }
        };

        document.addEventListener('mouseup', handleMouseUp);
        return () => document.removeEventListener('mouseup', handleMouseUp);
    }, []);

    const clearSelection = () => {
        setSelection(null);
        setTriggerPos(null);
    };

    return { selection, triggerPos, setTriggerPos, clearSelection };
}
