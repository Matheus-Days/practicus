import { Metadata } from 'next';
import { PrismicRichText, SliceZone } from '@prismicio/react';
import { createClient } from '@/prismicio';
import { components } from '@/slices';
import HeadingBadge from '@/app/components/HeadingBadge';
import { richTextComponents } from '@/app/components/sharedRichTextComponents';
import BoundedMain from '@/app/components/BoundedMain';
import { ModuloOuCursoDocument } from '../../../prismicio-types';
import CourseCard, { CursoCardData } from '../components/CourseCard';

export default async function Page() {
  const client = createClient();
  const page = await client.getSingle('modulos_e_cursos');

  const modulosECursos = await client.getAllByType('modulo_ou_curso');

  const modulos = modulosECursos
    .filter((mc) => mc.data.titulo_da_pagina === 'Módulo')
    .map(mapToCursoCardData);
  const cursos = modulosECursos
    .filter((mc) => mc.data.titulo_da_pagina === 'Curso')
    .map(mapToCursoCardData);

  return (
    <BoundedMain>
      <HeadingBadge as="h1">{page.data.titulo_da_pagina}</HeadingBadge>

      <div className="mt-3 md:mt-6">
        <PrismicRichText
          field={page.data.texto_descricao_da_pagina}
          components={richTextComponents}
        />
      </div>

      <h2 className="font-display font-medium text-2xl mt-4">
        {page.data.titulo_da_secao_cursos}
      </h2>

      <div className="mt-2">
        <PrismicRichText
          field={page.data.texto_da_secao_cursos}
          components={richTextComponents}
        />
      </div>

      <div className="flex flex-col gap-4 mt-3 md:grid grid-cols-2 md:gap-x-6">
        {cursos.map((data) => (
          <CourseCard key={data.uid} data={data} />
        ))}
      </div>

      <h2 className="font-display font-medium text-2xl mt-4">
        {page.data.titulo_da_secao_modulos}
      </h2>

      <div className="mt-2">
        <PrismicRichText
          field={page.data.texto_da_secao_modulos}
          components={richTextComponents}
        />
      </div>

      <div className="flex flex-col gap-4 mt-3 md:grid grid-cols-2 md:gap-x-6">
        {modulos.map((data) => (
          <CourseCard key={data.uid} data={data} />
        ))}
      </div>

      <SliceZone slices={page.data.slices} components={components} />
    </BoundedMain>
  );
}

function mapToCursoCardData({
  data,
  uid
}: ModuloOuCursoDocument<string>): CursoCardData {
  return {
    __typename: 'curso',
    instructor: data.instrutor_curto,
    picture: {
      large: data.imagem_ilustrativa['Tela larga'],
      small: data.imagem_ilustrativa['Tela estreita']
    },
    price: data.investimento_curto,
    title: data.titulo_do_curso_ou_modulo,
    uid,
    workload: data.carga_horaria
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const client = createClient();
  const page = await client.getSingle('modulos_e_cursos');

  return {
    title: page.data.meta_title,
    description: page.data.meta_description
  };
}
