
/**
 * 负责监听 YouTube 字幕 DOM 变化的具体实现。
 * 
 * 技术难点：
 * 1. YouTube 字幕是分段加载的 (spans)，需要合并。
 * 2. DOM 更新频率极高，需要去抖动 (Debounce).
 */
export class CaptionObserver {
    private observer: MutationObserver | null = null;
    private lastText: string = "";

    constructor(
        private onTextChange: (text: string) => void
    ) { }

    /**
     * 开始监听
     */
    public start() {
        this.stop();

        // YouTube 字幕容器通常是 #ytp-caption-window-container
        // 但内容实际渲染在 .ytp-caption-segment 中
        const targetNode = document.querySelector('.ytp-caption-window-container') || document.body;

        this.observer = new MutationObserver(this.handleMutations);

        this.observer.observe(targetNode, {
            childList: true,      // 监听子节点增删
            subtree: true,        // 监听所有后代节点
            characterData: true,  // 监听文本内容变化
            attributes: false     // 不关心属性变化
        });

        // 立即检查一次
        this.checkCurrentCaption();
    }

    /**
     * 停止监听
     */
    public stop() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
    }

    // 使用箭头函数绑定 this
    private handleMutations = (_mutations: MutationRecord[]) => {
        // 简单策略：任何变动都重新扫描一次文本
        // 性能优化：可以使用 requestAnimationFrame 或者 debounce
        this.checkCurrentCaption();
    };

    /**
     * 核心逻辑：提取并清洗字幕文本
     */
    private checkCurrentCaption() {
        // 1. 优先定位字幕容器 (Scope)，缩小搜索范围
        const container = document.querySelector('.ytp-caption-window-container');
        if (!container) {
            // console.debug('[ZhTrans] Caption container not found');
            return;
        }

        // 2. 只获取容器内的片段 (Segments)
        const segments = container.querySelectorAll('.ytp-caption-segment');
        if (segments.length === 0) {
            if (this.lastText !== "") {
                console.log('[ZhTrans] Caption cleared');
                this.lastText = "";
                this.onTextChange(""); // 字幕消失通知
            }
            return;
        }

        // 3. 合并文本
        // 使用 innerText 而不是 textContent，因为 innerText 会忽略 hidden 的元素，
        // 这对于避免获取 YouTube 预加载但不可见的字幕片段非常重要。
        const textDetails: string[] = [];
        segments.forEach(seg => {
            const text = (seg as HTMLElement).innerText;
            if (text) textDetails.push(text);
        });

        // 4. 清理多余空格和换行
        const fullText = textDetails.join(' ').replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();

        // 5. 只有当完整句子发生变化时才通知 (去重)
        if (fullText !== this.lastText) {
            console.log('[ZhTrans] New caption detected:', fullText);
            this.lastText = fullText;
            this.onTextChange(fullText);
        }
    }
}
