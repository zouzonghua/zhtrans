import { useState } from 'preact/hooks';
import { Translation } from '@/domain/entities/Translation';
import { calculatePopupPosition, PopupPosition } from '../utils/positioning';

export interface TranslationState {
    isLoading: boolean;
    result: Translation | null;
    popupPos: PopupPosition | null;
    isSpeaking: boolean;
}

/**
 * 翻译流程管理 Hook
 * 处理 API 调用、状态流转和弹窗位置计算
 */
export function useTranslationFlow(
    onTranslate: (text: string) => Promise<Translation>,
    onSpeak: (text: string) => Promise<void>,
    onStopSpeak: () => void
) {
    const [state, setState] = useState<TranslationState>({
        isLoading: false,
        result: null,
        popupPos: null,
        isSpeaking: false,
    });

    const translate = async (text: string, rect: DOMRect) => {
        setState(s => ({ ...s, isLoading: true }));
        try {
            const translation = await onTranslate(text);

            const pos = calculatePopupPosition(
                rect,
                window.innerWidth,
                window.innerHeight,
                !!translation.dictionary && translation.dictionary.length > 0
            );

            setState({
                isLoading: false,
                result: translation,
                popupPos: pos,
                isSpeaking: false,
            });
        } catch (error) {
            console.error("Glimpse Error:", error);
            setState(s => ({ ...s, isLoading: false }));
        }
    };

    const speak = async (text: string) => {
        setState(s => ({ ...s, isSpeaking: true }));
        try {
            await onSpeak(text);
        } finally {
            setState(s => ({ ...s, isSpeaking: false }));
        }
    };

    const reset = () => {
        setState({
            isLoading: false,
            result: null,
            popupPos: null,
            isSpeaking: false,
        });
        onStopSpeak();
    };

    return { ...state, translate, speak, reset };
}
