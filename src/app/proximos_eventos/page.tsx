import { Metadata } from 'next';
import { SliceZone } from '@prismicio/react';

import { createClient } from '@/prismicio';
import { components } from '@/slices';
import BoundedMain from '../components/BoundedMain';
import HeadingBadge from '../components/HeadingBadge';

export default async function Page() {
  const client = createClient();
  const page = await client.getSingle('proximos_eventos');

  return (
    <BoundedMain>
      <HeadingBadge as="h1">{page.data.titulo_da_pagina}</HeadingBadge>
      <SliceZone slices={page.data.slices} components={components} />;
    </BoundedMain>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const client = createClient();
  const page = await client.getSingle('proximos_eventos');

  return {
    title: page.data.meta_title,
    description: page.data.meta_description
  };
}
