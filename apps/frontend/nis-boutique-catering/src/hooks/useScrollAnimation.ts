import { useLayoutEffect } from 'react';

const DEFAULT_THRESHOLD = 0.12;
const MAX_DURATION_MS = 1_200;
const MAX_DELAY_MS = 600;
const THRESHOLD_STEPS = Array.from({ length: 21 }, (_, index) => index / 20);

interface ScrollAnimationConfig {
  readonly delay: number;
  readonly duration: number | null;
  readonly once: boolean;
  readonly threshold: number;
}

interface ScrollAnimationOptions {
  readonly selector?: string;
}

const readBoundedNumber = (
  value: string | undefined,
  fallback: number,
  maximum: number,
): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(maximum, Math.max(0, parsed)) : fallback;
};

export const readScrollAnimationConfig = (element: HTMLElement): ScrollAnimationConfig => ({
  delay: readBoundedNumber(element.dataset.revealDelay, 0, MAX_DELAY_MS),
  duration: element.dataset.revealDuration === undefined
    ? null
    : readBoundedNumber(element.dataset.revealDuration, 0, MAX_DURATION_MS),
  once: element.dataset.revealOnce !== 'false',
  threshold: readBoundedNumber(element.dataset.revealThreshold, DEFAULT_THRESHOLD, 1),
});

export const shouldRevealEntry = (
  entry: Pick<IntersectionObserverEntry, 'boundingClientRect' | 'isIntersecting'>,
): boolean => entry.isIntersecting || entry.boundingClientRect.bottom <= 0;

export const getRevealObserverRootMargin = (
  documentHeight: number,
  viewportHeight: number,
): string => `${Math.ceil(Math.max(0, documentHeight) + Math.max(0, viewportHeight))}px 0px -8% 0px`;

export const markRevealVisible = (element: HTMLElement): void => {
  element.dataset.revealVisible = 'true';
  element.classList.add('is-visible');
};

export const markRevealHidden = (element: HTMLElement): void => {
  element.dataset.revealVisible = 'false';
  element.classList.remove('is-visible');
};

export const restoreRevealVisibility = (element: HTMLElement): void => {
  if (element.dataset.revealVisible === 'true' && !element.classList.contains('is-visible')) {
    element.classList.add('is-visible');
  }
};

export const applyScrollAnimationConfig = (element: HTMLElement): ScrollAnimationConfig => {
  const config = readScrollAnimationConfig(element);

  if (config.delay > 0 && !element.style.getPropertyValue('--delay')) {
    element.style.setProperty('--delay', `${config.delay}ms`);
  }
  if (config.duration !== null) {
    element.style.setProperty('--reveal-duration', `${config.duration}ms`);
  }

  return config;
};

export const applyStaggerDelays = (container: HTMLElement): void => {
  const stagger = readBoundedNumber(container.dataset.revealStagger, 0, 100);
  if (stagger === 0) return;

  container.querySelectorAll<HTMLElement>('.reveal').forEach((element, index) => {
    if (!element.style.getPropertyValue('--delay') && element.dataset.revealDelay === undefined) {
      element.style.setProperty('--delay', `${Math.min(index * stagger, MAX_DELAY_MS)}ms`);
    }
  });
};

export const useScrollAnimation = ({ selector = '.reveal' }: ScrollAnimationOptions = {}): void => {
  useLayoutEffect(() => {
    const root = document.documentElement;
    const revealElements = () => Array.from(document.querySelectorAll<HTMLElement>(selector));
    const staggerContainers = () => Array.from(document.querySelectorAll<HTMLElement>('[data-reveal-stagger]'));

    root.classList.add('scroll-motion-ready');

    if (!('IntersectionObserver' in window)) {
      revealElements().forEach(markRevealVisible);
      return () => root.classList.remove('scroll-motion-ready');
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const element = entry.target as HTMLElement;
          const config = readScrollAnimationConfig(element);
          const reachedThreshold = entry.isIntersecting && entry.intersectionRatio >= config.threshold;

          if (reachedThreshold || entry.boundingClientRect.bottom <= 0) {
            markRevealVisible(element);
            if (config.once) observer.unobserve(element);
          } else if (!config.once) {
            markRevealHidden(element);
          }
        });
      },
      {
        rootMargin: getRevealObserverRootMargin(
          document.documentElement.scrollHeight,
          window.innerHeight,
        ),
        threshold: THRESHOLD_STEPS,
      },
    );

    const observePendingElements = () => {
      staggerContainers().forEach(applyStaggerDelays);
      revealElements().forEach((element) => {
        applyScrollAnimationConfig(element);
        if (element.dataset.revealObserved === 'true') {
          restoreRevealVisibility(element);
          return;
        }

        element.dataset.revealObserved = 'true';
        observer.observe(element);
      });
    };

    observePendingElements();

    const mutationObserver = new MutationObserver(observePendingElements);
    mutationObserver.observe(document.body, {
      attributeFilter: ['class'],
      attributes: true,
      childList: true,
      subtree: true,
    });

    return () => {
      root.classList.remove('scroll-motion-ready');
      mutationObserver.disconnect();
      observer.disconnect();
    };
  }, [selector]);
};
