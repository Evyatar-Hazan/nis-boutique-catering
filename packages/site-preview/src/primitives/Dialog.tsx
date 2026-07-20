import { useEffect, useRef, type KeyboardEvent, type ReactNode } from 'react';

const focusableSelector = [
  'a[href]:not([tabindex="-1"])',
  'button:not([disabled]):not([tabindex="-1"])',
  'textarea:not([disabled]):not([tabindex="-1"])',
  'input:not([disabled]):not([tabindex="-1"])',
  'select:not([disabled]):not([tabindex="-1"])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

export interface DialogProps {
  readonly bodyClassName?: string;
  readonly children: ReactNode;
  readonly className?: string;
  readonly labelledBy: string;
  readonly onClose: () => void;
  readonly onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void;
  readonly open: boolean;
}

export const Dialog = ({ bodyClassName = 'is-dialog-open', children, className = 'dialog', labelledBy, onClose, onKeyDown, open }: DialogProps) => {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!open) return undefined;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = dialogRef.current;
    (dialog?.querySelector<HTMLElement>(focusableSelector) ?? dialog)?.focus();
    document.body.classList.add(bodyClassName);
    const handleWindowKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleWindowKeyDown);
    return () => {
      document.body.classList.remove(bodyClassName);
      window.removeEventListener('keydown', handleWindowKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [bodyClassName, onClose, open]);
  if (!open) return null;
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    if (event.key !== 'Tab' || !dialogRef.current) return;
    const focusables = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(focusableSelector));
    if (focusables.length === 0) { event.preventDefault(); dialogRef.current.focus(); return; }
    const first = focusables[0];
    const last = focusables.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  };
  return <div ref={dialogRef} className={className} role="dialog" aria-modal="true" aria-labelledby={labelledBy} tabIndex={-1} onKeyDown={handleKeyDown}>{children}</div>;
};
