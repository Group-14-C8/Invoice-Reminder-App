import type { ReactNode } from "react";

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: EmptyStateProps) {
  return (
    <div className="ui-empty-state">
      {icon && (
        <div className="ui-empty-state__icon" aria-hidden="true">
          {icon}
        </div>
      )}
      <h2 className="ui-empty-state__title">{title}</h2>
      {description && (
        <p className="ui-empty-state__description">{description}</p>
      )}
      {action && <div className="ui-empty-state__action">{action}</div>}
    </div>
  );
}
