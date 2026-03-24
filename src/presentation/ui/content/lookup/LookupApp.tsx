
import { Trigger } from './components/Trigger';
import { Popup } from './components/Popup';
import { TranslationContent } from './components/TranslationContent';
import { LookupUseCase } from '@/domain/usecases/LookupUseCase';
import { useLookupModel } from '@/presentation/ui/content/lookup/hooks/useLookupModel';

import { SpeakTextUseCase } from '@/domain/usecases/SpeakTextUseCase';

interface Props {
  useCase: LookupUseCase;
  speakUseCase: SpeakTextUseCase;
}

/**
 * Lookup 主组件 (View)
 * 
 * 职责：
 * 1. 纯 UI 渲染 (Dumb Component)
 * 2. 从 ViewModel (useLookupModel) 获取数据和回调
 */
export const LookupApp = (props: Props) => {
  const { state, actions } = useLookupModel(props.useCase, props.speakUseCase);
  const { triggerPos, popupPos, isLoading, result, isSpeaking, isClosing, error } = state;
  const { handleTriggerClick, handleExternalClick, handleSpeak, handleRetry, handleReposition } = actions;

  return (
    <div id="zhtrans-wrapper">
      {triggerPos && (
        <Trigger
          x={triggerPos.x}
          y={triggerPos.y}
          isLoading={isLoading}
          onMouseDown={handleTriggerClick}
        />
      )}

      {popupPos && (result || isLoading || error) && (
        <Popup
          {...popupPos}
          className={isClosing ? 'zhtrans-popup--closing' : ''}
          onExternalClick={handleExternalClick}
          onReposition={handleReposition}
        >
          <TranslationContent
            result={result}
            isLoading={isLoading}
            isSpeaking={isSpeaking}
            onSpeak={handleSpeak}
            error={error}
            onRetry={handleRetry}
          />
        </Popup>
      )}
    </div>
  );
};
