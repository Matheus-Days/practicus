import { PrismicNextImage, PrismicNextImageProps } from '@prismicio/next';
import clsx from 'clsx';

const BoundedImage = (props: PrismicNextImageProps): JSX.Element => {
  return (
    <PrismicNextImage
      {...props}
      className={clsx(
        'w-full rounded-xl shadow-md max-w-[70.5rem]',
        props.className
      )}
    />
  );
};

export default BoundedImage;
