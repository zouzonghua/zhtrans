# LinxTrans

LinxTrans 是一款追求极简主义、深度还原 macOS 原生“查找 (Look Up)”质感的 Chrome 翻译插件。

## ✨ 特性

- **macOS 视觉还原**：
  - **玻璃拟态**：高饱和度 `backdrop-filter` 模糊背景，支持系统级深色模式。
  - **动态尖角**：弹出气泡的尖角根据选词位置动态滑动，精准指向文本中心。
  - **弹性动画**：模拟系统级 UI 的弹性入场效果。
- **顺滑交互体验**：
  - **滚动渐隐销毁**：当页面发生滚动时，弹窗会通过缩放与透明度渐变顺滑消失，避免位置错位。
  - **智能触发**：精准的划词检测，并根据视口空间自动计算最优弹出位置。
- **整洁架构 (Clean Architecture)**：代码层级清晰，业务逻辑与平台 API 完全解耦，具备极强的跨平台扩展性。
- **轻量级 Preact 驱动**：使用 Preact (仅 3KB) 实现声明式 UI 状态管理，保持极小的资源占用。
- **标准 CSS + BEM**：严格遵循 BEM 命名规范，确保样式的隔离性与可维护性。
- **现代技术栈**：TypeScript + Vite + Preact + Shadow DOM。

LinxTrans 遵循 **整洁架构 (Clean Architecture)** + **MVVM** 原则，将关注点分离，确保业务逻辑独立于 UI 和外部框架。

### 目录结构说明

```text
LinxTrans/
├── src/
│   ├── presentation/         # [Presentation Layer] 表现层
│   │   ├── ui/               # UI 组件
│   │   │   ├── chrome/       # Chrome Extension 入口
│   │   │   │   ├── content.ts    # Content Script 入口
│   │   │   │   ├── background.ts # Service Worker
│   │   │   │   └── popup.html    # Popup 页面
│   │   │   ├── common/       # 通用 UI 代码
│   │   │   ├── content/      # Content Script 组件
│   │   │   ├── popup/        # Popup 组件
│   │   │   ├── hooks/        # React Hooks
│   │   │   └── utils/        # UI 工具函数
│   │   └── viewmodels/       # ViewModels (状态管理)
│   │       └── LinxTransViewModel.ts
│   │
│   ├── domain/               # [Domain Layer] 业务逻辑层
│   │   ├── entities/         # 业务实体 (Translation, DictionaryEntry)
│   │   ├── repositories/     # 仓库接口定义 (ITranslator, ITextToSpeech, ITranslationRepository)
│   │   └── usecases/         # 用例 (LookupUseCase: 封装业务逻辑)
│   │
│   └── data/                 # [Data Layer] 数据层
│       ├── local/            # 本地数据源
│       │   └── tts/          # 语音服务 (WebSpeechService)
│       ├── remote/           # 远程数据源
│       │   └── api/          # API 服务 (GoogleTranslator)
│       └── repository/       # 仓库实现 (ChromeTranslationRepository)
```

### 核心设计思想

1.  **依赖倒置 (Dependency Inversion)**：
    *   `presentation` 层不直接依赖 `infrastructure` 层。
    *   两者都依赖于 `domain` 层定义的接口。
    *   *好处*：更换翻译源（如从 Google 换到 Bing）只需新增一个 Service 实现，无需修改 UI 代码。

2.  **MVVM 模式 (Model-View-ViewModel)**：
    *   为了彻底解耦 UI 框架与业务逻辑，我们采用了**框架无关**的 MVVM 实现。
    *   **ViewModel (`LinxTransViewModel`)**：位于 `adapters` 层。一个纯 TypeScript 类，不依赖 React/Vue。管理所有状态与交互逻辑。
    *   **Binder (`useLinxTransModel`)**：位于 `presentation` 层。一个 React Hook，仅负责将 VM 的状态绑定到 React 视图。
    *   **View (`LinxTransApp`)**：完全无脑的 UI 渲染组件。
    *   *好处*：核心逻辑可以在不同 UI 框架间 100% 复用 (如迁移到 Vue 或 Flutter)。

3.  **单一职责 (Single Responsibility)**：
    *   **Components**: 专注于 "如何显示" (Rendering)。
    *   **Hooks**: 专注于 "如何交互" (State & Effects)。
    *   **Utils**: 专注于 "纯计算" (Pure Logic)。

3.  **UI 隔离 (UI Isolation)**：
    *   使用 **Shadow DOM** 将插件 UI 封装在独立的 DOM 树中，彻底杜绝宿主页面 CSS 对插件样式的污染，同时也防止插件样式影响原网页。

## 🛠 开发与构建

### 1. 环境准备
```bash
npm install
```

### 2. 构建产物
```bash
# 生产构建 (产物位于 dist/ 目录)
npm run build
```

### 3. 安装到浏览器
1. 打开 Chrome 扩展程序页面 `chrome://extensions/`。
2. 开启右上角的 **开发者模式**。
3. 点击 **加载已解压的扩展程序**，选择项目下的 `dist/` 文件夹。

## 📝 开发者笔记

- **Pure Class 架构**：所有的交互逻辑（选区计算、翻译流转、快捷键）都封装在 `LinxTransViewModel` 纯类中，便于单独测试与移植。
- **UI 绑定 (Binding)**：`useLinxTransModel` hook 充当了 "胶水" 的角色，它通过订阅 (Subject-Observer) 模式监听 VM 的变化并触发组件重渲染。
- **样式注入**：利用 Vite 的 `?inline` 模式将 CSS 编译为字符串，在运行时注入 Shadow Root，确保插件在任何网页环境下都能完美还原 macOS 质感而不受外部样式干扰。
- **BEM 规范**：类名严格遵循 `linxtrans-[block]__[element]--[modifier]`。例如弹窗的关闭状态使用 `linxtrans-popup--closing` 修饰符。

## 📜 开源协议
MIT License
