const ESC: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, ch => ESC[ch]);
}

function escapeAttr(s: string): string {
  return s.replace(/[&"]/g, ch => ESC[ch]);
}

const VOID_TAGS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
]);

export type Child = Node | string;

export abstract class Node {
  protected _children: Child[] = [];

  append(...children: Child[]): this {
    this._children.push(...children);
    return this;
  }

  prepend(...children: Child[]): this {
    this._children.unshift(...children);
    return this;
  }

  setText(text: string): this {
    this._children = [text];
    return this;
  }

  setAttribute(name: string, value: string): this {
    for (const child of this._children) {
      if (child instanceof Node) child.setAttribute(name, value);
    }
    return this;
  }

  removeAttribute(name: string): this {
    for (const child of this._children) {
      if (child instanceof Node) child.removeAttribute(name);
    }
    return this;
  }

  toggleAttribute(name: string, force?: boolean): this {
    for (const child of this._children) {
      if (child instanceof Node) child.toggleAttribute(name, force);
    }
    return this;
  }

  addClass(...classes: string[]): this {
    for (const child of this._children) {
      if (child instanceof Node) child.addClass(...classes);
    }
    return this;
  }

  removeClass(...classes: string[]): this {
    for (const child of this._children) {
      if (child instanceof Node) child.removeClass(...classes);
    }
    return this;
  }

  toggleClass(name: string, force?: boolean): this {
    for (const child of this._children) {
      if (child instanceof Node) child.toggleClass(name, force);
    }
    return this;
  }

  setStyle(prop: string, value: string): this {
    for (const child of this._children) {
      if (child instanceof Node) child.setStyle(prop, value);
    }
    return this;
  }

  removeStyle(prop: string): this {
    for (const child of this._children) {
      if (child instanceof Node) child.removeStyle(prop);
    }
    return this;
  }

  show(): this {
    for (const child of this._children) {
      if (child instanceof Node) child.show();
    }
    return this;
  }

  hide(): this {
    for (const child of this._children) {
      if (child instanceof Node) child.hide();
    }
    return this;
  }

  on(event: string, handler: EventListener): this {
    for (const child of this._children) {
      if (child instanceof Node) child.on(event, handler);
    }
    return this;
  }

  clear(): this {
    this._children = [];
    return this;
  }

  disable(): this {
    return this.toggleAttribute('disabled', true);
  }

  enable(): this {
    return this.toggleAttribute('disabled', false);
  }

  abstract toDOM(): HTMLElement | DocumentFragment;
  abstract toString(): string;

  mount(container: HTMLElement): this {
    container.append(this.toDOM());
    return this;
  }
}

export class Element extends Node {
  protected _tag: string;
  protected _attrs = new Map<string, string>();
  protected _classes = new Set<string>();
  protected _style = new Map<string, string>();
  protected _listeners: Array<[string, EventListener]> = [];
  el: HTMLElement | null = null;

  constructor(tag: string) {
    super();
    this._tag = tag;
  }

  append(...children: Child[]): this {
    this._children.push(...children);
    if (this.el) {
      for (const child of children) {
        this.el.append(child instanceof Node ? child.toDOM() : child);
      }
    }
    return this;
  }

  prepend(...children: Child[]): this {
    this._children.unshift(...children);
    if (this.el) {
      for (let i = children.length - 1; i >= 0; i--) {
        const child = children[i];
        this.el.prepend(child instanceof Node ? child.toDOM() : child);
      }
    }
    return this;
  }

  setText(text: string): this {
    this._children = [text];
    if (this.el) this.el.textContent = text;
    return this;
  }

  setAttribute(name: string, value: string): this {
    this._attrs.set(name, value);
    if (this.el) this.el.setAttribute(name, value);
    return this;
  }

  removeAttribute(name: string): this {
    this._attrs.delete(name);
    if (this.el) this.el.removeAttribute(name);
    return this;
  }

  toggleAttribute(name: string, force?: boolean): this {
    const has = this._attrs.has(name);
    const shouldHave = force === undefined ? !has : force;
    if (shouldHave) this._attrs.set(name, '');
    else this._attrs.delete(name);
    if (this.el) this.el.toggleAttribute(name, force);
    return this;
  }

  addClass(...classes: string[]): this {
    for (const c of classes) this._classes.add(c);
    if (this.el) this.el.classList.add(...classes);
    return this;
  }

  removeClass(...classes: string[]): this {
    for (const c of classes) this._classes.delete(c);
    if (this.el) this.el.classList.remove(...classes);
    return this;
  }

  toggleClass(name: string, force?: boolean): this {
    const has = this._classes.has(name);
    const shouldHave = force === undefined ? !has : force;
    if (shouldHave) this._classes.add(name);
    else this._classes.delete(name);
    if (this.el) this.el.classList.toggle(name, force);
    return this;
  }

  setStyle(prop: string, value: string): this {
    this._style.set(prop, value);
    if (this.el) this.el.style.setProperty(prop, value);
    return this;
  }

  removeStyle(prop: string): this {
    this._style.delete(prop);
    if (this.el) this.el.style.removeProperty(prop);
    return this;
  }

  show(): this {
    this._style.delete('display');
    if (this.el) this.el.style.removeProperty('display');
    return this;
  }

  hide(): this {
    this._style.set('display', 'none');
    if (this.el) this.el.style.display = 'none';
    return this;
  }

  on(event: string, handler: EventListener): this {
    this._listeners.push([event, handler]);
    if (this.el) this.el.addEventListener(event, handler);
    return this;
  }

  emit(name: string, detail?: unknown, options: { bubbles?: boolean; cancelable?: boolean } = {}): this {
    if (this.el) {
      this.el.dispatchEvent(new CustomEvent(name, {
        detail,
        bubbles: options.bubbles ?? true,
        cancelable: options.cancelable ?? false,
      }));
    }
    return this;
  }

  focus(): this {
    if (this.el) this.el.focus();
    return this;
  }

  blur(): this {
    if (this.el) this.el.blur();
    return this;
  }

  isFocused(): boolean {
    return this.el !== null && document.activeElement === this.el;
  }

  measure<T>(fn: (el: HTMLElement) => T): T | undefined {
    return this.el ? fn(this.el) : undefined;
  }

  setHTML(html: string): this {
    this._children = [new RawHTML(html)];
    if (this.el) this.el.innerHTML = html;
    return this;
  }

  clear(): this {
    this._children = [];
    if (this.el) this.el.replaceChildren();
    return this;
  }

  remove(): this {
    if (this.el) this.el.remove();
    return this;
  }

  toDOM(): HTMLElement {
    if (this.el) return this.el;

    const el = document.createElement(this._tag);
    this.el = el;

    for (const [name, value] of this._attrs) {
      el.setAttribute(name, value);
    }

    if (this._classes.size > 0) {
      el.className = Array.from(this._classes).join(' ');
    }

    for (const [prop, value] of this._style) {
      el.style.setProperty(prop, value);
    }

    for (const child of this._children) {
      el.append(child instanceof Node ? child.toDOM() : child);
    }

    for (const [event, handler] of this._listeners) {
      el.addEventListener(event, handler);
    }

    return el;
  }

  toString(): string {
    let html = `<${this._tag}`;

    if (this._classes.size > 0) {
      html += ` class="${escapeAttr(Array.from(this._classes).join(' '))}"`;
    }

    if (this._style.size > 0) {
      const styleStr = Array.from(this._style.entries())
        .map(([k, v]) => `${k}: ${v}`)
        .join('; ');
      html += ` style="${escapeAttr(styleStr)}"`;
    }

    for (const [name, value] of this._attrs) {
      html += ` ${name}="${escapeAttr(value)}"`;
    }

    html += '>';

    if (VOID_TAGS.has(this._tag)) return html;

    for (const child of this._children) {
      html += child instanceof Node ? child.toString() : escapeHtml(child);
    }

    html += `</${this._tag}>`;
    return html;
  }
}

export class RawHTML extends Node {
  private _html: string;

  constructor(html: string) {
    super();
    this._html = html;
  }

  toDOM(): DocumentFragment {
    const tpl = document.createElement('template');
    tpl.innerHTML = this._html;
    return tpl.content;
  }

  toString(): string {
    return this._html;
  }
}

export class Fragment extends Node {
  toDOM(): DocumentFragment {
    const frag = document.createDocumentFragment();
    for (const child of this._children) {
      frag.append(child instanceof Node ? child.toDOM() : child);
    }
    return frag;
  }

  toString(): string {
    let html = '';
    for (const child of this._children) {
      html += child instanceof Node ? child.toString() : escapeHtml(child);
    }
    return html;
  }
}

export class Div extends Element { constructor() { super('div'); } }
export class Span extends Element { constructor() { super('span'); } }
export class Anchor extends Element { constructor() { super('a'); } }
export class Button extends Element { constructor() { super('button'); } }
export class Input extends Element {
  constructor() { super('input'); }

  setValue(value: string): this {
    if (this.el) (this.el as HTMLInputElement).value = value;
    else this.setAttribute('value', value);
    return this;
  }

  getValue(): string {
    return this.el ? (this.el as HTMLInputElement).value : (this._attrs.get('value') ?? '');
  }

  setChecked(value: boolean): this {
    if (this.el) (this.el as HTMLInputElement).checked = value;
    else this.toggleAttribute('checked', value);
    return this;
  }

  isChecked(): boolean {
    return this.el ? (this.el as HTMLInputElement).checked : this._attrs.has('checked');
  }
}

export class Textarea extends Element {
  constructor() { super('textarea'); }

  setValue(value: string): this {
    if (this.el) (this.el as HTMLTextAreaElement).value = value;
    else this.setText(value);
    return this;
  }

  getValue(): string {
    return this.el ? (this.el as HTMLTextAreaElement).value : '';
  }
}

export class Select extends Element {
  constructor() { super('select'); }

  setValue(value: string): this {
    if (this.el) (this.el as HTMLSelectElement).value = value;
    else this.setAttribute('value', value);
    return this;
  }

  getValue(): string {
    return this.el ? (this.el as HTMLSelectElement).value : (this._attrs.get('value') ?? '');
  }
}
export class Label extends Element { constructor() { super('label'); } }
export class Form extends Element { constructor() { super('form'); } }
export class Img extends Element { constructor() { super('img'); } }
export class P extends Element { constructor() { super('p'); } }
export class H1 extends Element { constructor() { super('h1'); } }
export class H2 extends Element { constructor() { super('h2'); } }
export class H3 extends Element { constructor() { super('h3'); } }
export class H4 extends Element { constructor() { super('h4'); } }
export class H5 extends Element { constructor() { super('h5'); } }
export class H6 extends Element { constructor() { super('h6'); } }
export class Ul extends Element { constructor() { super('ul'); } }
export class Ol extends Element { constructor() { super('ol'); } }
export class Li extends Element { constructor() { super('li'); } }
export class Section extends Element { constructor() { super('section'); } }
export class Article extends Element { constructor() { super('article'); } }
export class Header extends Element { constructor() { super('header'); } }
export class Footer extends Element { constructor() { super('footer'); } }
export class Nav extends Element { constructor() { super('nav'); } }
export class Main extends Element { constructor() { super('main'); } }
export class Aside extends Element { constructor() { super('aside'); } }
export class Table extends Element { constructor() { super('table'); } }
export class Thead extends Element { constructor() { super('thead'); } }
export class Tbody extends Element { constructor() { super('tbody'); } }
export class Tr extends Element { constructor() { super('tr'); } }
export class Td extends Element { constructor() { super('td'); } }
export class Th extends Element { constructor() { super('th'); } }
export class Option extends Element { constructor() { super('option'); } }
export class Output extends Element { constructor() { super('output'); } }
export class Br extends Element { constructor() { super('br'); } }
export class Hr extends Element { constructor() { super('hr'); } }
export class Pre extends Element { constructor() { super('pre'); } }
export class Code extends Element { constructor() { super('code'); } }
export class Strong extends Element { constructor() { super('strong'); } }
export class Em extends Element { constructor() { super('em'); } }
export class Small extends Element { constructor() { super('small'); } }
