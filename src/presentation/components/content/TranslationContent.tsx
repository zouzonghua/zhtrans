import { h, Fragment } from 'preact';
import { Translation } from '@/domain/entities/Translation';
import { SpeakIcon } from '../../icons';

interface ContentProps {
  result: Translation | null;
  isLoading: boolean;
  isSpeaking: boolean;
  onSpeak: () => void;
  error?: string | null;
  onRetry?: () => void;
}

/**
 * 翻译内容组件：根据数据自动切换单词/句子布局
 */
export const TranslationContent = ({ result, isLoading, isSpeaking, onSpeak, error, onRetry }: ContentProps) => {
  if (isLoading) {
    return (
      <div className="linxtrans-popup__content">
        <div className="linxtrans-lang-header">
          正在翻译...
        </div>
        <div className="linxtrans-skeleton">
          <div className="linxtrans-skeleton__line" style={{ width: '60%' }}></div>
          <div className="linxtrans-skeleton__line" style={{ width: '80%' }}></div>
          <div className="linxtrans-skeleton__line" style={{ width: '40%' }}></div>
          <div className="linxtrans-skeleton__line" style={{ width: '70%' }}></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="linxtrans-popup__content">
        <div className="linxtrans-error">
          <div className="linxtrans-error__title">翻译失败</div>
          <div className="linxtrans-error__message">{error}</div>
          {onRetry && (
            <button className="linxtrans-btn linxtrans-btn--retry" onClick={onRetry}>
              重试
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!result) return null;

  const isSentence = !result.dictionary || result.dictionary.length === 0;

  // 简单的长句检测：超过 50 个字符或包含换行
  const isLongText = result.original.length > 50 || result.original.includes('\n');
  // 只有当不是长句时才显示音标
  // (用户反馈：长句显示的通常是拼音而非所需的音标，且占据空间)
  const showPhonetic = !isLongText && !!result.phonetic;

  return (
    <div className="linxtrans-popup__content">
      {/* 语言方向提示 */}
      <div className="linxtrans-lang-header">
        {/[\u4e00-\u9fa5]/.test(result.original) ? "中文-英文" : "简体中文-英文"}
        <div className="linxtrans-separator"></div>
      </div>

      {isSentence ? (
        <Fragment>
          <div className="linxtrans-popup__original">{result.original}</div>
          <div className="linxtrans-popup__section-label">翻译结果</div>
          <div className="linxtrans-popup__header">
            <div className="linxtrans-popup__word">{result.translated}</div>
            <SpeakButton active={isSpeaking} onClick={onSpeak} />
          </div>
          {showPhonetic && (
            <div className="linxtrans-popup__phonetic linxtrans-phonetic-sub">/ {result.phonetic} /</div>
          )}
        </Fragment>
      ) : (
        <Fragment>
          <div className="linxtrans-popup__header">
            <span className="linxtrans-popup__word">{result.original}</span>
            {showPhonetic && <span className="linxtrans-popup__phonetic">| {result.phonetic} |</span>}
            <SpeakButton active={isSpeaking} onClick={onSpeak} />
          </div>
          {result.dictionary!.map(d => (
            <div key={d.pos}>
              <div className="linxtrans-popup__section-label">{d.pos}</div>
              {d.definitions.map((def, i) => (
                <div className="linxtrans-popup__def-row" key={i}>
                  <span className="linxtrans-def-number">
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
    className={`linxtrans-btn ${active ? 'linxtrans-btn--speaking' : ''}`}
    onClick={onClick}
  >
    <SpeakIcon />
  </button>
);
