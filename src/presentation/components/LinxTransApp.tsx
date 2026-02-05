import { h } from 'preact';
import { Translation } from '@/domain/entities/Translation';
import { Trigger } from './Trigger';
import { Popup } from './Popup';
import { TranslationContent } from './TranslationContent';
import { useLinxTransModel } from '../hooks/useLinxTransModel';

interface Props {
  onTranslate: (text: string) => Promise<Translation>;
  onSpeak: (text: string) => Promise<void>;
  onStopSpeak: () => void;
}

/**
 * LinxTrans 主组件 (View)
 * 
 * 职责：
 * 1. 纯 UI 渲染 (Dumb Component)
 * 2. 从 ViewModel (useLinxTransModel) 获取数据和回调
 */
export const LinxTransApp = (props: Props) => {
  const { state, actions } = useLinxTransModel(props);
  const { triggerPos, popupPos, isLoading, result, isSpeaking, isClosing } = state;
  const { handleTriggerClick, handleExternalClick, handleSpeak } = actions;

  return (
    <div id="linxtrans-wrapper">
      {triggerPos && (
        <Trigger
          x={triggerPos.x}
          y={triggerPos.y}
          isLoading={isLoading}
          onMouseDown={handleTriggerClick}
        />
      )}

      {popupPos && (result || isLoading) && (
        <Popup
          {...popupPos}
          className={isClosing ? 'linxtrans-popup--closing' : ''}
          onExternalClick={handleExternalClick}
        >
          <TranslationContent
            result={result}
            isLoading={isLoading}
            isSpeaking={isSpeaking}
            onSpeak={handleSpeak}
          />
        </Popup>
      )}
    </div>
  );
};