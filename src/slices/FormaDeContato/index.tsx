import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";

/**
 * Props for `FormaDeContato`.
 */
export type FormaDeContatoProps =
  SliceComponentProps<Content.FormaDeContatoSlice>;

/**
 * Component for "FormaDeContato" Slices.
 */
const FormaDeContato = ({ slice }: FormaDeContatoProps): JSX.Element => {
  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
    >
      Placeholder component for forma_de_contato (variation: {slice.variation})
      Slices
    </section>
  );
};

export default FormaDeContato;
