'use client';

import { PrismicNextLink } from '@prismicio/next';
import CloseIcon from '../icons/close';
import { Fragment, useEffect, useState } from 'react';
import { GroupField } from '@prismicio/client';
import {
  ConfiguracoesDocumentDataNavegacaoItem,
  Simplify
} from '../../../prismicio-types';
import MenuIcon from '../icons/menu';

type MobileNavProps = {
  navegacao: GroupField<Simplify<ConfiguracoesDocumentDataNavegacaoItem>>;
};

export default function MobileNav({ navegacao }: MobileNavProps): JSX.Element {
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    if (opened) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
  }, [opened]);

  return (
    <Fragment>
      {opened && (
        <nav className="font-display md:hidden absolute top-full left-0 z-50 w-full border-t border-accent">
          <ul className="flex flex-col">
            {navegacao.map(({ link, rotulo }) => (
              <PrismicNextLink
                field={link}
                key={rotulo}
                className="py-3 pr-6 border-b border-accent text-right"
              >
                <li>{rotulo}</li>
              </PrismicNextLink>
            ))}
          </ul>
        </nav>
      )}

      <button className="p-3 md:hidden" onClick={() => setOpened(!opened)}>
        {opened ? <CloseIcon /> : <MenuIcon />}
      </button>

      {opened && (
        <div className="absolute bg-[#F1F1F1] top-full left-0 z-40 w-screen h-screen"></div>
      )}
    </Fragment>
  );
}
