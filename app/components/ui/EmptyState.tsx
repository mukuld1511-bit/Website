"use client";

import Link from "next/link";
import Button from "./Button";

interface EmptyStateProps {
  icon?:        React.ReactNode;
  emoji?:       string;
  title:        string;
  description?: string;
  actionLabel?: string;
  actionHref?:  string;
  onAction?:    () => void;
}

export default function EmptyState({ icon, emoji, title, description, actionLabel, actionHref, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {emoji ? (
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4 text-3xl">
          {emoji}
        </div>
      ) : icon ? (
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4 text-gray-300">
          {icon}
        </div>
      ) : null}

      <p className="font-bold text-gray-900 mb-1">{title}</p>
      {description && <p className="text-gray-400 text-sm mb-5 max-w-xs">{description}</p>}

      {actionLabel && actionHref && (
        <Link href={actionHref}>
          <Button variant="primary" size="md">{actionLabel}</Button>
        </Link>
      )}
      {actionLabel && onAction && !actionHref && (
        <Button variant="primary" size="md" onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  );
}
