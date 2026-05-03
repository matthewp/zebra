import { defineConfig } from 'astro/config';
import zebra from '@matthewp/zebra-astro';

export default defineConfig({
  integrations: [zebra()],
});
