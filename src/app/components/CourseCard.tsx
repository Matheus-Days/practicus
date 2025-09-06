import {
  Content,
  DateField,
  EmptyImageFieldImage,
  FilledImageFieldImage,
  KeyTextField,
  RichTextField
} from '@prismicio/client';
import {
  JSXMapSerializer,
  PrismicImage,
  PrismicRichText
} from '@prismicio/react';
import LinkButton from './LinkButton';
import { ReactNode } from 'react';
import { formatDate } from '../utils';
import { twMerge } from 'tailwind-merge';

type CommomCardData = {
  picture: {
    small: EmptyImageFieldImage | FilledImageFieldImage;
    large: EmptyImageFieldImage | FilledImageFieldImage;
  };
  price: KeyTextField;
  title: RichTextField;
  uid: string;
};

export type EventoCardData = CommomCardData & {
  __typename: 'evento';
  date: DateField;
  location: KeyTextField;
};

export type CursoCardData = CommomCardData & {
  __typename: 'curso';
  instructor: KeyTextField;
  workload: KeyTextField;
};

export type CourseCardData = EventoCardData | CursoCardData;

type CourseCardProps = {
  className?: string;
  data: CourseCardData;
};

const Strong = ({ children }: { children: ReactNode }) => (
  <b className="font-medium leading-[1]">{children}</b>
);

const components: JSXMapSerializer = {
  paragraph: ({ children }) => (
    <h3 className="font-display text-lg md:text-xl text-surface">{children}</h3>
  ),
  strong: Strong,
  em: ({ children }) => <em className="italic">{children}</em>
};

const CardValueSpan = ({ children }: { children: ReactNode }) => (
  <span className="font-display text-sm leading-[1]">{children}</span>
);

const CardParagraph = ({ children }: { children: ReactNode }) => (
  <p className="flex items-end gap-1 text-[0.8125rem] h-[1.25rem] tracking-[0.0094rem]">
    {children}
  </p>
);

export default function CourseCard({ className, data }: CourseCardProps) {
  const linkType = data.__typename === 'curso' ? 'modulo_ou_curso' : 'evento';
  const linkField: any = {
    url: `/${linkType}/${data.uid}`,
    link_type: 'Document'
  };

  return (
    <div className={twMerge('rounded-xl bg-white', className)}>
      <div className="relative">
        <PrismicImage
          field={data.picture.small}
          className="md:hidden rounded-t-xl w-full"
        />
        <PrismicImage
          field={data.picture.large}
          className="hidden md:block rounded-t-xl w-full"
        />
        <div className="absolute top-0 w-full h-full z-10 bg-[#1E1E1E] opacity-60 rounded-t-xl"></div>
        <div className="flex items-center absolute top-0 py-[0.875rem] px-[0.75rem] md:py-[1.875rem] md:px-3 w-full h-full z-20">
          <PrismicRichText field={data.title} components={components} />
        </div>
      </div>
      <div className="flex flex-col gap-3 p-3 shadow-md rounded-b-xl">
        <div className="flex flex-col gap-1">
          {data.__typename === 'curso' && (
            <CardParagraph>
              <Strong>Carga horária:</Strong>
              <CardValueSpan>{data.workload}</CardValueSpan>
            </CardParagraph>
          )}

          <CardParagraph>
            <Strong>Investimento:</Strong>
            <CardValueSpan>{data.price}</CardValueSpan>
          </CardParagraph>

          {data.__typename === 'curso' && (
            <CardParagraph>
              <Strong>Instrutor:</Strong>
              <CardValueSpan>{data.instructor}</CardValueSpan>
            </CardParagraph>
          )}

          {data.__typename === 'evento' && data.date && (
            <CardParagraph>
              <Strong>Data:</Strong>
              <CardValueSpan>{formatDate(data.date)}</CardValueSpan>
            </CardParagraph>
          )}

          {data.__typename === 'evento' && data.location && (
            <CardParagraph>
              <Strong>Local:</Strong>
              <CardValueSpan>{data.location}</CardValueSpan>
            </CardParagraph>
          )}
        </div>
        <LinkButton field={linkField}>Saiba mais</LinkButton>
      </div>
    </div>
  );
}

export const mapEventoToCourseCard = ({
  data,
  uid
}: Content.EventoDocument<string>) => {
  const evento: EventoCardData = {
    __typename: 'evento',
    date: data.data_do_evento,
    location: data.local_do_evento_curto,
    picture: {
      small: data.imagem_ilustrativa['Tela estreita'],
      large: data.imagem_ilustrativa['Tela larga']
    },
    price: data.valor_do_evento,
    title: data.nome_do_evento,
    uid
  };
  return evento;
};