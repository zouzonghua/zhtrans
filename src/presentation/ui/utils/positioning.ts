import { POPUP_WIDTH, HEIGHT_DICT, HEIGHT_SIMPLE, OFFSET_POPUP_TOP_MARGIN, OFFSET_POPUP_BOTTOM_MARGIN, POPUP_OFFSET_X_MIN } from '@/presentation/ui/content/lookup/constants';

export interface PopupPosition {
    x: number;
    y: number;
    isBottom: boolean;
    tailPos: number;
}

export function calculatePopupPosition(
    rect: DOMRect,
    windowWidth: number,
    windowHeight: number,
    isDictionary: boolean,
    popupSize?: { width: number; height: number }
): PopupPosition {
    const centerX = rect.left + rect.width / 2;
    const popupWidth = popupSize?.width ?? POPUP_WIDTH;
    const halfPopupWidth = popupWidth / 2;
    const estimatedHeight = popupSize?.height ?? (isDictionary ? HEIGHT_DICT : HEIGHT_SIMPLE);

    const isBottom = windowHeight - rect.bottom > estimatedHeight;

    // Calculate Left Position
    // Ensure popup doesn't go off-screen left or right
    // Right boundary: windowWidth - (POPUP_WIDTH + 10) roughly
    const maxLeft = windowWidth - (popupWidth + 10);
    const left = Math.max(POPUP_OFFSET_X_MIN, Math.min(maxLeft, centerX - halfPopupWidth));

    // Calculate Top Position
    let top = isBottom
        ? rect.bottom + OFFSET_POPUP_BOTTOM_MARGIN
        : rect.top - estimatedHeight - OFFSET_POPUP_TOP_MARGIN;

    // Clamp to viewport if content is larger than expected
    if (top + estimatedHeight > windowHeight) {
        top = Math.max(OFFSET_POPUP_TOP_MARGIN, windowHeight - estimatedHeight - OFFSET_POPUP_BOTTOM_MARGIN);
    }
    if (top < OFFSET_POPUP_TOP_MARGIN) {
        top = OFFSET_POPUP_TOP_MARGIN;
    }

    // Calculate Tail Position (percentage)
    // Relative to the popup width
    const rawTailPos = ((centerX - left) / popupWidth) * 100;
    const tailPos = Math.max(0, Math.min(100, rawTailPos));

    return { x: left, y: top, isBottom, tailPos };
}
