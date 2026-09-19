import { TranslateSubtitleUseCase } from '@/domain/usecases/TranslateSubtitleUseCase';
import { TeamsSubtitleOverlay } from './components/TeamsSubtitleOverlay';
import { useTeamsSubtitleModel } from './hooks/useTeamsSubtitleModel';

interface Props {
    useCase: TranslateSubtitleUseCase;
}

export function TeamsSubtitleApp({ useCase }: Props) {
    const state = useTeamsSubtitleModel(useCase);
    return <TeamsSubtitleOverlay state={state} />;
}
