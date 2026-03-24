# LinxTrans

LinxTrans 是一个基于 Chrome Extension Manifest V3 的翻译插件，当前主要提供两类能力：

- 网页划词翻译
- YouTube 字幕实时翻译

项目使用 TypeScript、Vite 和 Preact 实现，并通过分层结构把 UI、业务逻辑和 Chrome 平台能力做了基础拆分。

## 功能概览

- 划词后显示触发按钮，点击后弹出翻译结果
- 支持词典释义、音标展示和原文朗读
- 在 YouTube 页面监听字幕变化并实时翻译
- 将翻译结果缓存到 `chrome.storage.local`
- 在扩展 popup 中查看、搜索、筛选和删除历史记录

## 技术栈

- Chrome Extension Manifest V3
- TypeScript
- Vite
- Preact
- Shadow DOM
- Chrome Storage API
- Web Speech API

## 系统结构

项目不是普通 Web App，而是一个由 3 个扩展入口协作完成的浏览器插件：

### 1. Content Script

入口文件：[content.ts](./src/presentation/ui/chrome/content.ts)

职责：

- 在网页中组装依赖并注入划词翻译 UI
- 在 YouTube 页面按需挂载字幕翻译 UI
- 连接 `LookupUseCase`、`TranslateSubtitleUseCase` 与页面交互

### 2. Background Service Worker

入口文件：[background.ts](./src/presentation/ui/chrome/background.ts)

职责：

- 代理翻译请求
- 调用 Google Translate 接口
- 通过 `chrome.runtime.sendMessage` 与 content script 通信

### 3. Extension Popup

入口文件：[popup.tsx](./src/presentation/ui/chrome/popup.tsx)

职责：

- 展示历史记录
- 支持搜索、分页加载、类型筛选和删除
- 复用缓存仓储与朗读能力

## 代码分层

```text
src/
├── presentation/   # UI、hooks、ViewModel、Chrome 扩展入口
├── domain/         # 实体、仓储接口、用例
└── data/           # 翻译器、TTS、缓存仓储实现
```

### `domain`

定义业务核心模型和接口：

- `Translation`
- `ITranslator`
- `ITranslationRepository`
- `ITextToSpeech`
- `LookupUseCase`
- `TranslateSubtitleUseCase`
- `HistoryUseCase`
- `SpeakTextUseCase`

这一层不直接依赖 Preact，也不直接依赖具体存储实现。

### `data`

负责对接浏览器和外部服务：

- `GoogleTranslator` 负责通过 background 发起翻译请求
- `ChromeTranslationRepository` 负责缓存和历史索引
- `WebSpeechService` 负责封装浏览器朗读能力

### `presentation`

负责页面交互和渲染：

- content / popup / youtube 三类 UI
- ViewModel 状态管理
- 绑定 Preact 的 hooks
- Shadow DOM 挂载和页面事件监听

## 主要数据流

### 划词翻译

1. 用户在网页中选中文本
2. content script 显示触发按钮
3. ViewModel 调用 `LookupUseCase`
4. use case 先查缓存，未命中再走翻译器
5. background 请求 Google Translate
6. 结果回写缓存并展示在弹窗中

### YouTube 字幕翻译

1. `CaptionObserver` 监听字幕 DOM 变化
2. `YoutubeSubtitleViewModel` 做去重和防抖
3. `TranslateSubtitleUseCase` 优先命中内存缓存和持久化缓存
4. 未命中时调用翻译器并更新覆盖层字幕

### 历史记录

1. popup 启动后创建 `HistoryUseCase`
2. `HistoryViewModel` 分页读取缓存索引
3. UI 提供搜索、Tab 筛选、删除和朗读

## 当前架构状态

这个项目已经有明确的分层和依赖方向，但 README 不再把它表述为“完全平台无关”。

当前实际情况是：

- `domain` 层相对独立
- `data` 层集中封装 Chrome API 和外部服务
- `presentation` 层中的部分 ViewModel 仍直接依赖浏览器环境，例如 `window`、`DOMRect`、`window.open`

这意味着项目具备进一步抽象为跨平台核心的基础，但当前实现仍然是一个浏览器扩展实现，而不是可直接迁移到其他平台的通用核心。

## 开发

安装依赖：

```bash
npm install
```

开发构建：

```bash
npm run dev
```

生产构建：

```bash
npm run build
```

运行测试：

```bash
npm test
```

TypeScript 类型检查：

```bash
./node_modules/.bin/tsc --noEmit
```

## 安装到 Chrome

1. 运行 `npm run build`
2. 打开 `chrome://extensions/`
3. 开启右上角的开发者模式
4. 点击“加载已解压的扩展程序”
5. 选择项目下的 `dist/` 目录

## 已知限制

- 当前翻译能力依赖 `https://translate.googleapis.com/`
- YouTube 字幕功能依赖页面 DOM 结构，YouTube 改版可能导致失效
- 历史记录使用 `chrome.storage.local`，适合轻量缓存，不适合作为复杂数据库
- 朗读功能依赖浏览器 `speechSynthesis`，不同浏览器和系统语音表现可能不同
- 项目当前面向 Chrome 扩展环境实现，尚未抽象出完整的跨平台运行时

## 项目文档

- [ARCHITECTURE.md](./ARCHITECTURE.md)

## License

MIT
