import { ReactNode } from 'react';
import clsx from 'clsx';

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <article className={clsx('card', className)}>{children}</article>;
}

export function CardHeader({ children }: { children: ReactNode }) {
  return <header className="mb-4 flex items-center justify-between gap-4">{children}</header>;
}

export function CardTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-lg font-semibold text-neutral-100">{children}</h2>;
}

export function CardBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx('text-neutral-200', className)}>{children}</div>;
}
