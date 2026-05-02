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
const booted = new Set<BootedEntry>();

function ensureObserver(): void {
  if (observer) return;
  observer = new MutationObserver(() => {
    for (const entry of booted) {
      if (!entry.scopeEl.isConnected) {
        entry.cleanup();
        booted.delete(entry);
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
