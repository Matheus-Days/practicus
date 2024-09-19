import { ButtonHTMLAttributes, DetailedHTMLProps } from 'react';
import { MdContentCopy } from 'react-icons/md';

export function CopyButton(
  props: DetailedHTMLProps<
    ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  >
) {
  return (
    <button
      {...props}
      className="font-body font-medium text-primary underline text-xs md:text-sm tracking-[0.025rem] inline-flex items-center"
    >
      <MdContentCopy className="h-6 w-6 m-3 [transform:rotateX(180deg)]" />
      Copiar conteúdo
    </button>
  );
}
