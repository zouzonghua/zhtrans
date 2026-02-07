import { render } from 'preact';
import { YoutubeSubtitleApp } from '@/presentation/ui/content/youtube/YoutubeSubtitleApp';
import { TranslateSubtitleUseCase } from '@/domain/usecases/TranslateSubtitleUseCase';
// Probably no styles needed if using inline styles in SubtitleOverlay, or we can use a new css file.
// For now, let's assume inline styles in SubtitleOverlay are enough or we inject global styles.

/**
 * 挂载 YouTube 字幕 UI
 * 
 * 核心逻辑：
 * 1. 这是一个 SPA (单页应用) 场景，需要监听 YouTube 的导航事件。
 * 2. 需要将我们的 UI 注入到 YouTube 的视频播放器容器中 (.html5-video-player)，以支持全屏模式。
 */
export function mountYoutubeSubtitleUI(useCase: TranslateSubtitleUseCase) {
    // 启动即尝试挂载
    tryMount(useCase);

    // 监听 YouTube 的 SPA 导航事件 (切换视频时触发)
    // 'yt-navigate-finish' 是 YouTube 自定义事件
    document.addEventListener('yt-navigate-finish', () => {
        console.log('[LinxTrans] YouTube navigation detected, remounting UI...');
        // 关键逻辑：先卸载清理旧的实例，防止 Observer 监听错误的对象或内存泄漏
        cleanup();
        tryMount(useCase);
    });
}

/**
 * 清理函数：卸载组件并移除宿主节点
 */
function cleanup() {
    const host = document.querySelector('#linxtrans-youtube-subtitle-host');
    if (host) {
        // 1. 渲染 null 触发 Preact 组件的 unmount 生命周期 (调用 useEffect return, dispose ViewModel)
        render(null as any, host);
        // 2. 移除 DOM 节点
        host.remove();
        console.log('[LinxTrans] Old UI cleaned up.');
    }
}

/**
 * 尝试注入 UI，如果找不到播放器则轮询等待。
 */
function tryMount(useCase: TranslateSubtitleUseCase) {
    // 防止重复轮询
    // 实际生产中可能需要更严谨的锁，但这里 setInterval 句柄丢弃问题不大，因为 inject 内部有防重判断
    const waitForPlayer = setInterval(() => {
        const player = document.querySelector('.html5-video-player');
        if (player) {
            clearInterval(waitForPlayer);
            inject(player, useCase);
        } else {
            // console.log('[LinxTrans] Player not found, waiting...');
        }
    }, 1000);
}

/**
 * 执行具体的 DOM 注入
 */
function inject(player: Element, useCase: TranslateSubtitleUseCase) {
    // 1. 防重复检查：如果已经存在我们的宿主节点，就直接返回
    if (player.querySelector('#linxtrans-youtube-subtitle-host')) {
        // console.log('[LinxTrans] UI already injected.');
        return;
    }

    // 2. 创建宿主容器
    const host = document.createElement('div');
    host.id = 'linxtrans-youtube-subtitle-host';

    // 3. 设置样式：绝对定位覆盖在视频上方
    host.style.position = 'absolute';
    host.style.top = '0';
    host.style.left = '0';
    host.style.width = '100%';
    host.style.height = '100%';
    host.style.pointerEvents = 'none'; // 关键：让鼠标事件穿透，不影响视频点击
    host.style.zIndex = '9999'; // 确保在这一层级较高，但不要遮挡 YouTube 的控制栏 (控制栏 z-index 很高)

    // 4. 插入到播放器容器
    player.appendChild(host);

    // 5. 渲染 Preact 应用
    render(<YoutubeSubtitleApp useCase={useCase} />, host);
    // console.log('[LinxTrans] UI injected successfully.');
}
