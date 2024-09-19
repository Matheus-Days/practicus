import { PrismicNextImage, PrismicNextImageProps } from '@prismicio/next';
import { twMerge } from 'tailwind-merge';

const BoundedImage = (props: PrismicNextImageProps): JSX.Element => {
  return (
    <PrismicNextImage
      {...props}
      className={twMerge(
        'w-full rounded-xl shadow-md max-w-[70.5rem]',
        props.className
      )}
    />
  );
};

export default BoundedImage;
