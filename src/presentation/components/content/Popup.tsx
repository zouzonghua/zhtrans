import { h, ComponentChildren } from 'preact';
import { LABEL_DICT, LABEL_WIKI } from '../../constants';

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
  <div className={`linxtrans-popup ${className}`} style={{ left: x, top: y }}>
    {/* 定位尖角 */}
    <div
      className={`linxtrans-popup__tail ${isBottom ? 'linxtrans-popup__tail--top' : 'linxtrans-popup__tail--bottom'}`}
      style={{ left: `${tailPos}%` }}
    >
      <div className="linxtrans-popup__tail-in"></div>
    </div>

    {children}

    {/* 底部导航 */}
    <div className="linxtrans-popup__footer">
      <div className="linxtrans-popup__footer-item" onClick={() => onExternalClick('dict')}>{LABEL_DICT}</div>
      <div className="linxtrans-popup__footer-item" onClick={() => onExternalClick('wiki')}>{LABEL_WIKI}</div>
    </div>
  </div>
);