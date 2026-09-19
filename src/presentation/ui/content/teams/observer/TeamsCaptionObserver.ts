export interface TeamsCaption {
    speaker: string;
    text: string;
}

export interface TeamsCaptionSource {
    start(): void;
    stop(): void;
}

interface CaptionState {
    element: Element;
    speaker: string;
    text: string;
    firstSeenAt: number;
    timer: number;
}

const CAPTION_SELECTOR = '[data-tid="closed-caption-text"]';
const AUTHOR_SELECTOR = '[data-tid="author"]';
const SETTLE_DELAY_MS = 700;
const MAX_HOLD_MS = 2500;
const CLEAR_DELAY_MS = 1500;
const FINGERPRINT_TTL_MS = 60_000;

/**
 * 监听 Teams Web 已渲染的实时字幕。
 * Teams 会持续改写同一个字幕节点，因此需要等待文本短暂稳定后再发送。
 */
export class TeamsCaptionObserver implements TeamsCaptionSource {
    private observer: MutationObserver | null = null;
    private scanTimer: number | null = null;
    private clearTimer: number | null = null;
    private states = new WeakMap<Element, CaptionState>();
    private activeStates = new Set<CaptionState>();
    private seenFingerprints = new Map<string, number>();

    constructor(private onCaption: (caption: TeamsCaption | null) => void) {}

    public start() {
        this.stop();

        this.observer = new MutationObserver(() => this.scheduleScan());
        this.observer.observe(document.body || document.documentElement, {
            childList: true,
            subtree: true,
            characterData: true,
        });

        this.scanCaptions();
    }

    public stop() {
        this.observer?.disconnect();
        this.observer = null;

        if (this.scanTimer !== null) window.clearTimeout(this.scanTimer);
        if (this.clearTimer !== null) window.clearTimeout(this.clearTimer);
        this.scanTimer = null;
        this.clearTimer = null;

        for (const state of this.activeStates) {
            window.clearTimeout(state.timer);
        }
        this.activeStates.clear();
        this.states = new WeakMap();
        this.seenFingerprints.clear();
    }

    private scheduleScan() {
        if (this.scanTimer !== null) window.clearTimeout(this.scanTimer);
        this.scanTimer = window.setTimeout(() => {
            this.scanTimer = null;
            this.scanCaptions();
        }, 120);
    }

    private scanCaptions() {
        const nodes = Array.from(document.querySelectorAll(CAPTION_SELECTOR));

        if (nodes.length === 0) {
            this.scheduleClear();
            return;
        }

        if (this.clearTimer !== null) {
            window.clearTimeout(this.clearTimer);
            this.clearTimer = null;
        }

        for (const node of nodes) {
            this.trackNode(node);
        }
        this.pruneFingerprints();
    }

    private trackNode(node: Element) {
        const text = normalizeText(node.textContent);
        if (!text) return;

        const speaker = findSpeaker(node);
        const existing = this.states.get(node);
        if (existing?.text === text && existing.speaker === speaker) return;

        if (existing) {
            window.clearTimeout(existing.timer);
            this.activeStates.delete(existing);
        }

        const now = Date.now();
        const firstSeenAt = existing?.speaker === speaker ? existing.firstSeenAt : now;
        const state: CaptionState = {
            element: node,
            speaker,
            text,
            firstSeenAt,
            timer: 0,
        };

        const remainingHold = Math.max(0, MAX_HOLD_MS - (now - firstSeenAt));
        const delay = Math.min(SETTLE_DELAY_MS, remainingHold);
        state.timer = window.setTimeout(() => this.finalize(state), delay);
        this.states.set(node, state);
        this.activeStates.add(state);
    }

    private finalize(state: CaptionState) {
        this.activeStates.delete(state);

        if (this.states.get(state.element) !== state) return;
        const text = normalizeText(state.element.textContent);
        const speaker = findSpeaker(state.element);
        if (text !== state.text || speaker !== state.speaker) {
            this.trackNode(state.element);
            return;
        }

        const fingerprint = `${speaker.toLowerCase()}::${canonicalize(text)}`;
        if (this.seenFingerprints.has(fingerprint)) return;

        this.seenFingerprints.set(fingerprint, Date.now());
        this.onCaption({ speaker, text });
    }

    private scheduleClear() {
        if (this.clearTimer !== null) return;
        this.clearTimer = window.setTimeout(() => {
            this.clearTimer = null;
            if (!document.querySelector(CAPTION_SELECTOR)) {
                this.onCaption(null);
            }
        }, CLEAR_DELAY_MS);
    }

    private pruneFingerprints() {
        const cutoff = Date.now() - FINGERPRINT_TTL_MS;
        for (const [fingerprint, timestamp] of this.seenFingerprints) {
            if (timestamp < cutoff) this.seenFingerprints.delete(fingerprint);
        }
    }
}

function findSpeaker(captionNode: Element): string {
    let current: Element | null = captionNode;
    for (let depth = 0; current && depth < 12; depth += 1) {
        const author = current.querySelector(AUTHOR_SELECTOR);
        const name = normalizeText(author?.textContent);
        if (name) return name;
        current = current.parentElement;
    }
    return '';
}

function normalizeText(value: string | null | undefined): string {
    return String(value || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
}

function canonicalize(value: string): string {
    return normalizeText(value).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
}
