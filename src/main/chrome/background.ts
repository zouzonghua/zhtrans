/**
 * Chrome 后台服务脚本 (Background Service Worker)
 * 属于 Infrastructure 层的一部分 (作为平台特定的支持设施)。
 * 
 * 职责：
 * 1. 网络代理 (Network Proxy)：处理来自 Content Script 的请求。
 * 2. 跨域突破 (CORS Bypass)：在后台环境中发起 fetch 请求，绕过浏览器的同源策略限制。
 * 3. 消息路由：作为不同 Content Scripts 之间的协调者（如有需要）。
 */

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  // 监听翻译请求动作
  if (request.action === "translate") {
    const { text, targetLang } = request;

    // 构建 Google Translate API URL
    // dt=t (translation), dt=bd (dictionary), dt=rm (transliteration/phonetic)
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&dt=bd&dt=rm&q=${encodeURIComponent(text)}`;

    fetch(url)
      .then(response => response.json())
      .then(data => sendResponse({ success: true, data }))
      .catch(error => sendResponse({ success: false, error: error.message }));

    // 返回 true 以保持消息通道开启，支持异步 sendResponse 调用
    return true;
  }
});