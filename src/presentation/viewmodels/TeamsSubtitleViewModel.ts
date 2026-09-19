import { TranslateSubtitleUseCase } from '@/domain/usecases/TranslateSubtitleUseCase';
import {
    TeamsCaption,
    TeamsCaptionObserver,
    TeamsCaptionSource,
} from '@/presentation/ui/content/teams/observer/TeamsCaptionObserver';

export interface TeamsSubtitleState {
    speaker: string;
    originalText: string;
    translatedText: string;
    isLoading: boolean;
    error: string | null;
    isWaiting: boolean;
}

type Listener = (state: TeamsSubtitleState) => void;

/** 协调 Teams 字幕监听与翻译，并阻止旧请求覆盖最新字幕。 */
export class TeamsSubtitleViewModel {
    private state: TeamsSubtitleState = {
        speaker: '',
        originalText: '',
        translatedText: '',
        isLoading: false,
        error: null,
        isWaiting: true,
    };
    private listeners: Listener[] = [];
    private requestSequence = 0;
    private clearTimer: number | null = null;
    private captionSource: TeamsCaptionSource;

    constructor(
        private useCase: TranslateSubtitleUseCase,
        createCaptionSource: (onCaption: (caption: TeamsCaption | null) => void) => TeamsCaptionSource =
            (onCaption) => new TeamsCaptionObserver(onCaption),
    ) {
        this.captionSource = createCaptionSource(this.handleCaption);
    }

    public init() {
        this.captionSource.start();
    }

    public dispose() {
        this.requestSequence += 1;
        this.captionSource.stop();
        if (this.clearTimer !== null) window.clearTimeout(this.clearTimer);
        this.clearTimer = null;
    }

    public subscribe(listener: Listener): () => void {
        this.listeners.push(listener);
        listener(this.state);
        return () => {
            this.listeners = this.listeners.filter((item) => item !== listener);
        };
    }

    public getState(): TeamsSubtitleState {
        return this.state;
    }

    private handleCaption = (caption: TeamsCaption | null) => {
        if (!caption) {
            this.scheduleClear();
            return;
        }

        if (this.clearTimer !== null) {
            window.clearTimeout(this.clearTimer);
            this.clearTimer = null;
        }

        const sequence = ++this.requestSequence;
        this.setState({
            speaker: caption.speaker,
            originalText: caption.text,
            translatedText: '',
            isLoading: true,
            error: null,
            isWaiting: false,
        });
        void this.translate(caption.text, sequence);
    };

    private async translate(text: string, sequence: number) {
        try {
            const result = await this.useCase.execute(text);
            if (sequence !== this.requestSequence) return;
            this.setState({
                translatedText: result.translation.translated,
                isLoading: false,
                error: null,
            });
        } catch (error) {
            if (sequence !== this.requestSequence) return;
            this.setState({
                isLoading: false,
                error: error instanceof Error ? error.message : 'Translation failed.',
            });
        }
    }

    private scheduleClear() {
        if (this.clearTimer !== null) return;
        this.clearTimer = window.setTimeout(() => {
            this.clearTimer = null;
            this.requestSequence += 1;
            this.setState({
                speaker: '',
                originalText: '',
                translatedText: '',
                isLoading: false,
                error: null,
                isWaiting: true,
            });
        }, 3000);
    }

    private setState(partial: Partial<TeamsSubtitleState>) {
        this.state = { ...this.state, ...partial };
        for (const listener of this.listeners) listener(this.state);
    }
}
