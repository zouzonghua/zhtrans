import { h, Fragment } from 'preact';
import { Translation } from '@/domain/entities/Translation';
import { SpeakIcon } from '../icons';

interface ContentProps {
  result: Translation;
  isSpeaking: boolean;
  onSpeak: () => void;
}

/**
 * 翻译内容组件：根据数据自动切换单词/句子布局
 */
export const TranslationContent = ({ result, isSpeaking, onSpeak }: ContentProps) => {
  const isSentence = !result.dictionary || result.dictionary.length === 0;

  return (
    <div className="glimpse-popup__content">
      {/* 语言方向提示 */}
      <div className="glimpse-lang-header">
        {/[\u4e00-\u9fa5]/.test(result.original) ? "中文-英文" : "简体中文-英文"}
        <div className="glimpse-separator"></div>
      </div>

      {isSentence ? (
        <Fragment>
          <div className="glimpse-popup__original">{result.original}</div>
          <div className="glimpse-popup__section-label">翻译结果</div>
          <div className="glimpse-popup__header">
            <div className="glimpse-popup__word">{result.translated}</div>
            <SpeakButton active={isSpeaking} onClick={onSpeak} />
          </div>
          {result.phonetic && (
            <div className="glimpse-popup__phonetic glimpse-phonetic-sub">/ {result.phonetic} /</div>
          )}
        </Fragment>
      ) : (
        <Fragment>
          <div className="glimpse-popup__header">
            <span className="glimpse-popup__word">{result.original}</span>
            {result.phonetic && <span className="glimpse-popup__phonetic">| {result.phonetic} |</span>}
            <SpeakButton active={isSpeaking} onClick={onSpeak} />
          </div>
          {result.dictionary!.map(d => (
            <div key={d.pos}>
              <div className="glimpse-popup__section-label">{d.pos}</div>
              {d.definitions.map((def, i) => (
                <div className="glimpse-popup__def-row" key={i}>
                  <span className="glimpse-def-number">
                    {['①', '②', '③', '④', '⑤'][i] || i + 1}
                  </span>
                  <span>{def}</span>
                </div>
              ))}
            </div>
          ))}
        </Fragment>
      )}
    </div>
  );
};

const SpeakButton = ({ active, onClick }: { active: boolean, onClick: () => void }) => (
  <button
    className={`glimpse-btn ${active ? 'glimpse-btn--speaking' : ''}`}
    onClick={onClick}
  >
    <SpeakIcon />
  </button>
);