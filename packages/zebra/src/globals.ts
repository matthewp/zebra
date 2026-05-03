interface GlobalsOwner {
  _registerGlobal(g: GlobalTarget): void;
}

let activeView: GlobalsOwner | null = null;

export function getActiveView(): GlobalsOwner | null {
  return activeView;
}

export function setActiveView(view: GlobalsOwner | null): void {
  activeView = view;
}

interface BootedEntry {
  scopeEl: HTMLElement;
  cleanup: () => void;
}

let observer: MutationObserver | null = null;
let cleanupScheduled = false;
const booted = new Set<BootedEntry>();

function runCleanup(): void {
  cleanupScheduled = false;
  for (const entry of booted) {
    if (!entry.scopeEl.isConnected) {
      entry.cleanup();
      booted.delete(entry);
    }
  }
  if (booted.size === 0 && observer) {
    observer.disconnect();
    observer = null;
  }
}

function scheduleCleanup(): void {
  if (cleanupScheduled) return;
  cleanupScheduled = true;
  queueMicrotask(runCleanup);
}

function ensureObserver(): void {
  if (observer) return;
  observer = new MutationObserver(records => {
    for (let i = 0; i < records.length; i++) {
      if (records[i].removedNodes.length > 0) {
        scheduleCleanup();
        return;
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

export abstract class GlobalTarget {
  private _pending: Array<[string, EventListener]> = [];

  protected abstract _target(): EventTarget;

  constructor() {
    getActiveView()?._registerGlobal(this);
  }

  on(event: string, handler: EventListener): this {
    this._pending.push([event, handler]);
    return this;
  }

  _boot(scopeEl: HTMLElement): void {
    if (this._pending.length === 0) return;
    const target = this._target();
    const listeners = this._pending;
    this._pending = [];
    for (const [event, handler] of listeners) {
      target.addEventListener(event, handler);
    }
    ensureObserver();
    booted.add({
      scopeEl,
      cleanup: () => {
        for (const [event, handler] of listeners) {
          target.removeEventListener(event, handler);
        }
      },
    });
  }
}

export class Document extends GlobalTarget {
  protected _target(): EventTarget {
    return document;
  }
}

export class Window extends GlobalTarget {
  protected _target(): EventTarget {
    return window;
  }
}
