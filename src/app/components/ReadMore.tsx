'use client';

import { ReactNode, useState } from 'react';
import BasicButton from './BasicButton';
import { KeyTextField, RichTextField } from '@prismicio/client';
import { PrismicRichText } from '@prismicio/react';
import {
  richTextComponents,
  SharedParagraph
} from './sharedRichTextComponents';
import MaterialCard from './MaterialCard';

type ReadMoreProps = {
  children: ReactNode;
  text: RichTextField;
  name: KeyTextField;
};

export default function ReadMore({ children, name, text }: ReadMoreProps) {
  const [show, setShow] = useState(false);

  const contents = (
    <div className="my-2 px-4 pt-3 pb-4">
      <SharedParagraph className="mb-2 font-display font-medium">
        {name}
      </SharedParagraph>
      <PrismicRichText field={text} components={richTextComponents} />
    </div>
  );

  return (
    <span>
      <BasicButton onClick={() => setShow(!show)}>{children}</BasicButton>
      {show && (
        // Dialog
        <div
          className="fixed inset-0 bg-surface bg-opacity-80 flex items-center justify-center"
          onClick={() => setShow(false)}
        >
          {/* Card */}
          <MaterialCard
            contents={contents}
            onClose={() => setShow(false)}
            onClick={(ev) => ev.stopPropagation()}
          >
            {/* Card content */}
          </MaterialCard>
        </div>
      )}
    </span>
  );
}
