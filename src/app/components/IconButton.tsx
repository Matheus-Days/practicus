import { ButtonHTMLAttributes, DetailedHTMLProps } from 'react';
import { twMerge } from 'tailwind-merge';

type FiltersButtonProps = DetailedHTMLProps<
  ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
> & {
  selected: boolean;
};

export default function FiltersButton(props: FiltersButtonProps): JSX.Element {
  return (
    <button
      {...props}
      className={twMerge(
        'inline-flex items-center justify-center size-12 border border-accent bg-primary rounded-xl text-[1.5rem] leading-[0] text-surface',
        props.selected
          ? 'bg-primary text-surface'
          : 'bg-transparent text-primary',
        props.className
      )}
    >
      {props.children}
    </button>
  );
}
