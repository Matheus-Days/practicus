import { PrismicNextImage } from '@prismicio/next';
import { ColaboradorDocument } from '../../../prismicio-types';
import { JSXMapSerializer, PrismicRichText } from '@prismicio/react';
import {
  richTextComponents,
  SharedParagraph
} from './sharedRichTextComponents';
import ReadMore from './ReadMore';

type CardColaboradorProps = {
  doc: ColaboradorDocument<string>;
};

const cardRichTextComponents: JSXMapSerializer = {
  ...richTextComponents,
  paragraph: ({ children }) => {
    return (
      <p className="font-body text-base md:text-lg text-primary">{children}</p>
    );
  }
};

export default function CardColaborador({ doc }: CardColaboradorProps) {
  return (
    <div className="inline-flex flex-col gap-3 w-[9.75rem] md:w-[16.5rem]">
      <PrismicNextImage
        field={doc.data.foto['Tela estreita']}
        className="md:hidden w-full rounded-xl"
      />
      <PrismicNextImage
        field={doc.data.foto}
        className="hidden md:block w-full rounded-xl"
      />
      <div className="flex flex-col gap-2">
        <p>{doc.data.nome}</p>
        <PrismicRichText
          field={doc.data.apresentacao_curta}
          components={cardRichTextComponents}
        />
        <ReadMore buttonLabel="Ler mais">
          <div className="my-2 px-4 pt-3 pb-4">
            <SharedParagraph className="mb-2 font-display font-medium">
              {doc.data.nome}
            </SharedParagraph>
            <PrismicRichText
              field={doc.data.apresentacao_longa}
              components={richTextComponents}
            />
          </div>
        </ReadMore>
      </div>
    </div>
  );
}
