# Zebra in Astro

Use `@matthewp/zebra-astro` to render Zebra Views as Astro components. SSR uses `View.toString()`, client-side hydration uses `View.hydrate()`, and `client:only` falls back to `View.mount()`.

## Install

```bash
npm i @matthewp/zebra @matthewp/zebra-astro
```

## Configure

Add the integration to `astro.config.{ts,mjs}`:

```ts
import { defineConfig } from 'astro/config';
import zebra from '@matthewp/zebra-astro';

export default defineConfig({
  integrations: [zebra()],
});
```

## Authoring a component

A Zebra component is a `View` subclass whose constructor takes a single options object (the props), wrapped with `defineComponent` and default-exported:

```ts
// src/views/greeting.ts
import { View, Div } from '@matthewp/zebra';
import { defineComponent } from '@matthewp/zebra-astro';

class Greeting extends View {
  props: { name: string };

  constructor(props: { name: string }) {
    super();
    this.props = props;
  }

  render() {
    return new Div().setText(`Hello, ${this.props.name}`);
  }
}

export default defineComponent(Greeting);
```

`defineComponent` wraps the class in a JSX-shaped function so `.astro` files can type-check the props. **Props are inferred from the View's constructor** — never pass an explicit type argument to `defineComponent`.

## Using in `.astro`

Import and use it like any other framework component. Astro's `client:*` directives all work:

```astro
---
import Greeting from '../views/greeting.ts';
---
<Greeting name="world" client:load />
```

## Constraints

- **Props must be JSON-serializable.** Astro serializes props into the page so the client can rebuild the component. Don't pass functions, signals, or class instances as props to a top-level island.
- **Slots / children are ignored.** Anything between `<Greeting>...</Greeting>` is dropped. There's no Zebra convention for slot content yet.
- **Fragment-rooted Views can't hydrate yet.** If a View's `render()` returns a `Fragment` (multiple top-level children), the client throws on hydrate. Workaround: use `client:only="@matthewp/zebra"` so the component mounts fresh instead of hydrating.

## Why `defineComponent`

The runtime renderer's `check()` only matches branded functions — raw `View` classes are ignored. This keeps the renderer's match rule precise and gives `.astro` files a function-shaped value to type-check against.
