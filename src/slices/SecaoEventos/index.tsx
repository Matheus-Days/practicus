import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";

/**
 * Props for `SecaoEventos`.
 */
export type SecaoEventosProps = SliceComponentProps<Content.SecaoEventosSlice>;

/**
 * Component for "SecaoEventos" Slices.
 */
const SecaoEventos = ({ slice }: SecaoEventosProps): JSX.Element => {
  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
    >
      Placeholder component for secao_eventos (variation: {slice.variation})
      Slices
    </section>
  );
};

export default SecaoEventos;
