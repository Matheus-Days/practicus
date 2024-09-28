import { Metadata } from 'next';
import { PrismicRichText, SliceZone } from '@prismicio/react';

import { createClient } from '@/prismicio';
import { components } from '@/slices';
import BoundedMain from '../components/BoundedMain';
import HeadingBadge from '../components/HeadingBadge';
import { subtitleComponent } from '../components/sharedRichTextComponents';
import { PrismicNextImage } from '@prismicio/next';

export default async function Page() {
  const client = createClient();
  const page = await client.getSingle('nossos_clientes');

  return (
    <BoundedMain>
      <HeadingBadge as="h1" className="mb-3">{page.data.titulo}</HeadingBadge>
      <div className="mb-3">
        <PrismicRichText field={page.data.descricao_da_pagina} components={subtitleComponent} />
      </div>
      <div className="flex justify-center">
        <PrismicNextImage field={page.data.imagem_ilustrativa} className="mb-6" />
      </div>
      <div className="flex flex-wrap gap-x-4 md:gap-x-6 gap-y-6 justify-center">
        <SliceZone slices={page.data.slices} components={components} />;
      </div>
    </BoundedMain>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const client = createClient();
  const page = await client.getSingle('nossos_clientes');

  return {
    title: page.data.meta_title,
    description: page.data.meta_description
  };
}
