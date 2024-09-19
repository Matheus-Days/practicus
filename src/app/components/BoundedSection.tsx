import { twMerge } from 'tailwind-merge';

const BoundedSection = (props: React.HTMLProps<HTMLElement>): JSX.Element => {
  return (
    <section
      {...props}
      className={twMerge(
        'flex flex-col items-center gap-4 md:gap-6 px-4 pt-6 md:pt-8 text-primary',
        props.className
      )}
    >
      {props.children}
    </section>
  );
};

export default BoundedSection;
