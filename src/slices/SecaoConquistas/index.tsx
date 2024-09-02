import { Content } from '@prismicio/client';
import { SliceComponentProps } from '@prismicio/react';
import BoundedSection from '../../app/components/BoundedSection';
import SectionHeading from '../../app/components/SectionHeading';
import { PrismicNextImage } from '@prismicio/next';

/**
 * Props for `SecaoConquistas`.
 */
export type SecaoConquistasProps =
  SliceComponentProps<Content.SecaoConquistasSlice>;

/**
 * Component for "SecaoConquistas" Slices.
 */
const SecaoConquistas = ({ slice }: SecaoConquistasProps): JSX.Element => {
  return (
    <BoundedSection
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
    >
      <SectionHeading>{slice.primary.titulo_da_secao}</SectionHeading>
      <PrismicNextImage
        field={slice.primary.imagem_das_conquistas}
        className="rounded-xl max-w-[70.5rem]"
      />
    </BoundedSection>
  );
};

export default SecaoConquistas;
