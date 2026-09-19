import { TeamsSubtitleState } from '@/presentation/viewmodels/TeamsSubtitleViewModel';

interface Props {
    state: TeamsSubtitleState;
}

export function TeamsSubtitleOverlay({ state }: Props) {
    if (state.isWaiting) {
        return (
            <div style={waitingStyle}>
                ZhTrans 已就绪 · 请在 Teams 中开启实时字幕
            </div>
        );
    }

    return (
        <div style={viewportStyle}>
            <div style={captionStyle} role="status" aria-live="polite">
                {state.speaker && <div style={speakerStyle}>{state.speaker}</div>}
                <div style={originalStyle}>{state.originalText}</div>
                {state.translatedText && <div style={translatedStyle}>{state.translatedText}</div>}
                {state.isLoading && <div style={statusStyle}>翻译中…</div>}
                {state.error && <div style={errorStyle}>翻译失败，请检查网络或刷新页面</div>}
            </div>
        </div>
    );
}

const viewportStyle = {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    padding: '0 24px 96px',
    boxSizing: 'border-box',
    pointerEvents: 'none',
} as const;

const waitingStyle = {
    position: 'fixed',
    right: '16px',
    bottom: '16px',
    maxWidth: '320px',
    padding: '8px 12px',
    borderRadius: '8px',
    background: 'rgba(17, 24, 39, 0.84)',
    color: '#f9fafb',
    font: '13px/1.4 system-ui, sans-serif',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.24)',
    pointerEvents: 'none',
} as const;

const captionStyle = {
    width: 'min(900px, 92vw)',
    padding: '14px 22px',
    borderRadius: '12px',
    background: 'rgba(17, 24, 39, 0.88)',
    color: '#f9fafb',
    textAlign: 'center',
    fontFamily: 'system-ui, sans-serif',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.32)',
    backdropFilter: 'blur(8px)',
} as const;

const speakerStyle = {
    marginBottom: '4px',
    color: '#93c5fd',
    fontSize: '13px',
    fontWeight: 600,
} as const;

const originalStyle = {
    color: '#d1d5db',
    fontSize: '16px',
    lineHeight: 1.45,
} as const;

const translatedStyle = {
    marginTop: '6px',
    color: '#ffffff',
    fontSize: '21px',
    fontWeight: 700,
    lineHeight: 1.4,
} as const;

const statusStyle = {
    marginTop: '6px',
    color: '#93c5fd',
    fontSize: '12px',
} as const;

const errorStyle = {
    marginTop: '6px',
    color: '#fca5a5',
    fontSize: '12px',
} as const;
