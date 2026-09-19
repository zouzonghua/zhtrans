// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TranslateSubtitleUseCase, SubtitleTranslationResult } from '@/domain/usecases/TranslateSubtitleUseCase';
import { TeamsCaption, TeamsCaptionSource } from '@/presentation/ui/content/teams/observer/TeamsCaptionObserver';
import { TeamsSubtitleViewModel } from './TeamsSubtitleViewModel';

function deferred<T>() {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>((done) => {
        resolve = done;
    });
    return { promise, resolve };
}

function result(original: string, translated: string): SubtitleTranslationResult {
    return {
        fromCache: false,
        translation: {
            original,
            translated,
            srcLang: 'en',
            targetLang: 'zh-CN',
            type: 'subtitle',
        },
    };
}

describe('TeamsSubtitleViewModel', () => {
    afterEach(() => vi.useRealTimers());

    it('keeps an older translation response from replacing the latest caption', async () => {
        let emit!: (caption: TeamsCaption | null) => void;
        const source: TeamsCaptionSource = { start: vi.fn(), stop: vi.fn() };
        const first = deferred<SubtitleTranslationResult>();
        const second = deferred<SubtitleTranslationResult>();
        const execute = vi.fn()
            .mockReturnValueOnce(first.promise)
            .mockReturnValueOnce(second.promise);
        const useCase = { execute } as unknown as TranslateSubtitleUseCase;
        const viewModel = new TeamsSubtitleViewModel(useCase, (listener) => {
            emit = listener;
            return source;
        });

        viewModel.init();
        emit({ speaker: 'Alice', text: 'First sentence' });
        emit({ speaker: 'Bob', text: 'Second sentence' });

        second.resolve(result('Second sentence', '第二句'));
        await second.promise;
        first.resolve(result('First sentence', '第一句'));
        await first.promise;
        await Promise.resolve();

        expect(viewModel.getState()).toMatchObject({
            speaker: 'Bob',
            originalText: 'Second sentence',
            translatedText: '第二句',
            isLoading: false,
        });
        viewModel.dispose();
        expect(source.stop).toHaveBeenCalledOnce();
    });

    it('returns to waiting state after captions disappear', () => {
        vi.useFakeTimers();
        let emit!: (caption: TeamsCaption | null) => void;
        const useCase = {
            execute: vi.fn().mockResolvedValue(result('Hello', '你好')),
        } as unknown as TranslateSubtitleUseCase;
        const viewModel = new TeamsSubtitleViewModel(useCase, (listener) => {
            emit = listener;
            return { start: vi.fn(), stop: vi.fn() };
        });

        viewModel.init();
        emit({ speaker: 'Alice', text: 'Hello' });
        emit(null);
        vi.advanceTimersByTime(3000);

        expect(viewModel.getState()).toMatchObject({
            originalText: '',
            translatedText: '',
            isWaiting: true,
        });
        viewModel.dispose();
    });
});
