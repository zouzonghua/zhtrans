import { useEffect, useState, useMemo } from 'preact/hooks';
import { Translation } from '@/domain/entities/Translation';
import { GlimpseViewModel, GlimpseState } from '@/adapters/GlimpseViewModel';
import { LookupUseCase } from '@/application/usecases/LookupUseCase';
import { useDismissal } from './useDismissal';

interface UseGlimpseModelProps {
    /** 翻译回调 */
    onTranslate: (text: string) => Promise<Translation>;
    /** 朗读回调 */
    onSpeak: (text: string) => Promise<void>;
    /** 停止朗读回调 */
    onStopSpeak: () => void;
}

/**
 * Glimpse ViewModel Binder (Preact 适配器)
 * 
 * 职责：
 * 1. 实例化纯 TypeScript 的 ViewModel (GlimpseViewModel)
 * 2. 将 ViewModel 的状态桥接到 Preact 的响应式系统 (State Binding)
 * 3. 管理生命周期 (Mount/Unmount)
 */
export function useGlimpseModel({ onTranslate, onSpeak, onStopSpeak }: UseGlimpseModelProps) {
    // 1. 实例化纯 ViewModel (保持引用稳定)
    // 在真正的依赖注入(DI)系统中，这里通常通过 useDI() 或 Context 获取
    const viewModel = useMemo(() => {
        // 临时方案：我们在构造 ViewModel 时创建一个 "代理 UseCase"。
        // 理想情况下，GlimpseViewModel 应该通过依赖注入 (DI) 接收一个完整的 LookupUseCase。

        // 这里的 onTranslate prop 实际上直接执行了用例逻辑 (在 content.ts 中定义)，
        // 所以我们将其包装成 UseCase 接口的形式。
        const useCaseProxy = {
            execute: onTranslate,
            playAudio: onSpeak,
            stopAudio: onStopSpeak
        } as unknown as LookupUseCase;

        return new GlimpseViewModel(useCaseProxy);
    }, []); // 依赖数组为空 = 仅在组件挂载时创建一次

    // 2. 状态绑定 (将 ViewModel 的 state 同步到 Preact)
    const [state, setState] = useState<GlimpseState>(viewModel.getState());

    // 3. 生命周期与订阅
    useEffect(() => {
        // 挂载逻辑 (添加 DOM 监听等)
        viewModel.mount();

        // 订阅状态变更
        const unsubscribe = viewModel.subscribe((newState) => {
            setState({ ...newState }); // 展开对象以确保引用变化，触发 React 更新
        });

        // 卸载逻辑
        return () => {
            unsubscribe();
            viewModel.unmount();
        };
    }, [viewModel]);

    // 4. 关闭逻辑 (复用现有的 View Helper Hook)
    // 纯 ViewModel 处理内部状态重置，但"点击外部关闭"和"滚动隐藏"
    // 依赖于 DOM 事件和特定行为，目前作为 View 的辅助逻辑保留在 Hook 中。
    // 未来可以将这部分逻辑也移入 ViewModel 的 mount/unmount 中监听。

    // 我们传入 viewModel.reset 作为回调，当触发关闭条件（如滚动）时重置 VM 状态。
    const { isClosing } = useDismissal(state.result, viewModel.reset);

    // 组合 VM 的状态与本地 UI 状态 (动画状态 isClosing)
    // Note: `isClosing` is purely cosmetic state for animation, acceptable to stay in View layer
    // or be merged into VM state. The VM has `isClosing` in definition but maybe not logic?
    // Let's just override/merge.

    return {
        state: {
            ...state,
            isClosing // Use the hook's animation state for now
        },
        actions: {
            handleTriggerClick: viewModel.handleTriggerClick,
            handleExternalClick: viewModel.handleExternalClick,
            handleSpeak: viewModel.speak
        }
    };
}
