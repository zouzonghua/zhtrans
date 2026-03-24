import { ComponentChildren } from 'preact';
import { useEffect, useLayoutEffect, useRef } from 'preact/hooks';
import { LABEL_DICT, LABEL_WIKI } from '@/presentation/ui/content/lookup/constants';

interface PopupProps {
  x: number;
  y: number;
  isBottom: boolean;
  tailPos: number;
  children: ComponentChildren;
  onExternalClick: (type: 'dict' | 'wiki') => void;
  onReposition?: (rect: DOMRect) => void;
  className?: string;
}

/**
 * 翻译结果弹窗外壳
 */
export const Popup = ({ x, y, isBottom, tailPos, children, onExternalClick, onReposition, className = "" }: PopupProps) => {
  const popupRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!popupRef.current || !onReposition) return;
    onReposition(popupRef.current.getBoundingClientRect());
  }, [x, y, isBottom, tailPos, children, onReposition]);

  useEffect(() => {
    if (!onReposition) return;
    const handleResize = () => {
      if (!popupRef.current) return;
      onReposition(popupRef.current.getBoundingClientRect());
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [onReposition]);

  return (
    <div ref={popupRef} className={`zhtrans-popup ${className}`} style={{ left: x, top: y }}>
      {/* 定位尖角 */}
      <div
        className={`zhtrans-popup__tail ${isBottom ? 'zhtrans-popup__tail--top' : 'zhtrans-popup__tail--bottom'}`}
        style={{ left: `${tailPos}%` }}
      >
        <div className="zhtrans-popup__tail-in"></div>
      </div>

      {children}

      {/* 底部导航 */}
      <div className="zhtrans-popup__footer">
        <div className="zhtrans-popup__footer-item" onClick={() => onExternalClick('dict')}>{LABEL_DICT}</div>
        <div className="zhtrans-popup__footer-item" onClick={() => onExternalClick('wiki')}>{LABEL_WIKI}</div>
      </div>
    </div>
  );
};
