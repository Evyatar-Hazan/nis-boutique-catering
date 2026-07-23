import { fileURLToPath } from 'node:url';
import { businessContact } from '@monorepo/content-schema/contact';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { generatedHeroPreload } from './src/generated/publicSiteDocument.generated';

const heroPreloadPlugin = () => ({
  name: 'nis-hero-preload',
  transformIndexHtml(html: string, context: { path: string }) {
    if (context.path.startsWith('/accessibility/')) {
      return [];
    }
    return {
      html: html.replace('__NIS_BUSINESS_PHONE_E164__', businessContact.phoneE164),
      tags: [{
        tag: 'link',
        attrs: {
          rel: 'preload',
          as: 'image',
          type: generatedHeroPreload.type,
          href: generatedHeroPreload.href,
          ...(generatedHeroPreload.imageSrcSet ? { imagesrcset: generatedHeroPreload.imageSrcSet } : {}),
          ...(generatedHeroPreload.imageSizes ? { imagesizes: generatedHeroPreload.imageSizes } : {}),
          fetchpriority: 'high',
        },
        injectTo: 'head' as const,
      }],
    };
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
