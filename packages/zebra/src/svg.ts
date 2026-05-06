import { Element } from './element.ts';

const SVG_NS = 'http://www.w3.org/2000/svg';

export class SvgElement extends Element {
  protected _createEl(): HTMLElement {
    return document.createElementNS(SVG_NS, this._tag) as unknown as HTMLElement;
  }

  protected _setClassName(el: HTMLElement, value: string): void {
    el.setAttribute('class', value);
  }
}

export class Svg extends SvgElement { constructor() { super('svg'); } }
export class G extends SvgElement { constructor() { super('g'); } }
export class Defs extends SvgElement { constructor() { super('defs'); } }
export class Use extends SvgElement { constructor() { super('use'); } }
export class SvgSymbol extends SvgElement { constructor() { super('symbol'); } }
export class Mask extends SvgElement { constructor() { super('mask'); } }
export class ClipPath extends SvgElement { constructor() { super('clipPath'); } }
export class Marker extends SvgElement { constructor() { super('marker'); } }
export class Pattern extends SvgElement { constructor() { super('pattern'); } }
export class ForeignObject extends SvgElement { constructor() { super('foreignObject'); } }
export class Switch extends SvgElement { constructor() { super('switch'); } }
export class SvgView extends SvgElement { constructor() { super('view'); } }

export class Path extends SvgElement { constructor() { super('path'); } }
export class Circle extends SvgElement { constructor() { super('circle'); } }
export class Ellipse extends SvgElement { constructor() { super('ellipse'); } }
export class Line extends SvgElement { constructor() { super('line'); } }
export class Rect extends SvgElement { constructor() { super('rect'); } }
export class Polygon extends SvgElement { constructor() { super('polygon'); } }
export class Polyline extends SvgElement { constructor() { super('polyline'); } }

export class Text extends SvgElement { constructor() { super('text'); } }
export class Tspan extends SvgElement { constructor() { super('tspan'); } }
export class TextPath extends SvgElement { constructor() { super('textPath'); } }

export class LinearGradient extends SvgElement { constructor() { super('linearGradient'); } }
export class RadialGradient extends SvgElement { constructor() { super('radialGradient'); } }
export class Stop extends SvgElement { constructor() { super('stop'); } }

export class Image extends SvgElement { constructor() { super('image'); } }
export class Filter extends SvgElement { constructor() { super('filter'); } }
export class Style extends SvgElement { constructor() { super('style'); } }

export class Title extends SvgElement { constructor() { super('title'); } }
export class Desc extends SvgElement { constructor() { super('desc'); } }
export class Metadata extends SvgElement { constructor() { super('metadata'); } }

export class Animate extends SvgElement { constructor() { super('animate'); } }
export class AnimateMotion extends SvgElement { constructor() { super('animateMotion'); } }
export class AnimateTransform extends SvgElement { constructor() { super('animateTransform'); } }
export class Mpath extends SvgElement { constructor() { super('mpath'); } }

export class FeBlend extends SvgElement { constructor() { super('feBlend'); } }
export class FeColorMatrix extends SvgElement { constructor() { super('feColorMatrix'); } }
export class FeComponentTransfer extends SvgElement { constructor() { super('feComponentTransfer'); } }
export class FeComposite extends SvgElement { constructor() { super('feComposite'); } }
export class FeConvolveMatrix extends SvgElement { constructor() { super('feConvolveMatrix'); } }
export class FeDiffuseLighting extends SvgElement { constructor() { super('feDiffuseLighting'); } }
export class FeDisplacementMap extends SvgElement { constructor() { super('feDisplacementMap'); } }
export class FeDistantLight extends SvgElement { constructor() { super('feDistantLight'); } }
export class FeDropShadow extends SvgElement { constructor() { super('feDropShadow'); } }
export class FeFlood extends SvgElement { constructor() { super('feFlood'); } }
export class FeFuncA extends SvgElement { constructor() { super('feFuncA'); } }
export class FeFuncB extends SvgElement { constructor() { super('feFuncB'); } }
export class FeFuncG extends SvgElement { constructor() { super('feFuncG'); } }
export class FeFuncR extends SvgElement { constructor() { super('feFuncR'); } }
export class FeGaussianBlur extends SvgElement { constructor() { super('feGaussianBlur'); } }
export class FeImage extends SvgElement { constructor() { super('feImage'); } }
export class FeMerge extends SvgElement { constructor() { super('feMerge'); } }
export class FeMergeNode extends SvgElement { constructor() { super('feMergeNode'); } }
export class FeMorphology extends SvgElement { constructor() { super('feMorphology'); } }
export class FeOffset extends SvgElement { constructor() { super('feOffset'); } }
export class FePointLight extends SvgElement { constructor() { super('fePointLight'); } }
export class FeSpecularLighting extends SvgElement { constructor() { super('feSpecularLighting'); } }
export class FeSpotLight extends SvgElement { constructor() { super('feSpotLight'); } }
export class FeTile extends SvgElement { constructor() { super('feTile'); } }
export class FeTurbulence extends SvgElement { constructor() { super('feTurbulence'); } }
