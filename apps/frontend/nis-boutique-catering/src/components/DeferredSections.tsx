import { type ReactNode, useEffect, useRef, useState } from 'react';

type DeferredSectionsProps = {
  readonly children: ReactNode;
  readonly rootMargin?: string;
};

export function DeferredSections({
  children,
  rootMargin = '320px 0px',
}: DeferredSectionsProps) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [shouldRender, setShouldRender] = useState(() => import.meta.env.MODE === 'test');

  useEffect(() => {
    if (shouldRender || typeof window === 'undefined') {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldRender(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );

    const sentinel = sentinelRef.current;
    if (sentinel) {
      observer.observe(sentinel);
    }

    const enableDuringIdle = () => setShouldRender(true);

    let idleId: number | null = null;
    let timeoutId: number | null = null;
    const hasIdleCallback =
      typeof window.requestIdleCallback === 'function' &&
      typeof window.cancelIdleCallback === 'function';

    if (hasIdleCallback) {
      idleId = window.requestIdleCallback(enableDuringIdle, { timeout: 2500 });
    } else {
      timeoutId = globalThis.setTimeout(enableDuringIdle, 1800);
    }

    return () => {
      observer.disconnect();

      if (idleId !== null && hasIdleCallback) {
        window.cancelIdleCallback(idleId);
      }

      if (timeoutId !== null) {
        globalThis.clearTimeout(timeoutId);
      }
    };
  }, [rootMargin, shouldRender]);

  return (
    <>
      <div ref={sentinelRef} aria-hidden="true" />
      {shouldRender ? children : null}
    </>
  );
}
