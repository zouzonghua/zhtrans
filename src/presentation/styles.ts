/**
 * Shadow DOM CSS Styles
 * 
 * Defines the visual appearance of the Glimpse extension.
 * Uses CSS variables for theming and macOS-like aesthetics.
 */
export const SHADOW_STYLES = `
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
  .loading #loading-icon { display: flex !important; animation: rotate 1s linear infinite; }
  .loading #search-icon { display: none !important; }
  @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  .tail { position: absolute; left: 50%; width: 16px; height: 8px; pointer-events: none; }
  .tail-in { width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; }
  .tail-btm { top: -8px; } .tail-btm .tail-in { border-bottom: 8px solid var(--bg); }
  .tail-top { bottom: -8px; } .tail-top .tail-in { border-top: 8px solid var(--bg); }
  .section-label { font-size: 11px; font-weight: 600; color: var(--sub); margin: 12px 0 6px 0; border-top: 0.5px solid var(--line); padding-top: 8px; text-transform: uppercase; }
  .sentence-mode-original { font-size: 13px; color: var(--sub); margin-bottom: 12px; line-height: 1.4; font-style: italic; }
`;
