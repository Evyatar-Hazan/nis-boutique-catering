import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import type { ContentSnapshot } from '@monorepo/content-schema';
import { createHeroPreload } from './src/utils/heroPreload';

const contentPath = fileURLToPath(new URL('./src/generated/siteContent.generated.json', import.meta.url));

const heroPreloadPlugin = () => ({
  name: 'nis-hero-preload',
  transformIndexHtml(_html: string, context: { path: string }) {
    if (context.path.startsWith('/accessibility/')) {
      return [];
    }
    const content = JSON.parse(readFileSync(contentPath, 'utf8')) as ContentSnapshot;
    const preload = createHeroPreload(content);

    return [{
      tag: 'link',
      attrs: {
        rel: 'preload',
        as: 'image',
        type: preload.type,
        href: preload.href,
        ...(preload.imageSrcSet ? { imagesrcset: preload.imageSrcSet } : {}),
        ...(preload.imageSizes ? { imagesizes: preload.imageSizes } : {}),
        fetchpriority: 'high',
      },
      injectTo: 'head' as const,
    }];
  },
});

export default defineConfig({
  plugins: [react(), heroPreloadPlugin()],
  build: {
    rollupOptions: {
      input: {
        accessibility: fileURLToPath(new URL('./accessibility/index.html', import.meta.url)),
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
      },
    },
  },
});
