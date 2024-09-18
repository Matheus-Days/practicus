import { Metadata } from 'next';
import { SliceZone } from '@prismicio/react';

import { createClient } from '@/prismicio';
import { components } from '@/slices';
import HeadingBadge from '../components/HeadingBadge';

export default async function Page() {
  const client = createClient();
  const page = await client.getSingle('colaboradores');
  const colaboradores = (await client.getAllByType('colaborador')).sort(
    (a, b) => {
      return (a.data.ordem || 0) - (b.data.ordem || 0);
    }
  );

  return (
    <main>
      <HeadingBadge as="h1">{page.data.titulo}</HeadingBadge>
      {colaboradores.map((colaborador) => (
        <div key={colaborador.uid}>{colaborador.data.nome}</div>
      ))}
      <SliceZone slices={page.data.slices} components={components} />
    </main>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const client = createClient();
  const page = await client.getSingle('colaboradores');

  return {
    title: page.data.meta_title,
    description: page.data.meta_description
  };
}
