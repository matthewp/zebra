import type { ZebraComponent } from './component.ts';

export default (element: HTMLElement) =>
  async (
    Component: ZebraComponent<any>,
    props: Record<string, unknown>,
    _slotted: Record<string, unknown>,
    { client }: { client: string },
  ): Promise<void> => {
    const view = Component(props as any);

    if (client === 'only') {
      element.replaceChildren();
      view.mount(element);
      return;
    }

    const children = element.children;
    if (children.length === 0) {
      throw new Error('@matthewp/zebra-astro: nothing to hydrate');
    }
    if (children.length > 1) {
      throw new Error(
        '@matthewp/zebra-astro: hydrating a View whose render() returns a Fragment is not yet supported. Use client:only for now.',
      );
    }
    view.hydrate(children[0] as HTMLElement);
  };
