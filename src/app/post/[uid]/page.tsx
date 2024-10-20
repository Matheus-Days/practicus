import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { JSXMapSerializer, PrismicRichText, SliceZone } from '@prismicio/react';
import { createClient } from '@/prismicio';
import { components } from '@/slices';
import BoundedMain from '@/app/components/BoundedMain';
import { PrismicNextImage } from '@prismicio/next';
import dayjs from 'dayjs';
import { richTextComponents } from '../../components/sharedRichTextComponents';

const formatDate = (date: string): string => {
  return dayjs(date).format('DD/MM/YYYY à[s] HH:mm');
};

const legendaComponents: JSXMapSerializer = {
  paragraph: ({ children }) => (
    <p className="font-body text-sm text-primary text-right">{children}</p>
  )
};

type Params = { uid: string };

export default async function Page({ params }: { params: Params }) {
  const client = createClient();
  const page = await client
    .getByUID('post', params.uid)
    .catch(() => notFound());

  return (
    <BoundedMain>
      <div className="flex font-display text-lg md:text-2xl text-primary justify-center md:justify-start">
        <span className="text-center rounded-lg border-primary border md:border-2 py-[6px] px-4 leading-5 md:leading-[2.625rem] font-medium">
          Blog
        </span>
      </div>

      <h1 className="font-display font-medium text-lg md:text-2xl text-center md:text-left mt-3">
        {page.data.titulo_do_post}
      </h1>

      <p className="text-base font-medium mt-4">
        Escrito por: {page.data.autor}
      </p>

      <div className="flex flex-col gap-1 mt-3">
        <PrismicNextImage
          className="w-full md:hidden rounded-xl"
          field={page.data.imagem_ilustrativa['Card e banner (tela estreita)']}
        />
        <PrismicNextImage
          className="w-full hidden md:block rounded-xl"
          field={page.data.imagem_ilustrativa['Banner (tela larga)']}
        />
        <PrismicRichText
          field={page.data.legenda_da_imagem}
          components={legendaComponents}
        />
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-base">
          <strong className="font-medium">Publicado em: </strong>
          <span>{formatDate(page.first_publication_date)}</span>
        </p>
        <p className="text-base">
          <strong className="font-medium">Atualizado em: </strong>
          <span>{formatDate(page.last_publication_date)}</span>
        </p>
      </div>

      <div className="mt-8">
        <PrismicRichText
          field={page.data.conteudo}
          components={richTextComponents}
        />
      </div>
      <SliceZone slices={page.data.slices} components={components} />
    </BoundedMain>
  );
}

export async function generateMetadata({
  params
}: {
  params: Params;
}): Promise<Metadata> {
  const client = createClient();
  const page = await client
    .getByUID('post', params.uid)
    .catch(() => notFound());

  return {
    title: page.data.meta_title,
    description: page.data.meta_description
  };
}

export async function generateStaticParams() {
  const client = createClient();
  const pages = await client.getAllByType('post');

  return pages.map((page) => {
    return { uid: page.uid };
  });
}
