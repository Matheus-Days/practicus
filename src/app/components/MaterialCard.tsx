'use client';

import { BaseHTMLAttributes, DetailedHTMLProps, ReactNode } from 'react';
import { MdOutlineClose } from 'react-icons/md';

type MaterialCardProps = DetailedHTMLProps<
  BaseHTMLAttributes<HTMLDivElement>,
  HTMLDivElement
> & {
  children: ReactNode;
  onClose: () => void;
};

export default function MaterialCard(props: MaterialCardProps): JSX.Element {
  props.children;
  return (
    <span {...props} className="block w-[20.5rem] md:w-[37.5rem] rounded-xl bg-white">
      {/* Card header */}
      <span className="flex justify-between p-2">
        <span></span>
        <button onClick={props.onClose}>
          <MdOutlineClose className="h-6 w-6" />
        </button>
      </span>
      {/* Card content */}
      <span className="block my-2 px-4 pt-3 pb-4">{props.children}</span>
    </span>
  );
}
