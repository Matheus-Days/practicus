import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/prismicio';
import HeadingBadge from '@/app/components/HeadingBadge';
import BoundedMain from '@/app/components/BoundedMain';
import PageBanner from '@/app/components/PageBanner';
import AttendeeFlow from '@/app/components/attendee/AttendeeFlow';

type Params = { uid: string };

export default async function Page({ params }: { params: Params }) {
  const client = createClient();
  const page = await client.getByUID('evento', params.uid).catch(() => notFound());

  return (
    <BoundedMain>
      <HeadingBadge as="h1" className="mb-3">Inscreva-se</HeadingBadge>
      <PageBanner
        smImageField={page.data.imagem_ilustrativa['Tela estreita']}
        lgImageField={page.data.imagem_ilustrativa.Banner}
        titleField={page.data.nome_do_evento}
      />
      <div className="flex flex-col items-center mt-8">
        <AttendeeFlow eventId={params.uid} />
      </div>
    </BoundedMain>
  );
}

export async function generateMetadata({
  params
}: {
  params: Params;
}): Promise<Metadata> {
  const client = createClient();
  const page = await client.getByUID('evento', params.uid).catch(() => notFound());

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

