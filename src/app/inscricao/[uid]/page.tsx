import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/prismicio';

type Params = { uid: string };

export default async function Page({ params }: { params: Params }) {
  // Rota legada -> nova rota do fluxo de attendee.
  // Mantemos server-side redirect para preservar links antigos.
  redirect(`/evento/${params.uid}/inscricao`);
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
