import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PrismicRichText, SliceZone } from '@prismicio/react';

import { createClient } from '@/prismicio';
import { components } from '@/slices';
import BoundedMain from '@/app/components/BoundedMain';
import HeadingBadge from '@/app/components/HeadingBadge';
import { richTextComponents } from '../../components/sharedRichTextComponents';

type Params = { uid: string };

export default async function Page({ params }: { params: Params }) {
  const client = createClient();
  const page = await client
    .getByUID('modulo_ou_curso', params.uid)
    .catch(() => notFound());

  return (
    <BoundedMain>
      <HeadingBadge>{page.data.titulo_da_pagina}</HeadingBadge>
      <PrismicRichText
        field={page.data.titulo_do_curso_ou_modulo}
        components={richTextComponents}
      />
      <SliceZone slices={page.data.slices} components={components} />;
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
    .getByUID('modulo_ou_curso', params.uid)
    .catch(() => notFound());

  return {
    title: page.data.meta_title,
    description: page.data.meta_description
  };
}

export async function generateStaticParams() {
  const client = createClient();
  const pages = await client.getAllByType('modulo_ou_curso');

  return pages.map((page) => {
    return { uid: page.uid };
  });
}
