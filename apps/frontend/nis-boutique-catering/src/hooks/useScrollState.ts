import { useEffect, useState } from 'react';

interface ScrollState {
  readonly isScrolled: boolean;
  readonly scrollProgress: number;
  readonly activeNavSection: string;
}

export const getActiveNavSection = (sectionIds: readonly string[], scrollY: number): string => {
  const currentSection = sectionIds
    .map((id) => document.getElementById(id))
    .filter((section): section is HTMLElement => section instanceof HTMLElement)
    .reverse()
    .find((section) => scrollY >= section.offsetTop - 180);

  return currentSection ? `#${currentSection.id}` : '#top';
};

export const useScrollState = (sectionIds: readonly string[]): ScrollState => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeNavSection, setActiveNavSection] = useState('#top');

  useEffect(() => {
    let rafId = 0;

    const updateScrollState = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;

      setIsScrolled(window.scrollY > 24);
      setScrollProgress(Math.min(1, Math.max(0, progress)));
      setActiveNavSection(getActiveNavSection(sectionIds, window.scrollY));
      rafId = 0;
    };

    const handleScroll = () => {
      if (rafId !== 0) {
        return;
      }

      rafId = window.requestAnimationFrame(updateScrollState);
    };

    updateScrollState();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);

      if (rafId !== 0) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [sectionIds]);

  return { isScrolled, scrollProgress, activeNavSection };
};
