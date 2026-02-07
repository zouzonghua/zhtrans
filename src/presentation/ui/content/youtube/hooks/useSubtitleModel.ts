import { useState, useEffect, useMemo } from 'preact/hooks';
import { YoutubeSubtitleViewModel, SubtitleState } from '@/presentation/viewmodels/YoutubeSubtitleViewModel';
import { TranslateSubtitleUseCase } from '@/domain/usecases/TranslateSubtitleUseCase';

export function useSubtitleModel(useCase: TranslateSubtitleUseCase) {
    const viewModel = useMemo(() => new YoutubeSubtitleViewModel(useCase), [useCase]);
    const [state, setState] = useState<SubtitleState>(viewModel.getState());

    useEffect(() => {
        // Initial start
        viewModel.init();

        // Subscribe to changes
        const unsubscribe = viewModel.subscribe(setState);

        return () => {
            unsubscribe();
            viewModel.dispose();
        };
    }, [viewModel]);

    return { state, viewModel };
}
