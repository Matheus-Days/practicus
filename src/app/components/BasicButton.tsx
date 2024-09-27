import { ButtonHTMLAttributes, DetailedHTMLProps } from 'react';
import { twMerge } from 'tailwind-merge';

const BasicButton = (
  props: DetailedHTMLProps<
    ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  >
): JSX.Element => {
  return (
    <button
      {...props}
      className={twMerge(
        'font-body font-medium text-primary underline text-xs md:text-sm tracking-[0.025rem] inline-flex items-center',
        props.className
      )}
    >
      {props.children}
    </button>
  );
};

export default BasicButton;
