import { LookupUseCase } from '@/application/usecases/LookupUseCase';
import { GoogleTranslator } from '@/infrastructure/services/GoogleTranslator';
import { WebSpeechService } from '@/infrastructure/services/WebSpeechService';
import { ShadowDomView } from '@/presentation/ShadowDomView';

/**
 * 插件入口点 (Main / Composition Root)
 * 负责依赖注入、对象组装以及将各模块绑定到 DOM 事件。
 */

// 1. 初始化依赖 (Dependency Injection)
const translator = new GoogleTranslator();
const tts = new WebSpeechService();
const view = new ShadowDomView();
const useCase = new LookupUseCase(translator, tts);

// 2. 监听全局鼠标抬起事件，处理选词
document.addEventListener('mouseup', (e) => {
  const selection = window.getSelection();
  const text = selection?.toString().trim();

  // 只有当有选词且长度适中时显示触发图标
  if (text && text.length > 0 && text.length < 500) {
    const range = selection!.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    // 在选区右上方显示小图标
    view.setTriggerPosition(rect.right + 2, rect.top - 28);
    
    // 临时存储当前选词信息
    (view.triggerElement as any)._currentText = text;
    (view.triggerElement as any)._currentRect = rect;
  } else {
    // 点击非插件区域时隐藏 UI 并停止播放
    if (!view.containerElement.contains(e.target as Node)) {
      view.hideTrigger();
      view.hidePopup();
      useCase.stopAudio();
    }
  }
});

// 3. 监听图标点击，执行翻译业务
view.triggerElement.addEventListener('mousedown', async (e) => {
  e.preventDefault();
  e.stopPropagation();
  
  view.hideTrigger();
  const text = (view.triggerElement as any)._currentText;
  const rect = (view.triggerElement as any)._currentRect;

  try {
    // 执行业务用例
    const result = await useCase.execute(text);
    
    // 渲染结果弹窗
    view.showPopup(rect, result);
    
    // 设置发音按钮逻辑
    view.setSpeakHandler(() => {
      view.toggleSpeakAnimation(true);
      useCase.playAudio(text);
      // 模拟播放时长后取消动画（实际可通过语音服务事件回调更精准控制）
      setTimeout(() => view.toggleSpeakAnimation(false), 2000); 
    });
    
  } catch (error) {
    console.error("Glimpse Error:", error);
  }
});
