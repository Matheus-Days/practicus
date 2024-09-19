import { twMerge } from 'tailwind-merge';

const BoundedMain = (props: React.HTMLProps<HTMLElement>): JSX.Element => {
  return (
    <main
      {...props}
      className={twMerge(
        'flex-grow px-4 pt-6 md:pt-8 md:px-[9.75rem] text-primary',
        props.className
      )}
    >
      {props.children}
    </main>
  );
};

export default BoundedMain;
