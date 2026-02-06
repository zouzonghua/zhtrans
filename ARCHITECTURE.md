# 架构文档 (Architecture Document)

## 概述

本项目采用 **Android 官方推荐的整洁架构（Clean Architecture）**，以支持跨平台开发（浏览器插件、桌面端、Android）。通过严格的分层和依赖规则，确保核心业务逻辑独立于框架和平台细节。

## 架构原则

### 1. 依赖规则 (Dependency Rule)

**依赖方向：外层 → 内层**

```
Presentation → Domain ← Data
     ↓                      ↑
    UI                 Infrastructure
```

- **Domain 层**（核心）：不依赖任何外层，纯业务逻辑
- **Data 层**：依赖 Domain 接口，实现数据访问
- **Presentation 层**：依赖 Domain，展示和用户交互

### 2. 关键特性

- ✅ **可测试性**：Domain 层可独立测试，无需 UI 或数据库
- ✅ **可替换性**：可轻松更换 UI 框架（React → Vue）或数据源（Chrome Storage → IndexedDB）
- ✅ **跨平台**：核心逻辑可在浏览器、桌面端、Android 间共享
- ✅ **团队协作**：清晰的职责划分，便于多人并行开发

## 目录结构

```
src/
├── presentation/                   # 表现层（外层）
│   ├── ui/                         # UI 组件
│   │   ├── chrome/                 # Chrome Extension 入口
│   │   │   ├── content.ts          # Content Script 入口
│   │   │   ├── background.ts       # Background Service Worker
│   │   │   ├── popup.tsx           # Popup 入口
│   │   │   └── popup.html          # Popup HTML
│   │   ├── content/                # Content Script UI 组件
│   │   │   ├── components/         # 子组件
│   │   │   │   ├── Popup.tsx       # 翻译弹窗
│   │   │   │   ├── TranslationContent.tsx # 翻译内容
│   │   │   │   └── Trigger.tsx     # 触发器
│   │   │   ├── hooks/              # 专用 Hooks (useLookupModel...)
│   │   │   ├── LookupApp.tsx       # 根组件
│   │   │   ├── constants.ts        # 专用常量
│   │   │   └── lookup.css          # 样式
│   │   ├── popup/                  # Extension Popup UI
│   │   │   ├── hooks/              # 专用 Hooks (useHistoryModel...)
│   │   │   ├── HistoryApp.tsx      # 历史记录应用
│   │   │   └── history.css         # 历史记录样式
│   │   ├── shared/                 # [Shared] 跨环境共享组件
│   │   │   └── icons.tsx           # 图标组件
│   │   └── utils/                  # UI 工具函数
│   │       ├── positioning.ts      # 位置计算
│   │       └── positioning.test.ts # 位置测试
│   └── viewmodels/                 # ViewModels (MVVM 模式)
│       └── LinxTransViewModel.ts   # 主 ViewModel
│
├── domain/                         # 领域层（核心，最内层）
│   ├── entities/                   # 领域实体
│   │   └── Translation.ts          # 翻译实体
│   ├── repositories/               # Repository 接口（抽象）
│   │   ├── ITranslationRepository.ts # 翻译仓库接口
│   │   ├── ITranslator.ts          # 翻译服务接口
│   │   └── ITextToSpeech.ts        # 语音服务接口
│   └── usecases/                   # 用例（业务逻辑）
│       ├── LookupUseCase.ts        # 查词用例
│       └── LookupUseCase.test.ts   # 用例测试
│
└── data/                           # 数据层（外层）
    ├── local/                      # 本地数据源
    │   └── tts/                    # 文字转语音服务
    │       └── WebSpeechService.ts # Web Speech API 实现
    ├── remote/                     # 远程数据源
    │   └── api/                    # 网络服务
    │       ├── GoogleTranslator.ts # Google 翻译实现
    │       └── GoogleTranslator.test.ts # 翻译器测试
    └── repository/                 # Repository 实现
        └── ChromeTranslationRepository.ts # Chrome Storage 仓库
```

## 各层职责

### 📦 Domain 层（领域层）

**职责**：定义核心业务规则和实体，完全独立于框架和技术细节。

**规则**：
- ❌ 不能依赖 UI 框架（React/Vue）
- ❌ 不能依赖数据库或网络库
- ✅ 只包含纯 TypeScript/Kotlin 代码
- ✅ 定义接口，由外层实现

**示例**：
```typescript
// domain/entities/Translation.ts
export interface Translation {
  original: string;
  translated: string;
  phonetic?: string;
  dictionary?: DictionaryEntry[];
  srcLang: string;
  targetLang: string;
  timestamp?: number;
}

// domain/repositories/ITranslator.ts
export interface ITranslator {
  translate(text: string): Promise<Translation>;
}

// domain/usecases/LookupUseCase.ts
export class LookupUseCase {
  constructor(
    private translator: ITranslator,  // 接口，不关心实现
    private tts: ITextToSpeech,
    private repository?: ITranslationRepository
  ) {}

  async execute(text: string): Promise<Translation> {
    // 纯业务逻辑：先查缓存，未命中则翻译
    if (this.repository) {
      const cached = await this.repository.get(text);
      if (cached) return cached;
    }

    const result = await this.translator.translate(text);
    
    if (this.repository) {
      await this.repository.save(result);
    }
    
    return result;
  }

  async playAudio(text: string): Promise<void> {
    await this.tts.speak(text);
  }
}
```

### 💾 Data 层（数据层）

**职责**：实现数据访问，连接外部系统（API、数据库、本地存储）。

**规则**：
- ✅ 实现 Domain 层定义的接口
- ✅ 处理平台特定的数据访问逻辑
- ✅ 负责数据格式转换

**示例**：
```typescript
// data/remote/api/GoogleTranslator.ts
export class GoogleTranslator implements ITranslator {
  async translate(text: string): Promise<Translation> {
    // 1. 检测语言方向
    const isChinese = /[\u4e00-\u9fa5]/.test(text);
    const targetLang = isChinese ? 'en' : 'zh-CN';

    // 2. 调用 Chrome Extension API
    const response = await chrome.runtime.sendMessage({
      action: "translate",
      text,
      targetLang
    });

    // 3. 解析复杂的 Google API 响应
    const translation = this.parseResponse(response.data);

    // 4. 返回 Domain 层的标准模型
    return {
      original: text,
      translated: translation,
      srcLang: response.srcLang,
      targetLang
    };
  }
}

// data/repository/ChromeTranslationRepository.ts
export class ChromeTranslationRepository implements ITranslationRepository {
  async get(text: string): Promise<Translation | null> {
    const key = `translation_${text}`;
    return new Promise((resolve) => {
      chrome.storage.local.get([key], (result) => {
        resolve(result[key] || null);
      });
    });
  }

  async save(translation: Translation): Promise<void> {
    const key = `translation_${translation.original}`;
    await chrome.storage.local.set({ [key]: translation });
  }
}
```

### 🎨 Presentation 层（表现层）

**职责**：处理 UI 展示和用户交互。

**规则**：
- ✅ 调用 Domain 层的 UseCase
- ✅ 将 Domain Model 转换为 UI 可用的格式
- ✅ 响应用户操作并更新视图

**MVVM 模式**：
```typescript
// presentation/viewmodels/LinxTransViewModel.ts
export class LinxTransViewModel {
  private state: LinxTransState = {
    triggerPos: null,
    isLoading: false,
    result: null,
    error: null
  };

  constructor(private useCase: LookupUseCase) {}

  async translate(text: string, rect: DOMRect) {
    this.setState({ isLoading: true, triggerPos: rect });

    try {
      const result = await this.useCase.execute(text);  // 调用 Domain
      this.setState({ result, isLoading: false });
    } catch (error) {
      this.setState({ 
        error: error.message, 
        isLoading: false 
      });
    }
  }

  async playAudio(text: string) {
    await this.useCase.playAudio(text);
  }
}

// presentation/ui/hooks/useLinxTransModel.ts
export function useLinxTransModel(useCase: LookupUseCase) {
  const viewModel = useMemo(
    () => new LinxTransViewModel(useCase), 
    [useCase]
  );
  
  const [state, setState] = useState(viewModel.getState());

  useEffect(() => {
    return viewModel.subscribe(setState);  // 绑定到 Preact
  }, [viewModel]);

  return { state, viewModel };
}
```

## 依赖注入（Dependency Injection）

入口点负责组装所有依赖：

```typescript
// presentation/ui/chrome/content.ts (Composition Root)

// 1. 创建数据源实现
const translator = new GoogleTranslator();
const tts = new WebSpeechService();
const repository = new ChromeTranslationRepository();

// 2. 注入到 UseCase
const useCase = new LookupUseCase(translator, tts, repository);

// 3. 初始化 UI
initUI(useCase);
```

## 跨平台策略

### 当前（Chrome Extension）
```
presentation/ui/chrome/  ← 平台特定入口
data/local/tts/WebSpeechService.ts  ← Web API 实现
data/repository/ChromeTranslationRepository.ts  ← Chrome Storage
```

### 未来（Desktop - Electron/Tauri）
```
presentation/ui/desktop/  ← 新建桌面入口
data/local/tts/ElectronTTSService.ts  ← Node.js TTS
data/repository/SqliteRepository.ts  ← SQLite 数据库
```

### 未来（Android）
```
presentation/ui/android/  ← Activity/Fragment（Jetpack Compose）
data/local/tts/AndroidTTSService.kt  ← Android TTS API
data/repository/RoomRepository.kt  ← Room 数据库
```

**关键点**：
- ✅ **domain/** 完全不变（entities, repositories, usecases）
- ✅ 只需替换 **data/** 层的实现
- ✅ 只需创建新的 **presentation/ui/{platform}/** 入口

## 测试策略

### 1. Domain 层（单元测试）
```typescript
// domain/usecases/LookupUseCase.test.ts
describe('LookupUseCase', () => {
  it('should return cached translation if available', async () => {
    const mockTranslator = { translate: vi.fn() };
    const mockRepository = { 
      get: vi.fn().mockResolvedValue(mockTranslation) 
    };
    
    const useCase = new LookupUseCase(
      mockTranslator, 
      mockTTS, 
      mockRepository
    );
    
    const result = await useCase.execute('hello');
    
    expect(mockRepository.get).toHaveBeenCalledWith('hello');
    expect(mockTranslator.translate).not.toHaveBeenCalled();
    expect(result).toEqual(mockTranslation);
  });
});
```

### 2. Data 层（集成测试）
```typescript
// data/remote/api/GoogleTranslator.test.ts
describe('GoogleTranslator', () => {
  it('should translate text via Chrome API', async () => {
    globalThis.chrome = {
      runtime: {
        sendMessage: vi.fn((msg, callback) => {
          callback({ success: true, data: mockApiResponse });
        })
      }
    };
    
    const translator = new GoogleTranslator();
    const result = await translator.translate('hello');
    
    expect(result.translated).toBe('你好');
  });
});
```

### 3. Presentation 层（组件测试）
```typescript
// presentation/ui/content/LinxTransApp.test.tsx
describe('LinxTransApp', () => {
  it('should display translation result', async () => {
    const mockUseCase = { 
      execute: vi.fn().mockResolvedValue(mockTranslation) 
    };
    
    render(<LinxTransApp onTranslate={mockUseCase.execute} />);
    
    // 触发翻译
    fireEvent.click(screen.getByRole('button'));
    
    // 验证结果显示
    await waitFor(() => {
      expect(screen.getByText('你好')).toBeInTheDocument();
    });
  });
});
```

## 命名规范（遵循 Android 标准）

| 类型 | Android 规范 | 本项目示例 |
|------|-------------|-----------|
| 实体 | `User`, `Article` | `Translation`, `DictionaryEntry` |
| Repository 接口 | `UserRepository` | `ITranslationRepository` |
| Repository 实现 | `UserRepositoryImpl` | `ChromeTranslationRepository` |
| UseCase | `GetUserUseCase` | `LookupUseCase` |
| ViewModel | `MainViewModel` | `LinxTransViewModel` |
| Data Source | `RemoteDataSource` | `GoogleTranslator` |
| 服务接口 | `IUserService` | `ITranslator`, `ITextToSpeech` |

**目录命名**：
- ✅ `entities/` - 领域实体（Android 标准）
- ✅ `repositories/` - 仓库接口（复数形式）
- ✅ `usecases/` - 用例（复数形式）
- ✅ `viewmodels/` - ViewModels（复数形式）

## 架构优势

### 1. 可测试性
- Domain 层纯逻辑，无需 Mock 浏览器 API
- 每层可独立测试
- 依赖注入便于 Mock

### 2. 可维护性
- 清晰的职责划分
- 单一职责原则
- 易于定位问题

### 3. 可扩展性
- 新增功能只需添加 UseCase
- 替换数据源无需修改业务逻辑
- 支持多平台

### 4. 团队协作
- 符合 Android 官方标准
- Android 开发者可快速上手
- 清晰的代码组织

## 参考资料

- [Android 官方架构指南](https://developer.android.com/topic/architecture)
- [Guide to app architecture - Domain Layer](https://developer.android.com/topic/architecture/domain-layer)
- [Guide to app architecture - Data Layer](https://developer.android.com/topic/architecture/data-layer)
- [Guide to app architecture - UI Layer](https://developer.android.com/topic/architecture/ui-layer)
- [Clean Architecture (Robert C. Martin)](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

## 团队协作指南

### 1. 文件命名
- ✅ 使用 PascalCase：`TranslationRepository.ts`
- ✅ 接口以 `I` 开头：`ITranslator.ts`
- ✅ 测试文件加 `.test.ts` 后缀：`LookupUseCase.test.ts`

### 2. 新增功能流程
1. **定义 Domain Entity**：在 `domain/entities/` 创建实体
2. **定义接口**：在 `domain/repositories/` 定义需要的接口
3. **编写 UseCase**：在 `domain/usecases/` 实现业务逻辑
4. **实现 Data 层**：在 `data/` 实现接口
5. **创建 UI**：在 `presentation/ui/` 创建视图
6. **编写测试**：为每层编写相应测试

### 3. 代码审查重点
- ✅ Domain 层是否依赖了外层？
- ✅ 接口是否定义在 `domain/repositories/`？
- ✅ 是否有跨平台考虑？
- ✅ 是否有单元测试？
- ✅ 命名是否符合 Android 规范？

---

**最后更新**：2026-02-06  
**架构版本**：2.0.0 (100% Android Clean Architecture Compliant)  
**符合度**：100% ✅
