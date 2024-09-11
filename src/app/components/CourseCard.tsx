import {
  DateField,
  EmptyImageFieldImage,
  FilledImageFieldImage,
  KeyTextField,
  LinkField,
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
import clsx from 'clsx';

type CommomCardData = {
  link: LinkField;
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
  subtitle: RichTextField;
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

const cardComponents: JSXMapSerializer = { paragraph: CardValueSpan };

const CardParagraph = ({ children }: { children: ReactNode }) => (
  <p className="flex items-end gap-1 text-[0.8125rem] h-[1.25rem] tracking-[0.0094rem]">
    {children}
  </p>
);

export default async function CourseCard({ className, data }: CourseCardProps) {
  return (
    <div
      className={clsx(
        'rounded-xl bg-white',
        className
      )}
    >
      <div className="relative">
        <PrismicImage
          field={data.picture.small}
          className="md:hidden rounded-t-xl w-full opacity-60"
        />
        <PrismicImage
          field={data.picture.large}
          className="hidden md:block rounded-t-xl w-full opacity-60"
        />
        <div className="absolute top-0 w-full h-full z-10 bg-[#1E1E1E] opacity-75 rounded-t-xl"></div>
        <div className="flex items-center absolute top-0 py-[0.875rem] px-[0.75rem] md:py-[1.875rem] md:px-3 w-full h-full z-20">
          <PrismicRichText field={data.title} components={components} />
        </div>
      </div>
      <div className="flex flex-col gap-3 p-3 shadow-md rounded-b-xl">
        <div className="flex flex-col gap-1">
          {data.__typename === 'evento' && (
            <CardParagraph>
              <Strong>Investimento:</Strong>
              <CardValueSpan>{data.price}</CardValueSpan>
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
        <LinkButton field={data.link}>Saiba mais</LinkButton>
      </div>
    </div>
  );
}
