import { Metadata } from 'next';
import { PrismicRichText, SliceZone } from '@prismicio/react';
import { createClient } from '@/prismicio';
import { components } from '@/slices';
import HeadingBadge from '@/app/components/HeadingBadge';
import { richTextComponents } from '@/app/components/sharedRichTextComponents';
import BoundedMain from '@/app/components/BoundedMain';
import { PrismicNextLink } from '@prismicio/next';

export default async function Page() {
  const client = createClient();
  const page = await client.getSingle('modulos_e_cursos');

  const modulosECursos = await client.getAllByType('modulo_ou_curso');

  const modulos = modulosECursos.filter(
    (mc) => mc.data.titulo_da_pagina === 'Módulo'
  );
  const cursos = modulosECursos.filter(
    (mc) => mc.data.titulo_da_pagina === 'Curso'
  );

  return (
    <BoundedMain>
      <HeadingBadge as="h1">{page.data.titulo_da_pagina}</HeadingBadge>

      <h2>{page.data.titulo_da_secao_cursos}</h2>
      {cursos.map((curso) => (
        <PrismicNextLink
          key={curso.uid}
          field={curso.data.link_para_o_modulo_ou_curso}
        >
          <PrismicRichText
            field={curso.data.titulo_do_curso_ou_modulo}
            components={richTextComponents}
          />
        </PrismicNextLink>
      ))}

      <h2>{page.data.titulo_da_secao_modulos}</h2>
      {modulos.map((modulo) => (
        <PrismicNextLink
          key={modulo.uid}
          field={modulo.data.link_para_o_modulo_ou_curso}
        >
          <PrismicRichText
            field={modulo.data.titulo_do_curso_ou_modulo}
            components={richTextComponents}
          />
        </PrismicNextLink>
      ))}

      <SliceZone slices={page.data.slices} components={components} />
    </BoundedMain>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const client = createClient();
  const page = await client.getSingle('modulos_e_cursos');

  return {
    title: page.data.meta_title,
    description: page.data.meta_description
  };
}
