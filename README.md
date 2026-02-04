# Glimpse

Glimpse 是一款追求极简主义、深度还原 macOS 原生“查找 (Look Up)”质感的 Chrome 翻译插件。

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

Glimpse 遵循 **整洁架构 (Clean Architecture)** 原则，将关注点分离，确保业务逻辑独立于 UI 和外部框架。

### 目录结构说明

```text
Glimpse/
├── src/
│   ├── domain/               # [核心层] 业务实体与接口契约
│   │   ├── entities/         # 核心数据模型 (如 Translation, DictionaryEntry)
│   │   └── repositories/     # 仓储接口定义 (定义 "如何获取数据" 的标准)
│   │
│   ├── application/          # [应用层] 业务用例 (Use Cases)
│   │   └── usecases/         # 封装具体业务逻辑 (如 LookupUseCase: 协调查词与发音)
│   │
│   ├── infrastructure/       # [基础设施层] 外部服务实现
│   │   ├── services/         # 第三方 API 集成 (GoogleTranslator, WebSpeech)
│   │   └── repositories/     # 仓储接口的具体实现
│   │
│   ├── presentation/         # [表现层] UI 与交互逻辑
│   │   ├── components/       # 原子化 UI 组件 (无状态 View，仅负责渲染)
│   │   │   ├── GlimpseApp    # 根组件：纯 UI (Dumb Component)
│   │   │   ├── Popup         # 翻译结果弹窗容器
│   │   │   ├── Trigger       # 划词浮动图标
│   │   │   └── ...
│   │   ├── hooks/            # [ViewModel & Logic] 交互逻辑层
│   │   │   ├── useGlimpseModel     # [ViewModel] 聚合所有逻辑，暴露 State & Actions
│   │   │   ├── useSelection        # [Logic] 负责监听选区与计算触发位置
│   │   │   ├── useTranslationFlow  # [Logic] 管理翻译 API 调用与结果状态流转
│   │   │   ├── useDismissal        # [Logic] 负责滚动销毁与其他关闭策略
│   │   │   └── useShortcutTrigger  # [Logic] 全局快捷键监听
│   │   ├── utils/            # 纯工具函数 (如几何位置计算 calculatePopupPosition)
│   │   └── styles.css        # 基于 BEM 规范的样式表
│   │
│   └── main/                 # [入口层] 平台特定入口 (Chrome Extension)
│       └── chrome/
│           ├── content.ts    # Content Script: 依赖注入 (DI) 与 UI 挂载
│           └── background.ts # Service Worker: 跨域代理与后台服务
```

### 核心设计思想

1.  **依赖倒置 (Dependency Inversion)**：
    *   `presentation` 层不直接依赖 `infrastructure` 层。
    *   两者都依赖于 `domain` 层定义的接口。
    *   *好处*：更换翻译源（如从 Google 换到 Bing）只需新增一个 Service 实现，无需修改 UI 代码。

2.  **MVVM 模式 (Model-View-ViewModel)**：
    *   为了治理表现层（Presentation Layer）的复杂性，我们在 UI 内部实现了 MVVM 模式。
    *   **View (`GlimpseApp`)**：只负责 JSX 渲染，不包含任何业务逻辑，是纯粹的 "Dumb Component"。
    *   **ViewModel (`useGlimpseModel`)**：作为 Controller，聚合所有底层 Hooks，管理所有 UI 状态（State）并暴露交互动作（Actions）。
    *   *好处*：实现了 UI 渲染与交互逻辑的彻底解耦，极大提升了代码的可维护性。

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

- **Custom Hooks 与 MVVM**：
  - **ViewModel (`useGlimpseModel`)**：这是表现层的大脑，它不处理具体逻辑，而是调度者。
  - **Logic Hooks**：核心逻辑被抽离为单一职责的 Hooks (`useSelection`, `useTranslationFlow` 等)，供 ViewModel 调用。
- **样式注入**：利用 Vite 的 `?inline` 模式将 CSS 编译为字符串，在运行时注入 Shadow Root，确保插件在任何网页环境下都能完美还原 macOS 质感而不受外部样式干扰。
- **BEM 规范**：类名严格遵循 `glimpse-[block]__[element]--[modifier]`。例如弹窗的关闭状态使用 `glimpse-popup--closing` 修饰符。

## 📜 开源协议
MIT License
