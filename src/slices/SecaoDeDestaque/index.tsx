import { Content } from '@prismicio/client';
import { PrismicNextImage } from '@prismicio/next';
import { SliceComponentProps } from '@prismicio/react';
import BoundedImage from '../../app/components/BoundedImage';

/**
 * Props for `SecaoDeDestaque`.
 */
export type SecaoDeDestaqueProps =
  SliceComponentProps<Content.SecaoDeDestaqueSlice>;

/**
 * Component for "SecaoDeDestaque" Slices.
 */
const SecaoDeDestaque = ({ slice }: SecaoDeDestaqueProps): JSX.Element => {
  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
      className="flex justify-center pt-3 px-4 md:pt-8"
    >
      <BoundedImage
        field={slice.primary.banner['Tela estreita']}
        className="md:hidden"
      />
      <BoundedImage
        field={slice.primary.banner['Tela larga']}
        className="hidden md:block rounded-[1.75rem]"
      />
    </section>
  );
};

export default SecaoDeDestaque;
