import { describe, it, expect } from 'vitest';
import { calculatePopupPosition, PopupPosition } from './positioning';
import { POPUP_WIDTH, HEIGHT_DICT, OFFSET_POPUP_BOTTOM_MARGIN, OFFSET_POPUP_TOP_MARGIN } from '@/presentation/ui/common/constants';

describe('calculatePopupPosition', () => {
    const windowWidth = 1000;
    const windowHeight = 800;

    it('should position popup below selection if there is space', () => {
        const rect = {
            left: 400,
            width: 100,
            bottom: 200,
            top: 180,
            height: 20,
            right: 500,
            x: 400,
            y: 180,
            toJSON: () => { }
        } as DOMRect;

        const pos = calculatePopupPosition(rect, windowWidth, windowHeight, true);

        expect(pos.isBottom).toBe(true);
        expect(pos.y).toBe(rect.bottom + OFFSET_POPUP_BOTTOM_MARGIN);
    });

    it('should position popup above selection if no space below', () => {
        const rect = {
            left: 400,
            width: 100,
            bottom: 780, // Near bottom
            top: 760,
            height: 20,
            right: 500,
            x: 400,
            y: 760,
            toJSON: () => { }
        } as DOMRect;

        const pos = calculatePopupPosition(rect, windowWidth, windowHeight, true);

        expect(pos.isBottom).toBe(false);
        // Should be above: top - estimatedHeight - margin
        expect(pos.y).toBe(rect.top - HEIGHT_DICT - OFFSET_POPUP_TOP_MARGIN);
    });

    it('should clamp popup to left edge', () => {
        const rect = {
            left: 10, // Very far left
            width: 20,
            bottom: 200,
            top: 180,
            height: 20,
            right: 20,
            x: 10,
            y: 180,
            toJSON: () => { }
        } as DOMRect;

        const pos = calculatePopupPosition(rect, windowWidth, windowHeight, true);

        expect(pos.x).toBe(10); // Minimum offset
        // Tail should adjust
        // centerX = 20
        // left = 10
        // tailPos = (10 / 320) * 100 = 3.125%
        expect(pos.tailPos).toBeCloseTo(3.125);
    });

    it('should clamp popup to right edge', () => {
        const rect = {
            left: 980, // Very far right
            width: 20,
            bottom: 200,
            top: 180,
            height: 20,
            right: 1000,
            x: 980,
            y: 180,
            toJSON: () => { }
        } as DOMRect;

        const pos = calculatePopupPosition(rect, windowWidth, windowHeight, true);

        // maxLeft = 1000 - 330 = 670 (using constant margin)
        // actually logic uses: windowWidth - (POPUP_WIDTH + 10) = 1000 - 330 = 670.
        // centerX = 990
        // raw left = 990 - 160 = 830
        // maxLeft = 670

        expect(pos.x).toBe(670);
    });
});
