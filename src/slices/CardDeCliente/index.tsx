import { Content, ImageFieldImage } from '@prismicio/client';
import { PrismicNextImage } from '@prismicio/next';
import { SliceComponentProps } from '@prismicio/react';

/**
 * Props for `CardDeCliente`.
 */
export type CardDeClienteProps = SliceComponentProps<Content.CardDeClientSlice>;

/**
 * Component for "CardDeCliente" Slices.
 */
const CardDeCliente = ({ slice }: CardDeClienteProps): JSX.Element => {
  return (
    <div
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
      className="inline-flex flex-col items-center gap-1 md:gap-3 min-h-[8.75rem] w-[9.75rem] md:w-[16.3125rem]"
    >
      <div className="w-fit border border-accent shadow-md rounded-xl overflow-hidden">
        <PrismicNextImage
          field={slice.primary.logo_do_cliente['Tela estreita']}
          className="md:hidden"
        />
        <PrismicNextImage
          field={slice.primary.logo_do_cliente['Tela larga']}
          className="hidden md:block"
        />
      </div>

      <p className="font-body font-medium text-base md:text-lg text-center">
        {slice.primary.nome_do_cliente}
      </p>
    </div>
  );
};

export default CardDeCliente;
