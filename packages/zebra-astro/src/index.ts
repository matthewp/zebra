import type { AstroIntegration } from 'astro';

export { defineComponent, type ZebraComponent } from './component.ts';

export default function zebra(): AstroIntegration {
  return {
    name: '@matthewp/zebra',
    hooks: {
      'astro:config:setup': ({ addRenderer }) => {
        addRenderer({
          name: '@matthewp/zebra',
          clientEntrypoint: '@matthewp/zebra-astro/client.js',
          serverEntrypoint: '@matthewp/zebra-astro/server.js',
        });
      },
    },
  };
}
