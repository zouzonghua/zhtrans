import { useEffect } from 'preact/hooks';
import { SELECTION_MAX_LENGTH, OFFSET_TRIGGER_X, OFFSET_TRIGGER_Y } from '@/presentation/ui/content/lookup/constants';

interface SelectionInfo {
    text: string;
    rect: DOMRect;
    triggerPos: { x: number; y: number };
}

/**
 * 监听用户选区操作 (鼠标抬起)
 * @param onSelection 选区有效时的回调
 * @param disabled 是否禁用 (例如弹窗已打开时)
 */
export function useSelectionTrigger(
    onSelection: (info: SelectionInfo) => void,
    disabled: boolean = false
) {
    useEffect(() => {
        const handleMouseUp = () => {
            if (disabled) return;

            const sel = window.getSelection();
            const text = sel?.toString().trim();

            if (!text || text.length === 0 || text.length > SELECTION_MAX_LENGTH) {
                return;
            }

            const range = sel!.getRangeAt(0);
            const rect = range.getBoundingClientRect();

            // 计算触发图标位置
            const triggerPos = {
                x: rect.right + OFFSET_TRIGGER_X,
                y: rect.top - OFFSET_TRIGGER_Y
            };

            onSelection({ text, rect, triggerPos });
        };

        document.addEventListener('mouseup', handleMouseUp);
        return () => document.removeEventListener('mouseup', handleMouseUp);
    }, [onSelection, disabled]);
}
