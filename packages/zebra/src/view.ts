export class View {
  el!: HTMLElement;

  createElement(): HTMLElement {
    let tpl = document.createElement('template');
    tpl.innerHTML = this.template();
    this.el = document.importNode(tpl.content, true).firstElementChild as HTMLElement;
    return this.el;
  }

  template(_props?: any): string {
    return '';
  }

  createAndMount(): void {
    this.mount(this.createElement());
  }

  mount(el: HTMLElement): void {
    this.el = el;
  }

  update(_data?: Record<string, unknown>): HTMLElement {
    return this.el;
  }
}

interface Slottable {
  template(props?: any): string;
}

export function slot<T extends Slottable>(target: T, ...args: Parameters<T['template']>): string {
  return target.template(...args);
}
