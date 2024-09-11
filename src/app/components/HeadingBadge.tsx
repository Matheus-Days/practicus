import clsx from 'clsx';
import { ReactNode } from 'react';

export default async function HeadingBadge({
  children,
  className
}: React.HTMLProps<HTMLElement>) {
  return (
    <h2
      className={clsx(
        'flex font-display text-lg md:text-2xl text-primary',
        className
      )}
    >
      <span className="rounded-lg border-primary border md:border-2 py-[6px] px-4 leading-5 md:leading-[2.625rem] font-medium">
        {children}
      </span>
    </h2>
  );
}
