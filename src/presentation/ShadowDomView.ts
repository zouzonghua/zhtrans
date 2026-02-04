import { Translation } from '@/domain/entities/Translation';
import { SHADOW_STYLES } from './styles';
import { ICONS } from './icons';

/**
 * Shadow DOM 视图管理器 (Presentation Layer)
 * 
 * 职责：
 * 1. 负责所有的 DOM 操作和 UI 渲染。
 * 2. 使用 Shadow DOM 隔离技术，确保样式隔离。
 * 3. 实现 macOS 风格的视觉细节（毛玻璃、动态尖角、弹性动画）。
 */
export class ShadowDomView {
  private container: HTMLDivElement;
  private shadowRoot: ShadowRoot;
  private trigger!: HTMLElement;
  private popup!: HTMLElement;
  private speakBtn: HTMLElement | null = null;

  // State for current selection
  private currentText: string = "";
  private currentRect: DOMRect | null = null;

  private onSpeakClick: (() => void) | null = null;

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'glimpse-host';
    document.body.appendChild(this.container);
    this.shadowRoot = this.container.attachShadow({ mode: 'closed' });

    this.injectStyles();
    this.createElements();
  }

  private injectStyles() {
    const style = document.createElement('style');
    style.textContent = SHADOW_STYLES;
    this.shadowRoot.appendChild(style);
  }

  private createElements() {
    this.trigger = document.createElement('div');
    this.trigger.id = 'trigger';
    this.trigger.innerHTML = `
      ${ICONS.SEARCH}
      ${ICONS.LOADING}
    `;
    this.shadowRoot.appendChild(this.trigger);

    this.popup = document.createElement('div');
    this.popup.id = 'popup';
    this.shadowRoot.appendChild(this.popup);
  }

  public setTriggerPosition(x: number, y: number) {
    this.trigger.style.left = `${x}px`;
    this.trigger.style.top = `${y}px`;
    this.trigger.style.display = 'flex';
  }

  public hideTrigger() {
    this.trigger.style.display = 'none';
    this.toggleTriggerLoading(false); // 隐藏时确保重置状态
  }

  public toggleTriggerLoading(isLoading: boolean) {
    if (isLoading) {
      this.trigger.classList.add('loading');
    } else {
      this.trigger.classList.remove('loading');
    }
  }

  public showPopup(rect: DOMRect, result: Translation) {
    const centerX = rect.left + rect.width / 2;
    let left = Math.max(10, Math.min(window.innerWidth - 330, centerX - 160));
    // 动态高度评估 (句子模式高度通常比单词模式低一些)
    const estimatedHeight = result.dictionary ? 320 : 200;
    let isBottom = window.innerHeight - rect.bottom > estimatedHeight;
    let top = isBottom ? rect.bottom + 12 : rect.top - estimatedHeight - 20;

    const tailPercent = ((centerX - left) / 320) * 100;

    this.popup.style.left = `${left}px`;
    this.popup.style.top = `${top}px`;
    this.popup.style.display = 'flex';

    this.renderContent(result, isBottom, tailPercent);
  }

  public hidePopup() {
    this.popup.style.display = 'none';
  }

  public setSpeakHandler(handler: () => void) {
    this.onSpeakClick = handler;
  }

  public toggleSpeakAnimation(active: boolean) {
    if (this.speakBtn) {
      if (active) this.speakBtn.classList.add('speaking');
      else this.speakBtn.classList.remove('speaking');
    }
  }

  /**
   * 核心渲染逻辑：根据是否有词典条目自动切换布局模式
   */
  private renderContent(data: Translation, isBottom: boolean, tailPos: number) {
    // Logic moved from UseCase: Determine display title based on content
    const isChinese = /[\u4e00-\u9fa5]/.test(data.original);
    const sectionTitle = isChinese ? "中文-英文" : "简体中文-英文";

    const isSentence = !data.dictionary || data.dictionary.length === 0;

    let bodyHtml = "";

    if (isSentence) {
      // 整句翻译模式 UI
      bodyHtml = `
        <div class="sentence-mode-original">${data.original}</div>
        <div class="section-label">翻译结果</div>
        <div class="header">
          <div class="word">${data.translated}</div>
          <button class="btn" id="speak">${ICONS.SPEAK}</button>
        </div>
        ${data.phonetic ? `<div class="phonetic" style="margin-top:4px; font-style:italic">/ ${data.phonetic} /</div>` : ''}
      `;
    } else {
      // 单词词典模式 UI
      const definitions = data.dictionary!.map(d =>
        `<div class="section-label">${d.pos}</div>` +
        d.definitions.map((def, i) => `<div class="def-row"><span style="color:var(--sub);min-width:14px">${['①', '②', '③', '④', '⑤'][i] || i + 1}</span><span>${def}</span></div>`).join('')
      ).join('');

      bodyHtml = `
        <div class="header">
          <span class="word">${data.original}</span>
          ${data.phonetic ? `<span class="phonetic">| ${data.phonetic} |</span>` : ''}
          <button class="btn" id="speak">${ICONS.SPEAK}</button>
        </div>
        ${definitions}
      `;
    }

    this.popup.innerHTML = `
      <div class="tail ${isBottom ? 'tail-btm' : 'tail-top'}" style="left:${tailPos}%"><div class="tail-in"></div></div>
      <div class="content">
        <div style="font-size:11px; color:var(--sub); margin-bottom:8px; display:flex; align-items:center; gap:8px;">
          ${sectionTitle} <div style="flex:1; height:0.5px; background:var(--line);"></div>
        </div>
        ${bodyHtml}
      </div>
      <div class="footer">
        <div class="footer-item" id="tab-dict">词典</div>
        <div class="footer-item" id="tab-wiki">维基百科</div>
      </div>
    `;

    // 重新绑定事件
    this.speakBtn = this.shadowRoot.getElementById('speak');
    this.speakBtn?.addEventListener('click', () => this.onSpeakClick && this.onSpeakClick());

    this.shadowRoot.getElementById('tab-dict')?.addEventListener('click', () => {
      const url = `https://translate.google.com/?sl=auto&tl=${data.targetLang}&text=${encodeURIComponent(data.original)}&op=translate`;
      window.open(url, '_blank');
    });

    this.shadowRoot.getElementById('tab-wiki')?.addEventListener('click', () => {
      const wikiLang = data.targetLang.startsWith('zh') ? 'zh' : 'en';
      const url = `https://${wikiLang}.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(data.original)}`;
      window.open(url, '_blank');
    });
  }

  public get triggerElement() { return this.trigger; }
  public get containerElement() { return this.container; }

  // --- State Management ---

  public setSelectionState(text: string, rect: DOMRect) {
    this.currentText = text;
    this.currentRect = rect;
  }

  public getSelectionText(): string {
    return this.currentText;
  }

  public getSelectionRect(): DOMRect | null {
    return this.currentRect;
  }
}