import { render } from 'preact';
import { TranslateSubtitleUseCase } from '@/domain/usecases/TranslateSubtitleUseCase';
import { TeamsSubtitleApp } from './TeamsSubtitleApp';

const HOST_ID = 'zhtrans-teams-subtitle-host';
let host: HTMLDivElement | null = null;
let mountPoint: HTMLDivElement | null = null;
let fullscreenListenerRegistered = false;

export function mountTeamsSubtitleUI(useCase: TranslateSubtitleUseCase) {
    if (document.getElementById(HOST_ID)) return;

    host = document.createElement('div');
    host.id = HOST_ID;
    host.style.position = 'fixed';
    host.style.inset = '0';
    host.style.zIndex = '2147483647';
    host.style.pointerEvents = 'none';

    const shadowRoot = host.attachShadow({ mode: 'open' });
    mountPoint = document.createElement('div');
    shadowRoot.appendChild(mountPoint);

    attachHost();
    render(<TeamsSubtitleApp useCase={useCase} />, mountPoint);

    if (!fullscreenListenerRegistered) {
        document.addEventListener('fullscreenchange', attachHost);
        window.addEventListener('beforeunload', cleanup);
        fullscreenListenerRegistered = true;
    }
}

function attachHost() {
    if (!host) return;
    const parent = document.fullscreenElement || document.documentElement;
    if (host.parentElement !== parent) parent.appendChild(host);
}

function cleanup() {
    if (mountPoint) render(null, mountPoint);
    host?.remove();
    host = null;
    mountPoint = null;
}
