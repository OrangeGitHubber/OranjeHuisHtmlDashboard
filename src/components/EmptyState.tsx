import type { ComponentChildren } from 'preact';

export function EmptyState({
  message,
  children,
}: {
  message: string;
  children?: ComponentChildren;
}) {
  return (
    <div class="empty-state">
      <p>{message}</p>
      {children}
    </div>
  );
}
