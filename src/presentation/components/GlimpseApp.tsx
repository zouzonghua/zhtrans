import { h } from 'preact';
import { useCallback } from 'preact/hooks';
import { Translation } from '@/domain/entities/Translation';
import { Trigger } from './Trigger';
import { Popup } from './Popup';
import { TranslationContent } from './TranslationContent';
import { useSelection } from '../hooks/useSelection';
import { useTranslationFlow } from '../hooks/useTranslationFlow';
import { useDismissal } from '../hooks/useDismissal';

interface Props {
  onTranslate: (text: string) => Promise<Translation>;
  onSpeak: (text: string) => Promise<void>;
  onStopSpeak: () => void;
}

/**
 * Glimpse 主组件 (Orchestrator)
 * 
 * 职责：
 * 1. 协调各个 Hook (Selection, Translation, Dismissal)
 * 2. 组合 UI 组件 (Trigger, Popup)
 * 3. 处理组件间的交互 (如点击 Trigger 触发翻译)
 */
export const GlimpseApp = ({ onTranslate, onSpeak, onStopSpeak }: Props) => {
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
  // 当需要重置所有状态时（如点击外部、滚动偏移等），同时清理选区和翻译结果
  const handleReset = useCallback(() => {
    clearSelection();
    resetTranslation();
  }, [clearSelection, resetTranslation]);

  const { isClosing } = useDismissal(result, handleReset);

  /**
   * 处理触发图标点击
   * 执行翻译请求，并在请求开始时隐藏触发图标
   */
  const handleTriggerClick = async (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selection) return;

    // 清除触发图标，避免在加载时重复点击
    setTriggerPos(null);

    // 发起翻译 (Hook 内部会自动计算弹窗位置)
    await translate(selection.text, selection.rect);
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
            onSpeak={() => speak(result.original)}
          />
        </Popup>
      )}
    </div>
  );
};