import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";

/**
 * Props for `SecaoDepoimentos`.
 */
export type SecaoDepoimentosProps =
  SliceComponentProps<Content.SecaoDepoimentosSlice>;

/**
 * Component for "SecaoDepoimentos" Slices.
 */
const SecaoDepoimentos = ({ slice }: SecaoDepoimentosProps): JSX.Element => {
  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
    >
      Placeholder component for secao_depoimentos (variation: {slice.variation})
      Slices
    </section>
  );
};

export default SecaoDepoimentos;
