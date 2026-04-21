import type { View } from './view.ts';

export function renderToString(view: View, props?: Record<string, unknown>): string {
  return view.template(props).toString();
}
