import { Content } from '@prismicio/client';
import {
  JSXMapSerializer,
  PrismicRichText,
  SliceComponentProps
} from '@prismicio/react';
import { IconType } from 'react-icons';
import { FaInstagram, FaWhatsapp } from 'react-icons/fa';
import { MdOutlineEmail, MdOutlineLocationOn } from 'react-icons/md';
import { commonComponents } from '@/app/components/sharedRichTextComponents';

type Icon = Exclude<Content.FormaDeContatoSlice['primary']['icone'], null>;

const icons: Record<Icon, IconType> = {
  'E-mail': MdOutlineEmail,
  Endereço: MdOutlineLocationOn,
  Instagram: FaInstagram,
  WhatsApp: FaWhatsapp
};

const components: JSXMapSerializer = {
  ...commonComponents,
  paragraph: ({ children }) => (
    <p className="font-body text-base md:text-lg tracking-[0.0156rem]">
      {children}
    </p>
  )
};

/**
 * Props for `FormaDeContato`.
 */
export type FormaDeContatoProps =
  SliceComponentProps<Content.FormaDeContatoSlice>;

/**
 * Component for "FormaDeContato" Slices.
 */
const FormaDeContato = ({ slice }: FormaDeContatoProps): JSX.Element => {
  const Icon = icons[slice.primary.icone || 'Endereço'];

  return (
    <div
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
      className="flex gap-2 items-center text-surface md:text-primary"
    >
      <Icon className="m-2 md:m-[0.375rem] h-6 w-6 md:h-9 md:w-9" />
      <div>
        <PrismicRichText field={slice.primary.texto} components={components} />
      </div>
    </div>
  );
};

export default FormaDeContato;
