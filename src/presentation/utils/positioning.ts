import { POPUP_WIDTH, HALF_POPUP_WIDTH, HEIGHT_DICT, HEIGHT_SIMPLE, OFFSET_POPUP_TOP_MARGIN, OFFSET_POPUP_BOTTOM_MARGIN, POPUP_OFFSET_X_MIN } from '../constants';

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
    isDictionary: boolean
): PopupPosition {
    const centerX = rect.left + rect.width / 2;
    const estimatedHeight = isDictionary ? HEIGHT_DICT : HEIGHT_SIMPLE;

    const isBottom = windowHeight - rect.bottom > estimatedHeight;

    // Calculate Left Position
    // Ensure popup doesn't go off-screen left or right
    // Right boundary: windowWidth - (POPUP_WIDTH + 10) roughly
    const maxLeft = windowWidth - (POPUP_WIDTH + 10);
    const left = Math.max(POPUP_OFFSET_X_MIN, Math.min(maxLeft, centerX - HALF_POPUP_WIDTH));

    // Calculate Top Position
    const top = isBottom
        ? rect.bottom + OFFSET_POPUP_BOTTOM_MARGIN
        : rect.top - estimatedHeight - OFFSET_POPUP_TOP_MARGIN;

    // Calculate Tail Position (percentage)
    // Relative to the popup width
    const tailPos = ((centerX - left) / POPUP_WIDTH) * 100;

    return { x: left, y: top, isBottom, tailPos };
}
