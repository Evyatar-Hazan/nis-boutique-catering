import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

const createStorageMock = () => {
  const store = new Map<string, string>();

  return {
    clear: () => {
      store.clear();
    },
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
    get length() {
      return store.size;
    },
  } satisfies Storage;
};

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', {
    value: createStorageMock(),
    configurable: true,
  });

  Object.defineProperty(window, 'sessionStorage', {
    value: createStorageMock(),
    configurable: true,
  });

  Object.defineProperty(window, 'requestAnimationFrame', {
    value: (callback: FrameRequestCallback) => window.setTimeout(() => callback(performance.now()), 0),
    configurable: true,
  });

  Object.defineProperty(window, 'cancelAnimationFrame', {
    value: (id: number) => window.clearTimeout(id),
    configurable: true,
  });
}

if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

afterEach(() => {
  cleanup();
  document.body.className = '';
  window.localStorage.clear();
  window.sessionStorage.clear();
});
