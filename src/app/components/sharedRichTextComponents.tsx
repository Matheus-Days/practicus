import { JSXMapSerializer } from '@prismicio/react';

export const commonComponents: JSXMapSerializer = {
  em: ({ children }) => <em className="italic">{children}</em>,
  strong: ({ children }) => <b className="font-medium">{children}</b>
};

export const richTextComponents: JSXMapSerializer = {
  ...commonComponents,
  paragraph: ({ children }) => (
    <p className="font-body text-base md:text-lg text-primary min-h-[14px] md:min-h-4">
      {children}
    </p>
  ),
  heading3: ({ children }) => (
    <h3 className="font-body text-[1.25rem] md:text-[1.375rem] text-primary">
      {children}
    </h3>
  ),
  heading4: ({ children }) => (
    <h4 className="font-body text-[1.125rem] md:text-[1.25rem] text-primary">
      {children}
    </h4>
  ),
  list: ({ children }) => <ul className="mt-2 pl-4 list-disc">{children}</ul>,
  oList: ({ children }) => <ul className="mt-2 pl-4 list-decimal">{children}</ul>,
  listItem: ({ children }) => (
    <li className="font-body text-base md:text-lg text-primary">{children}</li>
  ),
  oListItem: ({ children }) => (
    <li className="font-body text-base md:text-lg text-primary">{children}</li>
  )
};

export const subtitleComponent: JSXMapSerializer = {
  ...commonComponents,
  paragraph: ({ children }) => (
    <p className="font-body text-base md:text-xl text-primary text-center md:text-left">
      {children}
    </p>
  )
};
