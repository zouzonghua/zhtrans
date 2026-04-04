/**
 * YouTube 原生字幕控制器
 * 
 * 负责显示/隐藏 YouTube 原生字幕，避免与翻译字幕重叠造成视觉干扰。
 */
export class NativeSubtitleController {
    private styleElement: HTMLStyleElement | null = null;

    /**
     * 隐藏 YouTube 原生字幕
     */
    public hide() {
        if (this.styleElement) {
            return; // 已经隐藏
        }

        // 创建 style 元素注入 CSS
        this.styleElement = document.createElement('style');
        this.styleElement.id = 'zhtrans-hide-native-subtitle';
        this.styleElement.textContent = `
            /* 隐藏 YouTube 原生字幕容器 */
            .ytp-caption-window-container {
                display: none !important;
            }
        `;
        document.head.appendChild(this.styleElement);
        console.log('[ZhTrans] Native subtitles hidden');
    }

    /**
     * 显示 YouTube 原生字幕
     */
    public show() {
        if (this.styleElement) {
            this.styleElement.remove();
            this.styleElement = null;
            console.log('[ZhTrans] Native subtitles restored');
        }
    }

    /**
     * 切换显示/隐藏状态
     */
    public toggle() {
        if (this.styleElement) {
            this.show();
        } else {
            this.hide();
        }
    }

    /**
     * 检查当前是否隐藏
     */
    public isHidden(): boolean {
        return this.styleElement !== null;
    }

    /**
     * 清理资源
     */
    public destroy() {
        this.show();
    }
}
