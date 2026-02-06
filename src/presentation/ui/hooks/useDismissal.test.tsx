// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { h, render } from 'preact';
import { useState } from 'preact/hooks';
import { useDismissal } from './useDismissal';

// Mock types
interface Translation {
    original: string;
    targetLang: string;
    text: string;
}

describe('useDismissal Hook', () => {
    let container: HTMLElement;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
        vi.useFakeTimers();
    });

    afterEach(() => {
        document.body.removeChild(container);
        vi.useRealTimers();
        // Clean up global
        delete (window as any).linxtransHideAll;
    });

    // Helper component to use the hook
    function TestComponent({ onReset, initialTrigger = null }: { onReset: () => void, initialTrigger?: any }) {
        const [triggerPos, setTriggerPos] = useState(initialTrigger);

        // Expose setter for testing
        (window as any).setTestTrigger = setTriggerPos;

        // Pass triggerPos to useDismissal (even if it doesn't accept it yet, to test the fix)
        // @ts-ignore
        const { isClosing } = useDismissal(null, onReset, triggerPos);

        return <div>{isClosing ? 'Closing' : 'Open'}</div>;
    }

    it('should call onReset after delay when linxtransHideAll is called', async () => {
        const onReset = vi.fn();
        render(<TestComponent onReset={onReset} />, container);

        // 1. Call hide
        if ((window as any).linxtransHideAll) {
            (window as any).linxtransHideAll();
        }

        // 2. Advance time
        vi.advanceTimersByTime(210);

        expect(onReset).toHaveBeenCalled();
    });

    it('should CANCEL dismissal when trigger becomes active (Reproduction Test)', async () => {
        const onReset = vi.fn();
        render(<TestComponent onReset={onReset} />, container);

        // 1. Call hide (simulation: mousedown)
        if ((window as any).linxtransHideAll) {
            (window as any).linxtransHideAll();
        }

        // 2. Simulate trigger appearing (simulation: mouseup / selection complete)
        // This simulates the race condition where selection finishes BEFORE the hide timeout fires
        // We use act/setState equivalent by calling the exposed setter
        const setTrigger = (window as any).setTestTrigger;
        if (setTrigger) {
            setTrigger({ x: 100, y: 100 });
        }

        // Wait for Re-render (Preact effects run asynchronously)
        // In a real browser environment, Preact batches updates.
        // We can simulate a tick.
        await Promise.resolve();

        // 3. Advance time past the timeout
        vi.advanceTimersByTime(210);

        // 4. Expect reset NOT to be called because we have an active trigger
        // This assertion will FAIL until we implement the fix
        expect(onReset).not.toHaveBeenCalled();
    });
});
