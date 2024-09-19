import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PrismicRichText, SliceZone } from '@prismicio/react';

import { createClient } from '@/prismicio';
import { components } from '@/slices';
import BoundedMain from '@/app/components/BoundedMain';
import HeadingBadge from '@/app/components/HeadingBadge';
import { richTextComponents } from '../../components/sharedRichTextComponents';
import PageBanner from '@/app/components/PageBanner';
import { FieldContainer } from '@/app/components/FieldContainer';
import PageField from '@/app/components/PageField';

type Params = { uid: string };

export default async function Page({ params }: { params: Params }) {
  const client = createClient();
  const page = await client
    .getByUID('modulo_ou_curso', params.uid)
    .catch(() => notFound());

  return (
    <BoundedMain>
      <div className="flex justify-between items-center mb-3">
        <HeadingBadge as="h1">{page.data.titulo_da_pagina}</HeadingBadge>
        {/* <CopyButton onClick={handleCopy} /> */}
      </div>
      <PageBanner
        smImageField={page.data.imagem_ilustrativa['Tela estreita']}
        lgImageField={page.data.imagem_ilustrativa.Banner}
        titleField={page.data.titulo_do_curso_ou_modulo}
      />
      <div className="flex flex-col gap-4 mt-6">
        <FieldContainer>
          <PageField iconName="groups">Público-alvo</PageField>
          <PrismicRichText
            field={page.data.publico_alvo}
            components={richTextComponents}
          />
        </FieldContainer>

        <FieldContainer>
          <PageField iconName="attach_money">
            Investimento:
            <span className="font-normal">{page.data.investimento_curto}</span>
          </PageField>
          <PrismicRichText
            field={page.data.investimento_longo}
            components={richTextComponents}
          />
        </FieldContainer>

        <FieldContainer>
          <PageField iconName="timer">
            Carga horária:
            <span className="font-normal">{page.data.carga_horaria}</span>
          </PageField>
        </FieldContainer>

        <FieldContainer>
          <PageField iconName="person">
            Instrutor:
            {page.data.instrutor_curto && (
              <span className="font-normal">{page.data.instrutor_curto}</span>
            )}
          </PageField>
          <PrismicRichText
            field={page.data.instrutores_longo}
            components={richTextComponents}
          />
        </FieldContainer>

        <FieldContainer>
          <PageField iconName="description">Conteúdo:</PageField>
          <div className="pb-[1.375rem] border-b border-primary">
            <PrismicRichText
              field={page.data.conteudo}
              components={richTextComponents}
            />
          </div>
        </FieldContainer>
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
