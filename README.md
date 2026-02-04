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

## 🏗 架构与目录结构

```text
Glimpse/
├── src/
│   ├── application/          # [应用层] 业务用例 (LookupUseCase)
│   ├── domain/               # [核心层] 实体与接口契约
│   ├── infrastructure/       # [基础设施层] 外部服务实现 (Google API, Web Speech)
│   ├── main/                 # [入口层] 程序组装与挂载
│   └── presentation/         # [表现层] Preact 组件化 UI
│       ├── components/           # 原子化组件 (Trigger, Popup, Content)
│       └── styles.css            # 标准 BEM 样式文件
```

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

- **滚动销毁逻辑**：在 `GlimpseApp.tsx` 中通过 `capture` 模式监听 `scroll` 事件。当检测到滚动且存在弹窗时，激活 `.glimpse-popup--closing` 动画类，并利用 `setTimeout` 在动画结束后（200ms）清理状态。
- **样式注入**：利用 Vite 的 `?inline` 模式将 CSS 编译为字符串，在运行时注入 Shadow Root，确保插件在任何网页环境下都能完美还原 macOS 质感而不受外部样式干扰。
- **BEM 规范**：类名严格遵循 `glimpse-[block]__[element]--[modifier]`。例如弹窗的关闭状态使用 `glimpse-popup--closing` 修饰符。

## 📜 开源协议
MIT License
