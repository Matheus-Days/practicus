import { ReactNode } from 'react';

export function FieldContainer({ children }: { children: ReactNode }): JSX.Element {
  return <div className="flex flex-col gap-2">{children}</div>;
}