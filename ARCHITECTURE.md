# 架构文档

## 概述

ZhTrans 当前是一个基于 Chrome Extension Manifest V3 的浏览器扩展，主要提供两类能力：

- 网页划词翻译
- YouTube 字幕实时翻译

项目采用分层结构组织代码，核心目录为：

```text
presentation → domain ← data
```

这不是“完全平台无关”的实现，而是一个已经具备清晰分层、但仍然面向浏览器扩展环境落地的代码库。

## 当前架构判断

当前仓库更准确的描述是：

- `domain/` 承载核心实体、仓储接口和业务用例
- `data/` 实现浏览器相关的数据访问与外部服务适配
- `presentation/` 负责扩展入口、UI、ViewModel 和页面交互

其中：

- `domain/` 基本保持框架无关
- `data/` 明确依赖 Chrome 扩展 API 和 Web Speech API
- `presentation/` 中的部分 ViewModel 仍依赖浏览器运行时能力，例如 `DOMRect`、`window.innerWidth`、`window.open`

因此，这个项目具备继续抽象为跨平台核心的基础，但当前状态仍应视为“浏览器扩展实现优先”。

## 目录结构

当前仓库的主要代码结构如下：

```text
src/
├── presentation/
│   ├── ui/
│   │   ├── chrome/
│   │   │   ├── background.ts
│   │   │   ├── content.ts
│   │   │   ├── popup.html
│   │   │   └── popup.tsx
│   │   ├── content/
│   │   │   ├── lookup/
│   │   │   │   ├── components/
│   │   │   │   │   ├── Popup.tsx
│   │   │   │   │   ├── TranslationContent.tsx
│   │   │   │   │   └── Trigger.tsx
│   │   │   │   ├── hooks/
│   │   │   │   │   ├── useDismissal.ts
│   │   │   │   │   ├── useDismissal.test.tsx
│   │   │   │   │   ├── useLookupModel.ts
│   │   │   │   │   ├── useSelectionTrigger.ts
│   │   │   │   │   └── useShortcuts.ts
│   │   │   │   ├── constants.ts
│   │   │   │   ├── LookupApp.tsx
│   │   │   │   ├── lookup.css
│   │   │   │   └── mount.tsx
│   │   │   └── youtube/
│   │   │       ├── components/
│   │   │       │   └── SubtitleOverlay.tsx
│   │   │       ├── hooks/
│   │   │       │   └── useSubtitleModel.ts
│   │   │       ├── observer/
│   │   │       │   └── CaptionObserver.ts
│   │   │       ├── NativeSubtitleController.ts
│   │   │       ├── YoutubeSubtitleApp.tsx
│   │   │       └── mount.tsx
│   │   ├── popup/
│   │   │   ├── hooks/
│   │   │   │   └── useHistoryModel.ts
│   │   │   ├── HistoryApp.tsx
│   │   │   └── history.css
│   │   ├── shared/
│   │   │   └── icons.tsx
│   │   └── utils/
│   │       ├── positioning.test.ts
│   │       └── positioning.ts
│   └── viewmodels/
│       ├── HistoryViewModel.ts
│       ├── LookupViewModel.ts
│       └── YoutubeSubtitleViewModel.ts
├── domain/
│   ├── entities/
│   │   └── Translation.ts
│   ├── repositories/
│   │   ├── ITextToSpeech.ts
│   │   ├── ITranslationRepository.ts
│   │   └── ITranslator.ts
│   └── usecases/
│       ├── HistoryUseCase.test.ts
│       ├── HistoryUseCase.ts
│       ├── LookupUseCase.test.ts
│       ├── LookupUseCase.ts
│       ├── SpeakTextUseCase.test.ts
│       ├── SpeakTextUseCase.ts
│       └── TranslateSubtitleUseCase.ts
└── data/
    ├── local/
    │   └── tts/
    │       └── WebSpeechService.ts
    ├── remote/
    │   └── api/
    │       ├── GoogleTranslator.test.ts
    │       └── GoogleTranslator.ts
    └── repository/
        └── ChromeTranslationRepository.ts
```

## 分层职责

### Domain

职责：

- 定义业务实体
- 定义仓储和服务接口
- 实现核心用例

约束：

- 不依赖 Preact、Vite、Chrome API
- 不包含 DOM 操作
- 尽量保持纯 TypeScript 逻辑

当前主要对象：

- `Translation`
- `ITranslator`
- `ITranslationRepository`
- `ITextToSpeech`
- `LookupUseCase`
- `TranslateSubtitleUseCase`
- `HistoryUseCase`
- `SpeakTextUseCase`

示例：

```ts
// src/domain/entities/Translation.ts
export type TranslationType = 'lookup' | 'subtitle';

export interface Translation {
  original: string;
  translated: string;
  phonetic?: string;
  dictionary?: DictionaryEntry[];
  srcLang: string;
  targetLang: string;
  timestamp?: number;
  type: TranslationType;
}
```

```ts
// src/domain/usecases/LookupUseCase.ts
export class LookupUseCase {
  constructor(
    private translator: ITranslator,
    private repository?: ITranslationRepository
  ) {}

  async execute(text: string) {
    const trimmedText = text.trim();

    if (this.repository) {
      const cached = await this.repository.get(trimmedText);
      if (cached) return cached;
    }

    const result = await this.translator.translate(trimmedText);

    if (this.repository) {
      await this.repository.save(result);
    }

    return result;
  }
}
```

### Data

职责：

- 实现 Domain 中定义的接口
- 对接浏览器存储、后台消息、外部翻译接口、朗读能力
- 把外部响应转换为 Domain 可用的数据结构

当前实现：

- `GoogleTranslator`
- `ChromeTranslationRepository`
- `WebSpeechService`

特点：

- `GoogleTranslator` 并不直接发起跨域 fetch，而是通过 `chrome.runtime.sendMessage` 请求 background 代理
- `ChromeTranslationRepository` 基于 `chrome.storage.local`
- `WebSpeechService` 基于浏览器 `speechSynthesis`

### Presentation

职责：

- 管理扩展入口
- 处理页面挂载和 UI 渲染
- 用 ViewModel 组织交互状态
- 把浏览器事件转成对 UseCase 的调用

当前分为三个运行入口：

1. Content Script：注入网页，负责划词翻译和 YouTube 字幕能力
2. Background Service Worker：处理翻译请求代理
3. Popup：展示历史记录和朗读能力

## 运行时入口

### 1. Content Script

入口文件：[src/presentation/ui/chrome/content.ts](./src/presentation/ui/chrome/content.ts)

职责：

- 组装划词翻译依赖
- 挂载划词翻译 UI
- 在 YouTube 页面按需挂载字幕翻译 UI

当前依赖注入方式：

```ts
const translator = new GoogleTranslator('lookup');
const repository = new ChromeTranslationRepository();
const tts = new WebSpeechService();

const useCase = new LookupUseCase(translator, repository);
const speakUseCase = new SpeakTextUseCase(tts);

mountLookupUI(useCase, speakUseCase);
```

YouTube 场景下会额外创建：

```ts
const subtitleTranslator = new GoogleTranslator('subtitle');
const subtitleUseCase = new TranslateSubtitleUseCase(subtitleTranslator, repository);
```

### 2. Background Service Worker

入口文件：[src/presentation/ui/chrome/background.ts](./src/presentation/ui/chrome/background.ts)

职责：

- 接收 content script 发来的翻译请求
- 向 Google Translate 接口发起网络请求
- 返回标准消息响应给前端

这里本质上是扩展运行时的基础设施层，不承担 UI 状态管理。

### 3. Popup

入口文件：[src/presentation/ui/chrome/popup.tsx](./src/presentation/ui/chrome/popup.tsx)

职责：

- 组装历史记录相关依赖
- 挂载历史记录应用
- 提供搜索、分页、筛选、删除、朗读能力

## ViewModel 设计

当前项目采用“纯 TypeScript ViewModel + Preact Hook 绑定”的模式，而不是把全部状态逻辑写进组件。

现有 ViewModel：

- `LookupViewModel`
- `YoutubeSubtitleViewModel`
- `HistoryViewModel`

这一层的优点：

- UI 状态逻辑更集中
- 便于在 hook 中复用
- 大部分状态流转可脱离组件树理解

但需要明确：

- 它们并不是完全平台无关
- 部分 ViewModel 仍直接使用浏览器能力，例如 `DOMRect`、`window.innerWidth`、`window.open`

所以当前更准确的说法是：

- ViewModel 不依赖 Preact 组件本身
- 但不等于 ViewModel 已经完全脱离浏览器平台

## 主要数据流

### 划词翻译

1. 用户在网页中选中文本
2. `useSelectionTrigger` 捕获选区并通知 `LookupViewModel`
3. 用户点击触发器或按快捷键
4. `LookupViewModel` 调用 `LookupUseCase`
5. `LookupUseCase` 先查 `ITranslationRepository`
6. 未命中时由 `GoogleTranslator` 通过 background 请求 Google Translate
7. 结果回写缓存并展示在 popup UI 中

### YouTube 字幕翻译

1. `CaptionObserver` 监听字幕区域变化
2. `YoutubeSubtitleViewModel` 做防抖与文本裁剪
3. `TranslateSubtitleUseCase` 先查内存缓存，再查持久化缓存
4. 未命中时执行翻译
5. UI 覆盖层展示原文和译文

### 历史记录

1. popup 打开后，`useHistoryModel` 创建 `HistoryViewModel`
2. `HistoryViewModel` 调用 `HistoryUseCase`
3. `HistoryUseCase` 从仓储读取分页历史
4. UI 展示搜索、Tab 筛选、加载更多和删除

## 关于跨平台

当前文档不再把项目描述为“只需替换 data 层即可跨平台”。

更准确的判断是：

- `domain/` 是未来跨平台复用的最佳基础
- `data/` 当前明显绑定浏览器扩展实现
- `presentation/` 中也存在浏览器运行时耦合

如果未来要支持 Electron、Tauri 或 Android，通常至少需要：

- 替换 `data/` 中的平台实现
- 重写对应平台入口
- 重新设计部分 ViewModel 或把浏览器 API 依赖进一步下沉

换句话说，项目具备“可继续演进为跨平台核心”的潜力，但尚未完成这一抽象。

## 测试现状

当前仓库中已经存在的测试主要包括：

- `LookupUseCase.test.ts`
- `HistoryUseCase.test.ts`
- `SpeakTextUseCase.test.ts`
- `GoogleTranslator.test.ts`
- `positioning.test.ts`
- `useDismissal.test.tsx`

因此更准确的测试分布是：

- Domain：已有用例级单元测试
- Data：已有 `GoogleTranslator` 测试
- Presentation：已有局部工具和 hook 测试

当前仓库中并不存在完整的 `LookupApp` 或 `HistoryApp` 组件测试文档示例里提到的那些测试文件。

## 当前架构的优点

- 扩展入口清晰，`content/background/popup` 三类职责分明
- `domain/` 与 `data/` 的边界基本明确
- 引入 ViewModel 后，复杂 UI 状态没有全部堆进组件
- `TranslateSubtitleUseCase` 针对实时字幕场景做了内存缓存优化
- popup 历史记录已经具备分页、筛选、搜索等相对完整的交互能力

## 当前架构的现实边界

- 仍然以 Chrome 扩展为第一目标平台
- `presentation/` 中有一部分浏览器 API 耦合
- `background` 目前只承担翻译代理，尚未演进成更完整的消息分发层
- 文档中的“Android 风格命名规范”只能作为参考，不应强行覆盖当前仓库已形成的 Web/Extension 约定

## 后续演进建议

如果后续要继续优化架构，可以优先考虑这几个方向：

1. 进一步把 `window`、`DOMRect`、`window.open` 之类的平台能力抽象出 ViewModel
2. 为 background 建立更清晰的消息协议和类型定义
3. 给 popup 和 lookup 场景补更多面向行为的测试
4. 如果未来真的要跨平台，再把“平台适配层”从当前 `presentation/` 中继续下沉

## 参考

- [Android 官方架构指南](https://developer.android.com/topic/architecture)
- [Clean Architecture (Robert C. Martin)](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
