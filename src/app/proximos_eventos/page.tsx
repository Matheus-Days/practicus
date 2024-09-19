import { Metadata } from 'next';
import { PrismicRichText, SliceZone } from '@prismicio/react';

import { createClient } from '@/prismicio';
import { components } from '@/slices';
import BoundedMain from '../components/BoundedMain';
import HeadingBadge from '../components/HeadingBadge';
import { subtitleComponent } from '../components/sharedRichTextComponents';
import { Content, isFilled } from '@prismicio/client';
import CourseCard, { EventoCardData } from '../components/CourseCard';
import { Fragment } from 'react';
import { twJoin } from 'tailwind-merge';

export default async function Page() {
  const client = createClient();
  const page = await client.getSingle('proximos_eventos');

  const eventos: EventoCardData[] = (
    await Promise.all(
      page.data.eventos_abertos.map((item) => {
        if (isFilled.contentRelationship(item.evento) && item.evento.uid)
          return client.getByUID('evento', item.evento.uid);
      })
    )
  )
    .filter((e) => !!e)
    .map(mapEventoToCourseCard);

  const itemsCenter = eventos.length === 0 ? 'items-center' : '';

  return (
    <BoundedMain className="flex flex-col">
      <HeadingBadge as="h1">{page.data.titulo_da_pagina}</HeadingBadge>
      {eventos.length > 0 && (
        <Fragment>
          <div className="mt-3 md:mt-6">
            <PrismicRichText
              field={page.data.texto_da_pagina}
              components={subtitleComponent}
            />
          </div>

          <div className="mt-6 flex flex-col gap-4 md:grid grid-cols-2 gap-x-6">
            {eventos.map((evento) => (
              <CourseCard
                key={evento.uid}
                data={evento}
                className="w-full min-w-[20.5rem] min-h-[15.25rem] md:min-h-[18.375rem]"
              />
            ))}
          </div>
        </Fragment>
      )}
      <div className={twJoin('flex flex-grow', itemsCenter)}>
        <SliceZone slices={page.data.slices} components={components} />
      </div>
    </BoundedMain>
  );
}

export const mapEventoToCourseCard = ({
  data,
  uid
}: Content.EventoDocument<string>) => {
  const evento: EventoCardData = {
    __typename: 'evento',
    date: data.data_do_evento,
    link: data.link_do_evento,
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

export async function generateMetadata(): Promise<Metadata> {
  const client = createClient();
  const page = await client.getSingle('proximos_eventos');

  return {
    title: page.data.meta_title,
    description: page.data.meta_description
  };
}
