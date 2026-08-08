// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import svelte from '@astrojs/svelte';

// Production configuration
export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    mode: 'directory'
  }),
  integrations: [svelte()]
});