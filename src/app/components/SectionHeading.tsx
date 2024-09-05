import { ReactNode } from 'react';

export default async function SectionHeading({
  children
}: {
  children: ReactNode;
}) {
  return (
    <h2 className="flex font-display text-lg md:text-2xl text-primary">
      <span className="rounded-lg border-primary border md:border-2 py-[6px] px-4 leading-5 md:leading-[2.625rem] font-medium">
        {children}
      </span>
    </h2>
  );
}
