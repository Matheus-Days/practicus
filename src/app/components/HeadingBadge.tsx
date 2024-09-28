import { twJoin, twMerge } from 'tailwind-merge';

type HeadingBadgeProps = React.HTMLProps<HTMLElement> & {
  as: 'h1' | 'h2';
};

function HeadingWrapper({ as, className, children }: HeadingBadgeProps) {
  if (as === 'h1') return <h1 className={className}>{children}</h1>;
  else return <h2 className={className}>{children}</h2>;
}

export default async function HeadingBadge({
  as,
  children,
  className
}: HeadingBadgeProps) {
  return (
    <HeadingWrapper
      as={as}
      className={twMerge(
        'flex font-display text-lg md:text-2xl text-primary justify-center md:justify-start',
        className
      )}
    >
      <span
        className={twJoin(
          'text-center rounded-lg border-primary border md:border-2 py-[6px] px-4 leading-5 md:leading-[2.625rem] font-medium',
          as === 'h2' ? 'md:w-[46.5rem]' : ''
        )}
      >
        {children}
      </span>
    </HeadingWrapper>
  );
}
