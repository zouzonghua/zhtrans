import { TranslateSubtitleUseCase } from '@/domain/usecases/TranslateSubtitleUseCase';
import { useSubtitleModel } from './hooks/useSubtitleModel';
import { SubtitleOverlay } from './components/SubtitleOverlay';

interface Props {
    useCase: TranslateSubtitleUseCase;
}

export const YoutubeSubtitleApp = ({ useCase }: Props) => {
    const { state } = useSubtitleModel(useCase);

    return <SubtitleOverlay state={state} />;
};
