import { JSXMapSerializer } from '@prismicio/react';

export const richTextComponents: JSXMapSerializer = {
  paragraph: ({ children }) => (
    <p className="font-body text-base md:text-lg text-primary">{children}</p>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  strong: ({ children }) => <b className="font-medium">{children}</b>,
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
  list: ({ children }) => <ul className="pl-4 list-disc">{children}</ul>,
  oList: ({ children }) => <ul className="pl-4 list-decimal">{children}</ul>,
  listItem: ({ children }) => (
    <li className="font-body text-base md:text-lg text-primary">{children}</li>
  ),
  oListItem: ({ children }) => (
    <li className="font-body text-base md:text-lg text-primary">{children}</li>
  )
};
