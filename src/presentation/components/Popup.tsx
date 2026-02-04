import { h, ComponentChildren } from 'preact';
import { LABEL_DICT, LABEL_WIKI } from '../constants';

interface PopupProps {
  x: number;
  y: number;
  isBottom: boolean;
  tailPos: number;
  children: ComponentChildren;
  onExternalClick: (type: 'dict' | 'wiki') => void;
  className?: string;
}

/**
 * 翻译结果弹窗外壳
 */
export const Popup = ({ x, y, isBottom, tailPos, children, onExternalClick, className = "" }: PopupProps) => (
  <div className={`glimpse-popup ${className}`} style={{ left: x, top: y }}>
    {/* 定位尖角 */}
    <div
      className={`glimpse-popup__tail ${isBottom ? 'glimpse-popup__tail--bottom' : 'glimpse-popup__tail--top'}`}
      style={{ left: `${tailPos}%` }}
    >
      <div className="glimpse-popup__tail-in"></div>
    </div>

    {children}

    {/* 底部导航 */}
    <div className="glimpse-popup__footer">
      <div className="glimpse-popup__footer-item" onClick={() => onExternalClick('dict')}>{LABEL_DICT}</div>
      <div className="glimpse-popup__footer-item" onClick={() => onExternalClick('wiki')}>{LABEL_WIKI}</div>
    </div>
  </div>
);