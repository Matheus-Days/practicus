import { Content } from '@prismicio/client';
import { SliceComponentProps } from '@prismicio/react';
import BoundedSection from '../../app/components/BoundedSection';
import HeadingBadge from '../../app/components/HeadingBadge';
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
      <HeadingBadge as="h2">{slice.primary.titulo_da_secao}</HeadingBadge>
      <PrismicNextImage
        field={slice.primary.imagem_das_conquistas}
        className="rounded-xl w-full max-w-[25rem]"
      />
    </BoundedSection>
  );
};

export default SecaoConquistas;
