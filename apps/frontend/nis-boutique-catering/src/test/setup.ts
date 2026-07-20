import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { afterEach } from 'vitest';

configure({ asyncUtilTimeout: 5_000 });

class IntersectionObserverMock implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = '0px';
  readonly thresholds = [0];

  disconnect(): void {}

  observe(target: Element): void {
    target.classList.add('is-visible');
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  unobserve(): void {}
}

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'IntersectionObserver', {
    value: IntersectionObserverMock,
    configurable: true,
    writable: true,
  });

  Object.defineProperty(globalThis, 'IntersectionObserver', {
    value: IntersectionObserverMock,
    configurable: true,
    writable: true,
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

if (typeof HTMLMediaElement !== 'undefined') {
  Object.defineProperty(HTMLMediaElement.prototype, 'play', {
    configurable: true,
    value: async () => undefined,
  });

  Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
    configurable: true,
    value: () => undefined,
  });
}

if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

afterEach(() => {
  cleanup();
  document.body.className = '';
});
