import { useEffect } from 'react';

export const shouldRevealEntry = (
  entry: Pick<IntersectionObserverEntry, 'boundingClientRect' | 'isIntersecting'>,
): boolean => entry.isIntersecting || entry.boundingClientRect.bottom <= 0;

export const markRevealVisible = (element: HTMLElement): void => {
  element.dataset.revealVisible = 'true';
  element.classList.add('is-visible');
};

export const restoreRevealVisibility = (element: HTMLElement): void => {
  if (element.dataset.revealVisible === 'true' && !element.classList.contains('is-visible')) {
    element.classList.add('is-visible');
  }
};

export const useRevealOnScroll = (): void => {
  useEffect(() => {
    const revealSelector = '.reveal';
    const revealElements = () => Array.from(document.querySelectorAll<HTMLElement>(revealSelector));

    if (!('IntersectionObserver' in window)) {
      revealElements().forEach(markRevealVisible);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (shouldRevealEntry(entry)) {
            markRevealVisible(entry.target as HTMLElement);
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.12 },
    );

    const observePendingRevealElements = () => {
      revealElements().forEach((element) => {
        if (element.dataset.revealObserved === 'true') {
          restoreRevealVisibility(element);
          return;
        }

        element.dataset.revealObserved = 'true';
        observer.observe(element);
      });
    };

    observePendingRevealElements();

    const mutationObserver = new MutationObserver(() => {
      observePendingRevealElements();
    });

    mutationObserver.observe(document.body, {
      attributeFilter: ['class'],
      attributes: true,
      childList: true,
      subtree: true,
    });

    return () => {
      mutationObserver.disconnect();
      observer.disconnect();
    };
  }, []);
};
