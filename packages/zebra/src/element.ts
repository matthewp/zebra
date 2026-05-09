import { effect } from 'alien-signals';

export type Reactive<T> = T | (() => T);

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

function splitClasses(classes: string[]): string[] {
  const tokens: string[] = [];
  for (const c of classes) {
    if (!c) continue;
    for (const t of c.split(/\s+/)) {
      if (t) tokens.push(t);
    }
  }
  return tokens;
}

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

  setText(text: Reactive<string | number>): this {
    if (typeof text === 'function') {
      effect(() => this.setText(text()));
      return this;
    }
    this._children = [typeof text === 'string' ? text : String(text)];
    return this;
  }

  setAttribute(name: string, value: Reactive<string>): this {
    if (typeof value === 'function') {
      effect(() => this.setAttribute(name, value()));
      return this;
    }
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

  toggleAttribute(name: string, force?: Reactive<boolean>): this {
    if (typeof force === 'function') {
      effect(() => this.toggleAttribute(name, force()));
      return this;
    }
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

  toggleClass(name: string, force?: Reactive<boolean>): this {
    if (typeof force === 'function') {
      effect(() => this.toggleClass(name, force()));
      return this;
    }
    for (const child of this._children) {
      if (child instanceof Node) child.toggleClass(name, force);
    }
    return this;
  }

  setStyle(prop: string, value: Reactive<string>): this {
    if (typeof value === 'function') {
      effect(() => this.setStyle(prop, value()));
      return this;
    }
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

  toggleVisible(visible: Reactive<boolean>): this {
    if (typeof visible === 'function') {
      effect(() => this.toggleVisible(visible()));
      return this;
    }
    return visible ? this.show() : this.hide();
  }

  setDisabled(disabled: Reactive<boolean>): this {
    return this.toggleAttribute('disabled', disabled);
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
  protected _attrs: Map<string, string> | null = null;
  protected _classes: Set<string> | null = null;
  protected _style: Map<string, string> | null = null;
  protected _listeners: Array<[string, EventListener]> | null = null;
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

  setText(text: Reactive<string | number>): this {
    if (typeof text === 'function') {
      effect(() => this.setText(text()));
      return this;
    }
    const s = typeof text === 'string' ? text : String(text);
    this._children = [s];
    if (this.el) this.el.textContent = s;
    return this;
  }

  setAttribute(name: string, value: Reactive<string>): this {
    if (typeof value === 'function') {
      effect(() => this.setAttribute(name, value()));
      return this;
    }
    (this._attrs ??= new Map()).set(name, value);
    if (this.el) this.el.setAttribute(name, value);
    return this;
  }

  removeAttribute(name: string): this {
    this._attrs?.delete(name);
    if (this.el) this.el.removeAttribute(name);
    return this;
  }

  toggleAttribute(name: string, force?: Reactive<boolean>): this {
    if (typeof force === 'function') {
      effect(() => this.toggleAttribute(name, force()));
      return this;
    }
    const has = this._attrs !== null && this._attrs.has(name);
    const shouldHave = force === undefined ? !has : force;
    if (shouldHave) (this._attrs ??= new Map()).set(name, '');
    else this._attrs?.delete(name);
    if (this.el) this.el.toggleAttribute(name, force);
    return this;
  }

  addClass(...classes: string[]): this {
    if (classes.length === 0) return this;
    if (classes.length === 1) {
      const c = classes[0];
      if (c && c.indexOf(' ') === -1 && c.indexOf('\t') === -1 && c.indexOf('\n') === -1) {
        (this._classes ??= new Set()).add(c);
        if (this.el) this.el.classList.add(c);
        return this;
      }
    }
    const tokens = splitClasses(classes);
    if (tokens.length === 0) return this;
    const set = (this._classes ??= new Set());
    for (const c of tokens) set.add(c);
    if (this.el) this.el.classList.add(...tokens);
    return this;
  }

  removeClass(...classes: string[]): this {
    if (classes.length === 0) return this;
    if (classes.length === 1) {
      const c = classes[0];
      if (c && c.indexOf(' ') === -1 && c.indexOf('\t') === -1 && c.indexOf('\n') === -1) {
        this._classes?.delete(c);
        if (this.el) this.el.classList.remove(c);
        return this;
      }
    }
    const tokens = splitClasses(classes);
    if (tokens.length === 0) return this;
    if (this._classes) {
      for (const c of tokens) this._classes.delete(c);
    }
    if (this.el) this.el.classList.remove(...tokens);
    return this;
  }

  toggleClass(name: string, force?: Reactive<boolean>): this {
    if (typeof force === 'function') {
      effect(() => this.toggleClass(name, force()));
      return this;
    }
    const set = this._classes;
    const has = set !== null && set.has(name);
    if (force !== undefined && force === has) return this;
    const shouldHave = force === undefined ? !has : force;
    if (shouldHave) (this._classes ??= new Set()).add(name);
    else if (set) set.delete(name);
    if (this.el) this.el.classList.toggle(name, shouldHave);
    return this;
  }

  setStyle(prop: string, value: Reactive<string>): this {
    if (typeof value === 'function') {
      effect(() => this.setStyle(prop, value()));
      return this;
    }
    (this._style ??= new Map()).set(prop, value);
    if (this.el) this.el.style.setProperty(prop, value);
    return this;
  }

  removeStyle(prop: string): this {
    this._style?.delete(prop);
    if (this.el) this.el.style.removeProperty(prop);
    return this;
  }

  show(): this {
    this._style?.delete('display');
    if (this.el) this.el.style.removeProperty('display');
    return this;
  }

  hide(): this {
    (this._style ??= new Map()).set('display', 'none');
    if (this.el) this.el.style.display = 'none';
    return this;
  }

  on(event: string, handler: EventListener): this {
    (this._listeners ??= []).push([event, handler]);
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

  setFocused(value: Reactive<boolean>): this {
    if (typeof value === 'function') {
      effect(() => this.setFocused(value()));
      return this;
    }
    if (this.el) value ? this.el.focus() : this.el.blur();
    return this;
  }

  measure<T>(fn: (el: HTMLElement) => T): T | undefined {
    return this.el ? fn(this.el) : undefined;
  }

  setHTML(html: Reactive<string>): this {
    if (typeof html === 'function') {
      effect(() => this.setHTML(html()));
      return this;
    }
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

  hydrate(el: HTMLElement): this {
    if (this.el) return this;
    this.el = el;

    if (this._listeners) {
      for (const [event, handler] of this._listeners) {
        el.addEventListener(event, handler);
      }
    }

    let cursor: ChildNode | null = el.firstChild;
    for (const child of this._children) {
      if (typeof child === 'string') {
        if (!cursor || cursor.nodeType !== 3) {
          throw new Error(`Hydration mismatch in <${this._tag}>: expected text node`);
        }
        cursor = cursor.nextSibling;
      } else if (child instanceof Element) {
        if (!cursor || cursor.nodeType !== 1) {
          throw new Error(`Hydration mismatch in <${this._tag}>: expected element <${(child as Element)._tag}>`);
        }
        child.hydrate(cursor as HTMLElement);
        cursor = cursor.nextSibling;
      } else {
        throw new Error(`Hydration not supported for ${child.constructor.name} children yet`);
      }
    }
    return this;
  }

  protected _createEl(): HTMLElement {
    return document.createElement(this._tag);
  }

  protected _setClassName(el: HTMLElement, value: string): void {
    el.className = value;
  }

  toDOM(): HTMLElement {
    if (this.el) return this.el;

    const el = this._createEl();
    this.el = el;

    if (this._attrs) {
      for (const [name, value] of this._attrs) {
        el.setAttribute(name, value);
      }
    }

    if (this._classes && this._classes.size > 0) {
      this._setClassName(el, Array.from(this._classes).join(' '));
    }

    if (this._style) {
      for (const [prop, value] of this._style) {
        el.style.setProperty(prop, value);
      }
    }

    for (const child of this._children) {
      el.append(child instanceof Node ? child.toDOM() : child);
    }

    if (this._listeners) {
      for (const [event, handler] of this._listeners) {
        el.addEventListener(event, handler);
      }
    }

    return el;
  }

  toString(): string {
    let html = `<${this._tag}`;

    if (this._classes && this._classes.size > 0) {
      html += ` class="${escapeAttr(Array.from(this._classes).join(' '))}"`;
    }

    if (this._style && this._style.size > 0) {
      const styleStr = Array.from(this._style.entries())
        .map(([k, v]) => `${k}: ${v}`)
        .join('; ');
      html += ` style="${escapeAttr(styleStr)}"`;
    }

    if (this._attrs) {
      for (const [name, value] of this._attrs) {
        html += ` ${name}="${escapeAttr(value)}"`;
      }
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

  setValue(value: Reactive<string | number>): this {
    if (typeof value === 'function') {
      effect(() => this.setValue(value()));
      return this;
    }
    const s = typeof value === 'string' ? value : String(value);
    if (this.el) (this.el as HTMLInputElement).value = s;
    else this.setAttribute('value', s);
    return this;
  }

  getValue(): string {
    return this.el ? (this.el as HTMLInputElement).value : (this._attrs?.get('value') ?? '');
  }

  setChecked(value: Reactive<boolean>): this {
    if (typeof value === 'function') {
      effect(() => this.setChecked(value()));
      return this;
    }
    if (this.el) (this.el as HTMLInputElement).checked = value;
    else this.toggleAttribute('checked', value);
    return this;
  }

  isChecked(): boolean {
    return this.el ? (this.el as HTMLInputElement).checked : (this._attrs?.has('checked') ?? false);
  }
}

export class Textarea extends Element {
  constructor() { super('textarea'); }

  setValue(value: Reactive<string | number>): this {
    if (typeof value === 'function') {
      effect(() => this.setValue(value()));
      return this;
    }
    const s = typeof value === 'string' ? value : String(value);
    if (this.el) (this.el as HTMLTextAreaElement).value = s;
    else this.setText(s);
    return this;
  }

  getValue(): string {
    return this.el ? (this.el as HTMLTextAreaElement).value : '';
  }
}

export class Select extends Element {
  constructor() { super('select'); }

  setValue(value: Reactive<string | number>): this {
    if (typeof value === 'function') {
      effect(() => this.setValue(value()));
      return this;
    }
    const s = typeof value === 'string' ? value : String(value);
    if (this.el) (this.el as HTMLSelectElement).value = s;
    else this.setAttribute('value', s);
    return this;
  }

  getValue(): string {
    return this.el ? (this.el as HTMLSelectElement).value : (this._attrs?.get('value') ?? '');
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
