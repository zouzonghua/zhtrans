import { useCallback } from 'preact/hooks';
import { Translation } from '@/domain/entities/Translation';
import { useSelection } from './useSelection';
import { useTranslationFlow } from './useTranslationFlow';
import { useDismissal } from './useDismissal';
import { useShortcutTrigger } from './useShortcutTrigger';

interface UseGlimpseModelProps {
    onTranslate: (text: string) => Promise<Translation>;
    onSpeak: (text: string) => Promise<void>;
    onStopSpeak: () => void;
}

/**
 * Glimpse ViewModel
 * 
 * 职责：
 * 1. 聚合所有底层 Hooks (Model)
 * 2. 暴露统一的 UI State 和 Actions 给 View (GlimpseApp)
 * 3. 处理交互逻辑（Presenter）
 */
export function useGlimpseModel({ onTranslate, onSpeak, onStopSpeak }: UseGlimpseModelProps) {
    // 1. 选区管理
    const { selection, triggerPos, setTriggerPos, clearSelection } = useSelection();

    // 2. 翻译流程管理
    const {
        isLoading,
        result,
        popupPos,
        isSpeaking,
        translate,
        speak,
        reset: resetTranslation
    } = useTranslationFlow(onTranslate, onSpeak, onStopSpeak);

    // 3. 关闭逻辑管理
    const handleReset = useCallback(() => {
        clearSelection();
        resetTranslation();
    }, [clearSelection, resetTranslation]);

    const { isClosing } = useDismissal(result, handleReset);

    // 4. 快捷键监听
    useShortcutTrigger(useCallback((text, rect) => {
        setTriggerPos(null);
        translate(text, rect);
    }, [setTriggerPos, translate]));


    // --- Actions ---

    /**
     * 点击触发图标
     */
    const handleTriggerClick = async (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!selection) return;

        setTriggerPos(null);
        await translate(selection.text, selection.rect);
    };

    /**
     * 点击外部链接 (Google / Wiki)
     */
    const handleExternalClick = (type: 'dict' | 'wiki') => {
        if (!result) return;
        let url = "";
        if (type === 'dict') {
            url = `https://translate.google.com/?sl=auto&tl=${result.targetLang}&text=${encodeURIComponent(result.original)}&op=translate`;
        } else {
            const wikiLang = result.targetLang.startsWith('zh') ? 'zh' : 'en';
            url = `https://${wikiLang}.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(result.original)}`;
        }
        window.open(url, '_blank');
    };

    /**
     *朗读
     */
    const handleSpeak = () => {
        if (result) {
            speak(result.original);
        }
    };


    return {
        // UI State
        state: {
            triggerPos,
            popupPos,
            isLoading,
            result,
            isSpeaking,
            isClosing
        },
        // UI Actions
        actions: {
            handleTriggerClick,
            handleExternalClick,
            handleSpeak
        }
    };
}
