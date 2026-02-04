import { h, render } from 'preact';
import { GlimpseApp } from './components/GlimpseApp';
import styles from './styles.css?inline';
import { LookupUseCase } from '@/application/usecases/LookupUseCase';

export function initUI(useCase: LookupUseCase) {
  // 创建 Shadow DOM 的宿主元素
  const container = document.createElement('div');
  container.id = 'glimpse-host';
  document.body.appendChild(container);
  
  // 使用 Shadow DOM (mode: open) 隔离插件样式，防止被宿主页面的 CSS 污染
  const shadowRoot = container.attachShadow({ mode: 'open' });

  // 注入预定义的全局样式
  const styleTag = document.createElement('style');
  styleTag.textContent = styles;
  shadowRoot.appendChild(styleTag);

  // 在 Shadow DOM 内部创建一个挂载点供 Preact 使用
  const root = document.createElement('div');
  shadowRoot.appendChild(root);

  // 渲染 Preact 应用，并注入业务用例 (Dependency Injection)
  render(
    <GlimpseApp 
      onTranslate={(text) => useCase.execute(text)}
      onSpeak={(text) => useCase.playAudio(text)}
      onStopSpeak={() => useCase.stopAudio()}
    />, 
    root
  );

  /**
   * 监听全局点击事件以关闭 UI。
   * 注意：因为使用了 Shadow DOM，点击内部元素时 e.target 会被重定向到宿主元素 (glimpse-host)。
   */
  document.addEventListener('mousedown', (e) => {
    const target = e.target as HTMLElement;
    if (target.id !== 'glimpse-host' && (window as any).glimpseHideAll) {
      (window as any).glimpseHideAll();
    }
  });
}
