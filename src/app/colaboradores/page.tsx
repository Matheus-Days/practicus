import { Metadata } from 'next';
import { SliceZone } from '@prismicio/react';

import { createClient } from '@/prismicio';
import { components } from '@/slices';
import HeadingBadge from '../components/HeadingBadge';
import BoundedMain from '../components/BoundedMain';
import CardColaborador from '@/app/components/CardColaborador';

export default async function Page() {
  const client = createClient();
  const page = await client.getSingle('colaboradores');
  const colaboradores = (await client.getAllByType('colaborador')).sort(
    (a, b) => {
      return (a.data.ordem || 0) - (b.data.ordem || 0);
    }
  );

  return (
    <BoundedMain>
      <HeadingBadge as="h1" className="mb-3">{page.data.titulo}</HeadingBadge>
      <div className="flex flex-wrap gap-y-6 gap-x-4 md:gap-x-6">
        {colaboradores.map((colaborador) => (
          <CardColaborador key={colaborador.uid} doc={colaborador} />
        ))}
      </div>
      <SliceZone slices={page.data.slices} components={components} />
    </BoundedMain>
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
