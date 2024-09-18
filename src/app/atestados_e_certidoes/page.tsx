import { Metadata } from 'next';
import { SliceZone } from '@prismicio/react';

import { createClient } from '@/prismicio';
import { components } from '@/slices';
import HeadingBadge from '../components/HeadingBadge';

export default async function Page() {
  const client = createClient();
  const page = await client.getSingle('atestados_e_certidoes');

  return (
    <main>
      <HeadingBadge as="h1">{page.data.titulo}</HeadingBadge>
      <SliceZone slices={page.data.slices} components={components} />
    </main>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const client = createClient();
  const page = await client.getSingle('atestados_e_certidoes');

  return {
    title: page.data.meta_title,
    description: page.data.meta_description
  };
}
