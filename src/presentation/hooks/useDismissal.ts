import { useState, useCallback, useEffect, useRef } from 'preact/hooks';
import { Translation } from '@/domain/entities/Translation';
import { ANIMATION_DURATION_MS } from '../constants';

/**
 * 弹窗关闭与全局交互控制 Hook
 */
export function useDismissal(
    result: Translation | null,
    onReset: () => void
) {
    const [isClosing, setIsClosing] = useState(false);
    const resultRef = useRef<Translation | null>(null);

    // 同步 result 到 ref 以便在 event listener 中获取最新值
    useEffect(() => {
        resultRef.current = result;
    }, [result]);

    const fadeOutAndHide = useCallback(() => {
        if (isClosing) return;
        setIsClosing(true);

        setTimeout(() => {
            onReset();
            setIsClosing(false);
        }, ANIMATION_DURATION_MS);
    }, [isClosing, onReset]);

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

        window.addEventListener('scroll', handleScroll, { capture: true, passive: true });

        // 暴露给全局 (window.linxtransHideAll)
        (window as any).linxtransHideAll = fadeOutAndHide;

        return () => {
            window.removeEventListener('scroll', handleScroll, { capture: true });
            delete (window as any).linxtransHideAll;
        };
    }, [fadeOutAndHide, onReset]);

    return { isClosing, fadeOutAndHide };
}
