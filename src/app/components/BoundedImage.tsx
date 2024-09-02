import { PrismicNextImage, PrismicNextImageProps } from '@prismicio/next';
import clsx from 'clsx';

const BoundedImage = (props: PrismicNextImageProps): JSX.Element => {
  return (
    <PrismicNextImage
      {...props}
      className={clsx(
        'w-full rounded-xl md:rounded-[1.75rem] shadow-md max-w-[1128px]',
        props.className
      )}
    />
  );
};

export default BoundedImage;
