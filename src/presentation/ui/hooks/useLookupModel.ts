import { useEffect, useState, useMemo } from 'preact/hooks';
import { LookupViewModel, LookupState } from '@/presentation/viewmodels/LookupViewModel';
import { LookupUseCase } from '@/domain/usecases/LookupUseCase';
import { useDismissal } from './useDismissal';
import { useSelectionTrigger } from './useSelectionTrigger';
import { useShortcuts } from './useShortcuts';

/**
 * LinxTrans ViewModel Binder (Preact 适配器)
 * 
 * 职责：
 * 1. 实例化纯 TypeScript 的 ViewModel (LinxTransViewModel)
 * 2. 将 ViewModel 的状态桥接到 Preact 的响应式系统 (State Binding)
 * 3. 负责"平台适配"：使用 Hooks 监听 DOM 事件并转发给 ViewModel
 */
import { SpeakTextUseCase } from '@/domain/usecases/SpeakTextUseCase';

// ...

export function useLookupModel(useCase: LookupUseCase, speakUseCase: SpeakTextUseCase) {
    // 1. 实例化纯 ViewModel (不再需要 Proxy)
    const viewModel = useMemo(() => {
        return new LookupViewModel(useCase, speakUseCase);
    }, [useCase, speakUseCase]);

    // 2. 状态绑定
    const [state, setState] = useState<LookupState>(viewModel.getState());

    useEffect(() => {
        const unsubscribe = viewModel.subscribe((newState) => {
            setState({ ...newState });
        });
        return unsubscribe;
    }, [viewModel]);

    // 3. 平台适配 (Platform Adapters) -> DOM 事件监听

    // 监听鼠标选区 -> ViewModel.showTrigger
    useSelectionTrigger((info) => {
        // 只有当没有弹窗结果时才显示触发图标 (保持原有体验)
        // 或者让 ViewModel 自己决定？我们在 Hook 中做了基础校验
        // 这里直接转发给 ViewModel
        viewModel.showTrigger(info.triggerPos.x, info.triggerPos.y, info.text, info.rect);
    });

    // 监听键盘快捷键 -> ViewModel.translate / toggleSpeak
    useShortcuts({
        onTranslate: (text, rect) => {
            // 隐藏触发图标 (如果存在)
            // 触发翻译
            viewModel.translate(text, rect);
        },
        onSpeak: (text, rect) => {
            // 逻辑分流:
            // 1. 如果已有结果显示，则切换当前播放状态 (Play/Pause)
            // 2. 如果没有结果，但有选区，则执行"翻译并朗读" (Translate & Speak)

            const currentState = viewModel.getState();

            if (currentState.result) {
                viewModel.toggleSpeak();
            } else if (text && rect) {
                // 隐藏触发图标 (如果存在)
                viewModel.showTrigger(rect.right + 2, rect.top - 28, text, rect); // 甚至不需要 update state，直接 translate 会清空 trigger
                // 但为了严谨，直接调用 translateAndSpeak
                viewModel.translateAndSpeak(text, rect);
            }
        }
    });

    // 4. 关闭逻辑 (复用现有的 View Helper Hook)
    const { isClosing } = useDismissal(state.result, viewModel.reset, state.triggerPos);

    return {
        state: {
            ...state,
            isClosing
        },
        actions: {
            handleTriggerClick: viewModel.handleTriggerClick,
            handleExternalClick: viewModel.handleExternalClick,
            handleSpeak: viewModel.speak,
            handleRetry: viewModel.retryLast,
            handleReposition: viewModel.updatePopupPosition
        }
    };
}
