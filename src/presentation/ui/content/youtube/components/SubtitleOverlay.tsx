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
 * 4. 缓存命中指示器：右上角绿色圆点。
 */
export const SubtitleOverlay = ({ state }: Props) => {
    const { originalText, translatedText, isVisible, isLoading, error, cacheHit } = state;

    // 如果不可见或没有内容，则不渲染任何东西
    if (!isVisible || (!originalText && !translatedText)) return null;

    return (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-end',
        }}>

            <div className="zhtrans-subtitle-overlay" style={{
                // position: 'absolute',
                marginBottom: '100px', // 距离底部的高度，预留给 YouTube 进度条
                // left: '50%',
                // transform: 'translateX(-50%)', // REMOVED: Managed by dynamic transform below for animation
                backgroundColor: 'rgba(0, 0, 0, 0.7)', // 稍微加深背景色，提高对比度
                backdropFilter: 'blur(8px)', // 增强毛玻璃效果
                padding: '12px 24px', // 增加内边距
                borderRadius: '12px', // 增加圆角
                color: 'white',
                textAlign: 'center',
                zIndex: 9999, // 确保在视频之上
                pointerEvents: 'none', // 关键：点击穿透

                // 宽度和布局优化
                maxWidth: '90%', // 允许更宽的显示
                width: 'fit-content', // 根据内容自适应宽度
                minWidth: '300px', // 最小宽度，避免太窄

                // 动画效果
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', // 平滑过渡
                opacity: (originalText || translatedText) ? 1 : 0,
                // transform: (originalText || translatedText)
                //     ? 'translateX(-50%) translateY(0) scale(1)'
                //     : 'translateX(-50%) translateY(10px) scale(0.95)', // 微弱的上浮缩放效果
            }}>
                {/* 原文显示 (可选，半透明小字) */}
                {originalText && (
                    <div style={{
                        fontSize: '16px', // 稍微调大原文
                        opacity: 0.9,
                        marginBottom: '6px',
                        lineHeight: '1.4',
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '100%',
                        direction: 'rtl', // 让省略号出现在左侧
                        textAlign: 'center', // 整体居中
                        unicodeBidi: 'plaintext' // 保证文字内部方向正确 (LTR)
                    }}>
                        {originalText}
                    </div>
                )}

                {/* 译文显示 (加粗大字) */}
                {translatedText && (
                    <div style={{
                        fontSize: '20px', // 调大译文
                        fontWeight: 'bold',
                        lineHeight: '1.3',
                        textShadow: '0 2px 4px rgba(0,0,0,0.3)', // 增加文字阴影提高可读性
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '100%',
                        direction: 'rtl', // 让省略号出现在左侧
                        textAlign: 'center', // 整体居中
                        unicodeBidi: 'plaintext' // 保证文字内部方向正确 (LTR)
                    }}>
                        {translatedText}
                    </div>
                )}

                {/* Cache Hit Indicator (绿色圆点) */}
                {cacheHit && (
                    <div style={{
                        position: 'absolute',
                        right: '12px',
                        top: '12px',
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: '#4ade80', // green-400
                        boxShadow: '0 0 8px rgba(74, 222, 128, 0.6)',
                        animation: 'pulse 2s ease-in-out infinite'
                    }} />
                )}

                {/* Loading Indicator (Subtle, 蓝色) */}
                {isLoading && !cacheHit && (
                    <div style={{
                        position: 'absolute',
                        right: '12px',
                        top: '12px',
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: '#4dabf7',
                        animation: 'pulse 2s ease-in-out infinite'
                    }} />
                )}

                {error && (
                    <div style={{
                        color: '#ff6b6b',
                        fontSize: '12px',
                        marginTop: '8px',
                        padding: '4px 8px',
                        backgroundColor: 'rgba(255, 107, 107, 0.1)',
                        borderRadius: '4px'
                    }}>
                        ⚠️ {error.includes('刷新') ? error : '翻译失败'}
                    </div>
                )}
            </div>
        </div >

    );
};
