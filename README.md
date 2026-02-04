# Glimpse

Glimpse 是一款追求极简主义、深度还原 macOS 原生“查找 (Look Up)”质感的 Chrome 翻译插件。

## ✨ 特性

- **macOS 视觉还原**：
  - **玻璃拟态**：高饱和度 `backdrop-filter` 模糊背景，支持系统级深色模式。
  - **动态尖角**：弹出气泡的尖角根据选词位置动态滑动，精准指向文本中心。
  - **弹性动画**：模拟系统级 UI 的弹性入场效果。
- **整洁架构 (Clean Architecture)**：代码层级清晰，业务逻辑与平台 API 完全解耦，具备极强的跨平台扩展性。
- **智能交互**：
  - 中英双向自动语种识别翻译。
  - **精准语音控制**：单词发音带脉冲呼吸灯动效，利用 `onend` 回调实现动画与语音的完美同步。
- **现代技术栈**：TypeScript + Vite + Shadow DOM 隔离技术。

## 🏗 架构与目录结构

本项目严格遵循整洁架构 (Clean Architecture) 原则。以下是完整的项目目录树及文件职责说明：

```text
Glimpse/
├── dist/                     # [构建产物] 最终交付给 Chrome 的代码包
├── public/
│   └── manifest.json         # 插件配置文件
├── src/
│   ├── application/          # [应用层] 具体的业务用例，协调 Domain 和 Infrastructure
│   │   └── usecases/
│   │       └── LookupUseCase.ts  # "查词"用例：组合翻译与发音逻辑 (纯业务逻辑)
│   │
│   ├── domain/               # [核心层] 纯净的业务实体与接口契约 (不依赖外部库)
│   │   ├── entities/
│   │   │   └── Translation.ts    # 翻译结果与词典条目的数据结构定义 (纯数据)
│   │   └── interfaces/
│   │       ├── ITextToSpeech.ts  # 语音服务接口定义
│   │       └── ITranslator.ts    # 翻译服务接口定义
│   │       └── ITranslationRepository.ts # 仓储接口定义
│   │
│   ├── infrastructure/       # [基础设施层] 外部服务与 API 的具体实现 (适配器)
│   │   ├── repositories/
│   │   │   └── ChromeTranslationRepository.ts # 基于 chrome.storage 的持久化实现
│   │   └── services/
│   │       ├── GoogleTranslator.ts # Google API 适配器 (处理消息转发与 JSON 解析)
│   │       └── WebSpeechService.ts # 浏览器 Speech API 适配器 (封装 Promise 异步控制)
│   │
│   ├── main/                 # [入口层] 程序启动与组装
│   │   └── chrome/
│   │       ├── background.ts     # 后台脚本：负责处理跨域请求代理
│   │       └── content.ts        # 前台脚本：负责依赖注入、类型安全的事件监听与流程控制
│   │
│   └── presentation/         # [表现层] UI 渲染与交互
│       └── ShadowDomView.ts      # Shadow DOM 视图：负责样式隔离、DOM 操作、状态管理与动画
│
├── vite.config.ts            # Vite 构建配置
└── tsconfig.json             # TypeScript 配置
```

## 🛠 开发与构建

### 1. 环境准备
```bash
npm install
```

### 2. 构建产物
```bash
# 开发模式 (监听文件变动，保存即更新)
npm run dev

# 生产构建 (生成优化后的代码)
npm run build
```

### 3. 安装到浏览器 (重要)
1. 打开 Chrome 扩展程序页面 `chrome://extensions/`。
2. 开启右上角的 **开发者模式**。
3. 点击 **加载已解压的扩展程序**。
4. **【关键】** 选择项目下的 `dist/` 文件夹（而非根目录）。

## 📝 开发者笔记

- **纯净领域模型**：Domain 层实体 (`Translation`) 仅包含核心数据，移除了所有 UI 相关的字段（如 `displayTitle`），确保了业务核心的纯净性。
- **状态管理**：`ShadowDomView` 封装了类型安全的 DOM 状态管理接口 (`setSelectionState`)，杜绝了不安全的 `any` 类型转换。
- **样式级联**：由于使用了 Shadow DOM 技术，所有的 UI 样式均在 `src/presentation/ShadowDomView.ts` 的 `injectStyles` 方法中定义。这确保了插件在任何网页下都能保持完美的 macOS 质感，不受网页原生 CSS 污染。
- **跨域处理**：翻译请求由 `content.ts` 发起，通过插件消息机制 (`chrome.runtime.sendMessage`) 转发至 `background.ts` 执行 `fetch`，以规避浏览器的跨域 (CORS) 限制。

## 📜 开源协议
MIT License