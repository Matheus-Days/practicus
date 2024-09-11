import clsx from 'clsx';

const BoundedMain = (props: React.HTMLProps<HTMLElement>): JSX.Element => {
  return (
    <main
      {...props}
      className={clsx(
        'px-4 pt-6 md:pt-8 md:px-[9.75rem] text-primary',
        props.className
      )}
    >
      {props.children}
    </main>
  );
};

export default BoundedMain;
