import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { createReactVitestConfig } from '../../../config/react-vitest-config';

export default defineConfig({
  plugins: [react()],
  ...createReactVitestConfig('./src/test/setup.ts'),
});
