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
        // 立即计算位置，以便显示 Loading 状态
        // 初始假设 minimal content (no dictionary)
        const initialPos = calculatePopupPosition(
            rect,
            window.innerWidth,
            window.innerHeight,
            false
        );

        setState(s => ({
            ...s,
            isLoading: true,
            popupPos: initialPos,
            result: null // Clear previous result
        }));

        try {
            const translation = await onTranslate(text);

            // 翻译完成后重新计算位置（因为内容高度可能变化）
            const finalPos = calculatePopupPosition(
                rect,
                window.innerWidth,
                window.innerHeight,
                !!translation.dictionary && translation.dictionary.length > 0
            );

            setState({
                isLoading: false,
                result: translation,
                popupPos: finalPos,
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
