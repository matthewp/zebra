export { SafeHTML, html, unsafeHTML } from './html.ts';
import { SafeHTML, html } from './html.ts';

export class View<T = Record<string, unknown>> {
  el!: HTMLElement;

  createElement(): HTMLElement {
    let ctor = this.constructor as any;
    if (!ctor._tpl) {
      let tpl = document.createElement('template');
      tpl.innerHTML = this.template().toString();
      ctor._tpl = tpl.content.firstElementChild;
    }
    this.el = (ctor._tpl as HTMLElement).cloneNode(true) as HTMLElement;
    return this.el;
  }

  template(_props?: T): SafeHTML {
    return html``;
  }

  createAndMount(): void {
    this.mount(this.createElement());
  }

  mount(el: HTMLElement): void {
    this.el = el;
  }

  update(_data?: T): HTMLElement {
    return this.el;
  }
}

interface Slottable {
  template(props?: any): SafeHTML;
}

export function slot<T extends Slottable>(target: T, ...args: Parameters<T['template']>): SafeHTML {
  return target.template(...args);
}
