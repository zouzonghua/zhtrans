import { useEffect, useMemo, useState } from 'preact/hooks';
import { TranslateSubtitleUseCase } from '@/domain/usecases/TranslateSubtitleUseCase';
import {
    TeamsSubtitleState,
    TeamsSubtitleViewModel,
} from '@/presentation/viewmodels/TeamsSubtitleViewModel';

export function useTeamsSubtitleModel(useCase: TranslateSubtitleUseCase) {
    const viewModel = useMemo(() => new TeamsSubtitleViewModel(useCase), [useCase]);
    const [state, setState] = useState<TeamsSubtitleState>(viewModel.getState());

    useEffect(() => {
        const unsubscribe = viewModel.subscribe(setState);
        viewModel.init();

        return () => {
            unsubscribe();
            viewModel.dispose();
        };
    }, [viewModel]);

    return state;
}
