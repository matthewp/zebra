import { Element, type Child } from './element.ts';

export class View extends Element {
  protected _rendered: Element | null = null;

  constructor() {
    super('');
  }

  render(): Element {
    return new Element('div');
  }

  protected _getRendered(): Element {
    if (!this._rendered) {
      this._rendered = this.render();
    }
    return this._rendered;
  }

  append(...children: Child[]): this {
    this._getRendered().append(...children);
    return this;
  }

  prepend(...children: Child[]): this {
    this._getRendered().prepend(...children);
    return this;
  }

  setText(text: string): this {
    this._getRendered().setText(text);
    return this;
  }

  setAttribute(name: string, value: string): this {
    this._getRendered().setAttribute(name, value);
    return this;
  }

  removeAttribute(name: string): this {
    this._getRendered().removeAttribute(name);
    return this;
  }

  toggleAttribute(name: string, force?: boolean): this {
    this._getRendered().toggleAttribute(name, force);
    return this;
  }

  addClass(...classes: string[]): this {
    this._getRendered().addClass(...classes);
    return this;
  }

  removeClass(...classes: string[]): this {
    this._getRendered().removeClass(...classes);
    return this;
  }

  toggleClass(name: string, force?: boolean): this {
    this._getRendered().toggleClass(name, force);
    return this;
  }

  setStyle(prop: string, value: string): this {
    this._getRendered().setStyle(prop, value);
    return this;
  }

  removeStyle(prop: string): this {
    this._getRendered().removeStyle(prop);
    return this;
  }

  show(): this {
    this._getRendered().show();
    return this;
  }

  hide(): this {
    this._getRendered().hide();
    return this;
  }

  on(event: string, handler: EventListener): this {
    this._getRendered().on(event, handler);
    return this;
  }

  setHTML(html: string): this {
    const r = this._getRendered();
    if (r instanceof Element) r.setHTML(html);
    return this;
  }

  clear(): this {
    this._getRendered().clear();
    return this;
  }

  disable(): this {
    this._getRendered().disable();
    return this;
  }

  enable(): this {
    this._getRendered().enable();
    return this;
  }

  toDOM(): HTMLElement {
    if (this.el) return this.el;
    const el = this._getRendered().toDOM();
    this.el = el;
    return el;
  }

  toString(): string {
    return this._getRendered().toString();
  }

  mount(container: HTMLElement): this {
    container.append(this.toDOM());
    return this;
  }
}
