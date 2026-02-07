import { SubtitleState } from '@/presentation/viewmodels/YoutubeSubtitleViewModel';

interface Props {
    state: SubtitleState;
}

/**
 * 字幕悬浮窗组件
 * 
 * 纯 UI 组件 (Dumb Component)，只负责根据传入的 State 进行渲染。
 * 样式特点：
 * 1. 绝对定位在视频播放器下方。
 * 2. 鼠标穿透 (pointer-events: none)，不影响用户点击视频。
 * 3. 玻璃拟态 (Backdrop Filter) 风格。
 */
export const SubtitleOverlay = ({ state }: Props) => {
    const { originalText, translatedText, isVisible, isLoading, error } = state;

    // 如果不可见或没有内容，则不渲染任何东西
    if (!isVisible || (!originalText && !translatedText)) return null;

    return (
        <div className="linxtrans-subtitle-overlay" style={{
            position: 'absolute',
            bottom: '100px', // 距离底部的高度，预留给 YouTube 进度条
            left: '50%',
            transform: 'translateX(-50%)', // 水平居中
            backgroundColor: 'rgba(0, 0, 0, 0.6)', // 半透明黑底
            backdropFilter: 'blur(4px)', // 毛玻璃效果
            padding: '8px 16px',
            borderRadius: '8px',
            color: 'white',
            textAlign: 'center',
            zIndex: 9999, // 确保在视频之上
            pointerEvents: 'none', // 关键：点击穿透
            maxWidth: '80%', // 防止字幕太宽
            transition: 'opacity 0.2s', // 渐隐渐显动画
        }}>
            {/* 原文显示 (可选，半透明小字) */}
            {originalText && (
                <div style={{ fontSize: '14px', opacity: 0.8, marginBottom: '4px' }}>
                    {originalText}
                </div>
            )}

            {/* 译文显示 (加粗大字) */}
            {translatedText && (
                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                    {translatedText}
                </div>
            )}

            {/* Loading Indicator (Subtle) */}
            {isLoading && (
                <div style={{
                    position: 'absolute',
                    right: '8px',
                    top: '8px',
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    backgroundColor: '#4dabf7'
                }} />
            )}

            {error && <div style={{ color: '#ff6b6b', fontSize: '12px' }}>Translation Error</div>}
        </div>
    );
};
