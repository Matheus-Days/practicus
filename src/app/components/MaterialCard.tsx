import { BaseHTMLAttributes, DetailedHTMLProps, ReactNode } from 'react';
import { MdOutlineClose } from 'react-icons/md';

type MaterialCardProps = DetailedHTMLProps<
  BaseHTMLAttributes<HTMLDivElement>,
  HTMLDivElement
> & {
  header?: ReactNode;
  contents: ReactNode;
  onClose: () => void;
};

export default function MaterialCard(props: MaterialCardProps): JSX.Element {
  props.children
  return (
    <div {...props} className="w-[20.5rem] md:w-[37.5rem] rounded-xl bg-white">
      {/* Card header */}
      <div className="flex justify-between p-2">
        <span>{props.header}</span>
        <button onClick={props.onClose}>
          <MdOutlineClose className="h-6 w-6" />
        </button>
      </div>
      {/* Card content */}
      <div className="my-2 px-4 pt-3 pb-4">{props.contents}</div>
    </div>
  );
}
