import { h } from 'preact';
import { useState, useEffect, useCallback, useRef } from 'preact/hooks';
import { Translation } from '@/domain/entities/Translation';
import { Trigger } from './Trigger';
import { Popup } from './Popup';
import { TranslationContent } from './TranslationContent';

interface Props {
  onTranslate: (text: string) => Promise<Translation>;
  onSpeak: (text: string) => Promise<void>;
  onStopSpeak: () => void;
}

/**
 * Glimpse 主组件 (Orchestrator)
 */
export const GlimpseApp = ({ onTranslate, onSpeak, onStopSpeak }: Props) => {
  const [selection, setSelection] = useState<{ text: string, rect: DOMRect } | null>(null);
  const [triggerPos, setTriggerPos] = useState<{ x: number, y: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<Translation | null>(null);
  const [popupPos, setPopupPos] = useState<{ x: number, y: number, isBottom: boolean, tailPos: number } | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // 记录结果状态的引用，用于在滚动监听中判断是否需要关闭
  const resultRef = useRef<Translation | null>(null);
  useEffect(() => { resultRef.current = result; }, [result]);

  /**
   * 渐变关闭逻辑
   */
  const fadeOutAndHide = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    // 等待 CSS 动画完成 (200ms) 后彻底隐藏
    setTimeout(() => {
      hideAll();
      setIsClosing(false);
    }, 200);
  }, [isClosing]);

  const hideAll = useCallback(() => {
    setSelection(null);
    setTriggerPos(null);
    setResult(null);
    setPopupPos(null);
    onStopSpeak();
  }, [onStopSpeak]);

  useEffect(() => {
    const handleMouseUp = () => {
      const sel = window.getSelection();
      const text = sel?.toString().trim();

      if (text && text.length > 0 && text.length < 500) {
        const range = sel!.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setSelection({ text, rect });
        setTriggerPos({ x: rect.right + 2, y: rect.top - 28 });
      }
    };

    /**
     * 滚动监听：当页面滚动且弹窗存在时，渐变关闭弹窗。
     * 使用 capture 模式以确保能捕获到局部元素的滚动。
     */
    const handleScroll = () => {
      if (resultRef.current) {
        fadeOutAndHide();
      } else {
        // 如果只是图标阶段，直接隐藏即可
        setTriggerPos(null);
        setSelection(null);
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('scroll', handleScroll, { capture: true, passive: true });
    
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('scroll', handleScroll, { capture: true });
    };
  }, [fadeOutAndHide]);

  const handleTriggerClick = async (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selection) return;

    setIsLoading(true);
    try {
      const translation = await onTranslate(selection.text);
      setResult(translation);
      
      const rect = selection.rect;
      const centerX = rect.left + rect.width / 2;
      const estimatedHeight = translation.dictionary ? 320 : 200;
      const isBottom = window.innerHeight - rect.bottom > estimatedHeight;
      const left = Math.max(10, Math.min(window.innerWidth - 330, centerX - 160));
      const top = isBottom ? rect.bottom + 12 : rect.top - estimatedHeight - 20;
      const tailPos = ((centerX - left) / 320) * 100;

      setPopupPos({ x: left, y: top, isBottom, tailPos });
      setTriggerPos(null);
    } catch (error) {
      console.error("Glimpse Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

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

  useEffect(() => {
    (window as any).glimpseHideAll = fadeOutAndHide;
  }, [fadeOutAndHide]);

  return (
    <div id="glimpse-wrapper">
      {triggerPos && (
        <Trigger 
          x={triggerPos.x} 
          y={triggerPos.y} 
          isLoading={isLoading} 
          onMouseDown={handleTriggerClick} 
        />
      )}

      {result && popupPos && (
        <Popup 
          {...popupPos} 
          className={isClosing ? 'glimpse-popup--closing' : ''}
          onExternalClick={handleExternalClick}
        >
          <TranslationContent 
            result={result}
            isSpeaking={isSpeaking}
            onSpeak={async () => {
              setIsSpeaking(true);
              try { await onSpeak(result.original); } 
              finally { setIsSpeaking(false); }
            }}
          />
        </Popup>
      )}
    </div>
  );
};