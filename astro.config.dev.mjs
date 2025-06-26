// @ts-check
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';

// Development configuration
export default defineConfig({
  output: 'static',
  integrations: [svelte()]
});