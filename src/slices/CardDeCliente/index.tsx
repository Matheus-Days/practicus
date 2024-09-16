import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";

/**
 * Props for `CardDeCliente`.
 */
export type CardDeClienteProps = SliceComponentProps<Content.CardDeClientSlice>;

/**
 * Component for "CardDeCliente" Slices.
 */
const CardDeCliente = ({ slice }: CardDeClienteProps): JSX.Element => {
  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
    >
      Placeholder component for card_de_cliente (variation: {slice.variation})
      Slices
    </section>
  );
};

export default CardDeCliente;
