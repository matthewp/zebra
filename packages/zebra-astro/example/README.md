# Zebra + Astro example

A minimal Astro site that renders a Zebra `Counter` view via the `@matthewp/zebra-astro` integration. Demonstrates SSR + hydration (`client:load`) and client-only mounting (`client:only`).

## Run

From the repo root:

```bash
npm install
npm run dev --workspace=@matthewp/zebra-astro-example
```

Then open the URL Astro prints.

## Structure

- `astro.config.mjs` — registers the integration.
- `src/views/counter.ts` — a Zebra `View` wrapped with `defineComponent`.
- `src/pages/index.astro` — uses the component twice, once hydrated and once client-only.
