import { PrismicNextLink, PrismicNextLinkProps } from '@prismicio/next';
import clsx from 'clsx';

const LinkButton = (props: PrismicNextLinkProps): JSX.Element => {
  return (
    <PrismicNextLink
      {...props}
      className={clsx(
        'w-fit bg-primary rounded-full py-[0.625rem] px-6 font-body text-base font-medium leading-5 text-surface text-center',
        props.className
      )}
    />
  );
};

export default LinkButton;
