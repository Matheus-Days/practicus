import { Content } from '@prismicio/client';
import { JSXMapSerializer, PrismicRichText } from '@prismicio/react';
import { commonComponents } from './sharedRichTextComponents';
import { ReactNode } from 'react';
import ReadMore from './ReadMore';

type DepoimentoCardProps = {
  depoimento: Content.DepoimentoDocument<string>;
};

const CardContentParagraph = ({ children }: { children: ReactNode }) => {
  return <p className="text-sm tracking-[0.0094rem] font-normal">{children}</p>;
};

const cursoRichTextComponents: JSXMapSerializer = {
  ...commonComponents,
  paragraph: ({ children }) => {
    return <CardContentParagraph>{children}</CardContentParagraph>;
  }
};

const depoimentoRichTextComponents: JSXMapSerializer = {
  ...commonComponents,
  paragraph: ({ children }) => {
    return (
      <p className="font-display font-medium text-[0.8125rem] leading-[1.1875rem] tracking-[0.0094rem] md:text-xl">
        {children}
      </p>
    );
  }
};

export default function DepoimentoCard({ depoimento }: DepoimentoCardProps) {
  const SharedSection = () => {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex gap-1 items-start">
          <strong className="text-[0.8125rem] leading-[1] font-medium">
            Curso:
          </strong>
          <PrismicRichText
            field={depoimento.data.curso}
            components={cursoRichTextComponents}
          />
        </div>
        <CardContentParagraph>
          {depoimento.data.identificacao_do_depoente}
        </CardContentParagraph>
        <CardContentParagraph>
          {depoimento.data.local_da_organizacao}
        </CardContentParagraph>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-3 p-3 mx-1 mb-1 max-w-[20.5rem] rounded-xl bg-white overflow-hidden shadow-md font-display">
      <p className="font-medium text-lg">
        {depoimento.data.chamada?.substring(0, 59) + '...'}
        &nbsp;
        <ReadMore buttonLabel="Ler mais">
          <span className="flex flex-col gap-2">
            <span>
              <PrismicRichText
                field={depoimento.data.texto}
                components={depoimentoRichTextComponents}
              />
            </span>
            <SharedSection />
          </span>
        </ReadMore>
      </p>
      <SharedSection />
    </div>
  );
}
