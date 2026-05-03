import type { View } from '@matthewp/zebra';

export const COMPONENT = Symbol.for('@matthewp/zebra-astro/component');

export type ZebraComponent<P> = ((props: P) => View) & { [COMPONENT]: true };

export function defineComponent<P extends Record<string, any> = {}>(
  ViewClass: new (props: P) => View,
): ZebraComponent<P> {
  const fn = ((props: P) => new ViewClass(props)) as ZebraComponent<P>;
  (fn as any)[COMPONENT] = true;
  return fn;
}
