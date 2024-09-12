import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PrismicRichText, SliceZone } from '@prismicio/react';
import { ReactNode } from 'react';
import { components } from '@/slices';
import { createClient } from '@/prismicio';
import HeadingBadge from '@/app/components/HeadingBadge';
import { PrismicNextImage } from '@prismicio/next';
import PageField from '@/app/components/PageField';
import BoundedMain from '@/app/components/BoundedMain';
import { richTextComponents } from '@/app/components/sharedRichTextComponents';
import { formatDate } from '@/app/utils';
import PageBanner from '@/app/components/PageBanner';

type Params = { uid: string };

function FieldContainer({ children }: { children: ReactNode }): JSX.Element {
  return <div className="flex flex-col gap-2">{children}</div>;
}

export default async function Page({ params }: { params: Params }) {
  const client = createClient();
  const page = await client
    .getByUID('evento', params.uid)
    .catch(() => notFound());
  return (
    <BoundedMain>
      <HeadingBadge className="mb-3">Evento</HeadingBadge>

      <PageBanner
        smImageField={page.data.imagem_ilustrativa['Tela estreita']}
        lgImageField={page.data.imagem_ilustrativa.Banner}
        titleField={page.data.nome_do_evento}
      />

      <div className="flex flex-col gap-4">
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
            <span className="font-normal">{page.data.valor_do_evento}</span>
          </PageField>
        </FieldContainer>

        <FieldContainer>
          <PageField iconName="timer">
            Carga horária:
            <span className="font-normal">{page.data.carga_horaria}</span>
          </PageField>
        </FieldContainer>

        <FieldContainer>
          <PageField iconName="event">
            Data:
            <span className="font-normal">
              {formatDate(page.data.data_do_evento)}
            </span>
          </PageField>
        </FieldContainer>

        <FieldContainer>
          <PageField iconName="schedule">
            Horário:
            <span className="font-normal">{page.data.horario}</span>
          </PageField>
        </FieldContainer>

        <FieldContainer>
          <PageField iconName="location_on">
            Local:
          </PageField>
          <PrismicRichText
            field={page.data.local_do_evento_longo}
            components={richTextComponents}
          />
        </FieldContainer>

        <FieldContainer>
          <PageField iconName="person">
            Instrutor:
            {page.data.instrutor_curto && <span className="font-normal">{page.data.instrutor_curto}</span>} 
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
    .getByUID('evento', params.uid)
    .catch(() => notFound());

  return {
    title: page.data.meta_title,
    description: page.data.meta_description
  };
}

export async function generateStaticParams() {
  const client = createClient();
  const pages = await client.getAllByType('evento');

  return pages.map((page) => {
    return { uid: page.uid };
  });
}
