// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from 'preact';
import { useState } from 'preact/hooks';
import { act } from 'preact/test-utils';
import { useDismissal } from './useDismissal';

describe('useDismissal Hook', () => {
    let container: HTMLElement;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
        // Do NOT use fake timers globally for setup
    });

    afterEach(() => {
        document.body.removeChild(container);
        vi.useRealTimers();
        if ((window as any).linxtransHideAll) {
            delete (window as any).linxtransHideAll;
        }
    });

    // Helper component to use the hook
    function TestComponent({ onReset, initialTrigger = null }: { onReset: () => void, initialTrigger?: any }) {
        const [triggerPos, setTriggerPos] = useState(initialTrigger);

        // Expose setter for testing
        (window as any).setTestTrigger = setTriggerPos;

        // Pass triggerPos to useDismissal
        // @ts-ignore
        const { isClosing } = useDismissal(null, onReset, triggerPos);

        return <div>{isClosing ? 'Closing' : 'Open'}</div>;
    }

    it('should call onReset after delay when linxtransHideAll is called', async () => {
        const onReset = vi.fn();

        await act(async () => {
            render(<TestComponent onReset={onReset} />, container);
            // Wait for effects
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        // 1. Call hide
        if ((window as any).linxtransHideAll) {
            // Now switch to fake timers to control the animation delay
            vi.useFakeTimers();

            await act(async () => {
                (window as any).linxtransHideAll();
                // Trigger any immediate state updates
            });

        } else {
            throw new Error('linxtransHideAll not defined on window - effects did not run');
        }

        // 2. Advance time for animation duration (200ms)
        await act(async () => {
            vi.advanceTimersByTime(210);
        });

        expect(onReset).toHaveBeenCalled();
    });

    it('should CANCEL dismissal when trigger becomes active (Reproduction Test)', async () => {
        const onReset = vi.fn();

        await act(async () => {
            render(<TestComponent onReset={onReset} />, container);
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        // Use fake timers for this test too
        vi.useFakeTimers();

        // 1. Call hide (simulation: mousedown)
        if ((window as any).linxtransHideAll) {
            await act(async () => {
                (window as any).linxtransHideAll();
            });
        }

        // 2. Simulate trigger appearing (simulation: mouseup / selection complete)
        const setTrigger = (window as any).setTestTrigger;
        if (setTrigger) {
            await act(async () => {
                setTrigger({ x: 100, y: 100 });
            });
        }

        // 3. Advance time past the timeout
        await act(async () => {
            vi.advanceTimersByTime(210);
        });

        // 4. Expect reset NOT to be called because we have an active trigger
        expect(onReset).not.toHaveBeenCalled();
    });
});
