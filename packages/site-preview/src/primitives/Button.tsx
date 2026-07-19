import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'regular' | 'compact';

interface SharedButtonProps {
  readonly children: ReactNode;
  readonly className?: string;
  readonly fullWidth?: boolean;
  readonly size?: ButtonSize;
  readonly variant?: ButtonVariant;
}

type LinkButtonProps = SharedButtonProps & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'children' | 'className' | 'href'> & {
  readonly href: string;
};

type NativeButtonProps = SharedButtonProps & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className'> & {
  readonly href?: never;
};

export type ButtonProps = LinkButtonProps | NativeButtonProps;

export const Button = ({ children, className, fullWidth = false, size = 'regular', variant = 'primary', ...props }: ButtonProps) => {
  const classes = ['button', variant, `button--${size}`, fullWidth ? 'full-field' : '', className].filter(Boolean).join(' ');
  if ('href' in props && typeof props.href === 'string') {
    return <a {...props} className={classes}>{children}</a>;
  }
  return <button {...props} className={classes}>{children}</button>;
};
