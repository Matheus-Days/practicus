'use client';

import { ReactNode, useState } from 'react';
import BasicButton from './BasicButton';
import { PrismicRichText } from '@prismicio/react';
import {
  richTextComponents,
  SharedParagraph
} from './sharedRichTextComponents';
import MaterialCard from './MaterialCard';

type ReadMoreProps = {
  children: ReactNode;
  buttonLabel: string;
};

export default function ReadMore({ buttonLabel, children }: ReadMoreProps) {
  const [show, setShow] = useState(false);

  return (
    <span>
      <BasicButton onClick={() => setShow(!show)}>{buttonLabel}</BasicButton>
      {show && (
        // Dialog
        <span
          className="fixed inset-0 bg-surface bg-opacity-80 flex items-center justify-center"
          onClick={() => setShow(false)}
        >
          {/* Card */}
          <MaterialCard
            onClose={() => setShow(false)}
            onClick={(ev) => ev.stopPropagation()}
          >
            {children}
          </MaterialCard>
        </span>
      )}
    </span>
  );
}
