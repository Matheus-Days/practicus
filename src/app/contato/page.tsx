import { Metadata } from 'next';
import { PrismicRichText, SliceZone } from '@prismicio/react';

import { createClient } from '@/prismicio';
import { components } from '@/slices';
import HeadingBadge from '../components/HeadingBadge';
import { PrismicNextImage } from '@prismicio/next';
import BoundedMain from '@/app/components/BoundedMain';
import { subtitleComponent } from '@/app/components/sharedRichTextComponents';

export default async function Page() {
  const client = createClient();
  const page = await client.getSingle('contato');

  const mapLink = page.data.link_do_google_maps_do_escritorio;

  return (
    <BoundedMain className="md:grid grid-cols-2 gap-6 px-0">
      <div>
        <HeadingBadge className="px-4">{page.data.titulo}</HeadingBadge>
        <div className="mt-6 px-4">
          <PrismicRichText
            field={page.data.mensagem_de_contato}
            components={subtitleComponent}
          />
        </div>
        <div className="relative mt-4 md:mt-16 max-w-[34.5rem]">
          <PrismicNextImage
            field={page.data.foto_do_escritorio['Tela estreita']}
            className="md:hidden rounded-t-xl"
          />
          <div className="md:hidden absolute inset-0 bg-[#1e1e1e] opacity-75 z-10 rounded-t-xl"></div>
          <div className="flex flex-col gap-6 pt-[5.625rem] md:pt-0 absolute md:static inset-0 z-20 rounded-t-xl">
            <SliceZone slices={page.data.slices} components={components} />
          </div>
        </div>
        <iframe
          src={(mapLink as any).url}
          width="100%"
          height="193"
          style={{ border: 0 }}
          loading="lazy"
          className="md:h-[18.75rem] md:mt-[3.75rem]"
        ></iframe>
      </div>
      <PrismicNextImage
        field={page.data.foto_do_escritorio['Tela larga']}
        className="hidden md:block rounded-xl max-w-[34.5rem]"
      />
    </BoundedMain>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const client = createClient();
  const page = await client.getSingle('contato');

  return {
    title: page.data.meta_title,
    description: page.data.meta_description
  };
}
