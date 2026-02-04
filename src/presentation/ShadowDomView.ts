import { Translation } from '@/domain/entities/Translation';

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
  private trigger: HTMLElement;
  private popup: HTMLElement;
  private speakBtn: HTMLElement | null = null;
  
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
    style.textContent = `
      :host { 
        --bg: rgba(238,238,238,0.72); 
        --text: #1d1d1f; 
        --sub: #6e6e73; 
        --accent: #007aff; 
        --line: rgba(0,0,0,0.08); 
        --shadow: 0 20px 40px rgba(0,0,0,0.15); 
        font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif; 
        -webkit-font-smoothing: antialiased;
      }
      @media (prefers-color-scheme: dark) { 
        :host { --bg: rgba(45,45,45,0.8); --text: #f5f5f7; --sub: #a1a1a6; --line: rgba(255,255,255,0.12); } 
      }
      #trigger { position: fixed; width: 26px; height: 26px; background: white; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.15); display: none; align-items: center; justify-content: center; z-index: 2147483647; cursor: pointer; border: 0.5px solid rgba(0,0,0,0.05); }
      #trigger svg { width: 14px; height: 14px; fill: var(--accent); }
      #popup { position: fixed; width: 320px; background: var(--bg); backdrop-filter: blur(40px) saturate(180%); border-radius: 12px; box-shadow: var(--shadow); display: none; flex-direction: column; z-index: 2147483647; animation: spring 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.1); border: 0.5px solid rgba(0,0,0,0.1); }
      @keyframes spring { from { opacity:0; transform:scale(0.96) translateY(4px); } to { opacity:1; transform:scale(1) translateY(0); } }
      .content { padding: 16px; max-height: 400px; overflow-y: auto; }
      .header { display: flex; align-items: flex-start; gap: 8px; margin-bottom: 8px; }
      .word { font-size: 17px; font-weight: 700; color: var(--text); line-height: 1.3; flex: 1; word-break: break-word; }
      .phonetic { font-size: 13px; color: var(--sub); font-family: "SF Pro Text", sans-serif; margin-top: 2px; }
      .def-row { display: flex; gap: 6px; font-size: 14px; color: var(--text); margin-bottom: 6px; line-height: 1.5; word-break: break-word; }
      .footer { height: 32px; background: rgba(0,0,0,0.03); border-top: 0.5px solid var(--line); display: flex; justify-content: space-around; align-items: center; font-size: 11px; color: var(--sub); border-bottom-left-radius: 12px; border-bottom-right-radius: 12px; }
      .footer-item { cursor: pointer; padding: 4px 12px; border-radius: 4px; transition: background 0.2s; }
      .footer-item:hover { background: rgba(0,0,0,0.05); color: var(--text); }
      .btn { cursor: pointer; border: none; background: none; padding: 2px; display: flex; align-items: center; }
      .btn svg { width: 14px; height: 14px; fill: var(--accent); }
      .speaking { animation: pulse 1.5s infinite; }
      @keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.15); opacity: 0.7; } 100% { transform: scale(1); opacity: 1; } }
      .tail { position: absolute; left: 50%; width: 16px; height: 8px; pointer-events: none; }
      .tail-in { width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; }
      .tail-btm { top: -8px; } .tail-btm .tail-in { border-bottom: 8px solid var(--bg); }
      .tail-top { bottom: -8px; } .tail-top .tail-in { border-top: 8px solid var(--bg); }
      .section-label { font-size: 11px; font-weight: 600; color: var(--sub); margin: 12px 0 6px 0; border-top: 0.5px solid var(--line); padding-top: 8px; text-transform: uppercase; }
      .sentence-mode-original { font-size: 13px; color: var(--sub); margin-bottom: 12px; line-height: 1.4; font-style: italic; }
    `;
    this.shadowRoot.appendChild(style);
  }

  private createElements() {
    this.trigger = document.createElement('div');
    this.trigger.id = 'trigger';
    this.trigger.innerHTML = `<svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>`;
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
    const sectionTitle = data.displayTitle || "查词结果";
    const isSentence = !data.dictionary || data.dictionary.length === 0;

    let bodyHtml = "";

    if (isSentence) {
      // 整句翻译模式 UI
      bodyHtml = `
        <div class="sentence-mode-original">${data.original}</div>
        <div class="section-label">翻译结果</div>
        <div class="header">
          <div class="word">${data.translated}</div>
          <button class="btn" id="speak"><svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.26 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg></button>
        </div>
        ${data.phonetic ? `<div class="phonetic" style="margin-top:4px; font-style:italic">/ ${data.phonetic} /</div>` : ''}
      `;
    } else {
      // 单词词典模式 UI
      const definitions = data.dictionary!.map(d => 
        `<div class="section-label">${d.pos}</div>` +
        d.definitions.map((def, i) => `<div class="def-row"><span style="color:var(--sub);min-width:14px">${['①','②','③','④','⑤'][i] || i+1}</span><span>${def}</span></div>`).join('')
      ).join('');

      bodyHtml = `
        <div class="header">
          <span class="word">${data.original}</span>
          ${data.phonetic ? `<span class="phonetic">| ${data.phonetic} |</span>` : ''}
          <button class="btn" id="speak"><svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.26 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg></button>
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
}