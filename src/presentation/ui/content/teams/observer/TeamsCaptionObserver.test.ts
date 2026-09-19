// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TeamsCaptionObserver } from './TeamsCaptionObserver';

describe('TeamsCaptionObserver', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        document.body.innerHTML = `
            <div class="fui-ChatMessageCompact">
                <span data-tid="author">Alice</span>
                <span data-tid="closed-caption-text">Hello everyone</span>
            </div>
        `;
    });

    afterEach(() => {
        document.body.innerHTML = '';
        vi.useRealTimers();
    });

    it('emits a stable caption with its speaker', async () => {
        const onCaption = vi.fn();
        const observer = new TeamsCaptionObserver(onCaption);

        observer.start();
        await vi.advanceTimersByTimeAsync(700);

        expect(onCaption).toHaveBeenCalledWith({
            speaker: 'Alice',
            text: 'Hello everyone',
        });
        observer.stop();
    });

    it('waits for the latest text and deduplicates repeated DOM nodes', async () => {
        const onCaption = vi.fn();
        const observer = new TeamsCaptionObserver(onCaption);
        const caption = document.querySelector('[data-tid="closed-caption-text"]')!;

        observer.start();
        caption.textContent = 'Hello everyone, welcome';
        await vi.advanceTimersByTimeAsync(820);

        expect(onCaption).toHaveBeenCalledTimes(1);
        expect(onCaption).toHaveBeenLastCalledWith({
            speaker: 'Alice',
            text: 'Hello everyone, welcome',
        });

        document.body.appendChild(document.querySelector('.fui-ChatMessageCompact')!.cloneNode(true));
        await vi.advanceTimersByTimeAsync(820);
        expect(onCaption).toHaveBeenCalledTimes(1);
        observer.stop();
    });
});
