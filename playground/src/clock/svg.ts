import { Element, Node } from '@matthewp/zebra';

const NS = 'http://www.w3.org/2000/svg';

export class SvgElement extends Element {
  toDOM(): HTMLElement {
    if (this.el) return this.el;

    const el = document.createElementNS(NS, this._tag);
    this.el = el as unknown as HTMLElement;

    if (this._attrs) {
      for (const [name, value] of this._attrs) {
        el.setAttribute(name, value);
      }
    }
    if (this._classes && this._classes.size > 0) {
      el.setAttribute('class', Array.from(this._classes).join(' '));
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

    return this.el;
  }
}

export class Svg extends SvgElement { constructor() { super('svg'); } }
export class G extends SvgElement { constructor() { super('g'); } }
export class Circle extends SvgElement { constructor() { super('circle'); } }
export class SvgLine extends SvgElement { constructor() { super('line'); } }
