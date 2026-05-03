import { COMPONENT, type ZebraComponent } from './component.ts';

export default {
  name: '@matthewp/zebra',
  check(Component: unknown): boolean {
    return typeof Component === 'function'
      && (Component as unknown as Record<symbol, unknown>)[COMPONENT] === true;
  },
  renderToStaticMarkup(
    Component: ZebraComponent<any>,
    props: Record<string, unknown>,
  ): { html: string } {
    return { html: Component(props as any).toString() };
  },
  supportsAstroStaticSlot: true,
};
