import { useState, useCallback, useEffect, useRef } from 'preact/hooks';
import { Translation } from '@/domain/entities/Translation';
import { ANIMATION_DURATION_MS } from '@/presentation/ui/content/lookup/constants';

/**
 * 弹窗关闭与全局交互控制 Hook
 */
export function useDismissal(
    result: Translation | null,
    onReset: () => void,
    triggerPos: { x: number; y: number } | null
) {
    const [isClosing, setIsClosing] = useState(false);
    const resultRef = useRef<Translation | null>(null);
    // Ref to track the timeout so we can clear it
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // 同步 result 到 ref 以便在 event listener 中获取最新值
    useEffect(() => {
        resultRef.current = result;
    }, [result]);

    const fadeOutAndHide = useCallback(() => {
        if (isClosing) return;
        setIsClosing(true);

        timeoutRef.current = setTimeout(() => {
            onReset();
            setIsClosing(false);
            timeoutRef.current = null;
        }, ANIMATION_DURATION_MS);
    }, [isClosing, onReset]);

    // Cleanup timeout on unmount or if state changes
    useEffect(() => {
        // If trigger appears or result appears, cancel any pending close
        if ((triggerPos || result) && timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
            setIsClosing(false);
        }
    }, [triggerPos, result]);

    useEffect(() => {
        const handleScroll = () => {
            if (resultRef.current) {
                // 如果有结果显示，滚动时渐隐关闭
                fadeOutAndHide();
            } else {
                // 如果仅显示图标，滚动时直接重置
                onReset();
            }
        };

        const handleHideEvent = () => {
            fadeOutAndHide();
        };

        window.addEventListener('scroll', handleScroll, { capture: true, passive: true });
        window.addEventListener('linxtrans:hide', handleHideEvent);

        // 暴露给全局 (window.linxtransHideAll)
        (window as any).linxtransHideAll = fadeOutAndHide;

        return () => {
            window.removeEventListener('scroll', handleScroll, { capture: true });
            window.removeEventListener('linxtrans:hide', handleHideEvent);
            delete (window as any).linxtransHideAll;
        };
    }, [fadeOutAndHide, onReset]);

    return { isClosing, fadeOutAndHide };
}
