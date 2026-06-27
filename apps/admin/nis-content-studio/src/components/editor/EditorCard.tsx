import type { ReactNode } from 'react';

type EditorCardProps = {
  readonly title: string;
  readonly kicker?: string;
  readonly archived?: boolean;
  readonly actions?: ReactNode;
  readonly children: ReactNode;
};

export const EditorCard = ({
  title,
  kicker,
  archived = false,
  actions,
  children,
}: EditorCardProps) => (
  <article className={archived ? 'edit-card is-archived' : 'edit-card'}>
    <div className="card-heading">
      <div>
        {kicker ? <p className="kicker">{kicker}</p> : null}
        <h3>{title}</h3>
      </div>
      {actions}
    </div>
    {children}
  </article>
);
