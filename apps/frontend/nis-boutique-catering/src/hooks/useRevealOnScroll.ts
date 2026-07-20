import { useEffect } from 'react';

export const shouldRevealEntry = (
  entry: Pick<IntersectionObserverEntry, 'boundingClientRect' | 'isIntersecting'>,
): boolean => entry.isIntersecting || entry.boundingClientRect.bottom <= 0;

export const useRevealOnScroll = (): void => {
  useEffect(() => {
    const revealSelector = '.reveal';
    const revealElements = () => Array.from(document.querySelectorAll<HTMLElement>(revealSelector));

    if (!('IntersectionObserver' in window)) {
      revealElements().forEach((element) => element.classList.add('is-visible'));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (shouldRevealEntry(entry)) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.12 },
    );

    const observePendingRevealElements = () => {
      revealElements().forEach((element) => {
        if (element.dataset.revealObserved === 'true') {
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
      childList: true,
      subtree: true,
    });

    return () => {
      mutationObserver.disconnect();
      observer.disconnect();
    };
  }, []);
};
