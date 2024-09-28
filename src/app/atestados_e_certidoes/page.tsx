import { Metadata } from 'next';
import { JSXMapSerializer, PrismicRichText, SliceZone } from '@prismicio/react';

import { createClient } from '@/prismicio';
import { components } from '@/slices';
import HeadingBadge from '@/app/components/HeadingBadge';
import BoundedMain from '@/app/components/BoundedMain';
import {
  commonComponents,
  SharedParagraph,
  subtitleComponent
} from '@/app/components/sharedRichTextComponents';
import { PrismicNextLink } from '@prismicio/next';

const sicafParagraph: JSXMapSerializer = {
  ...commonComponents,
  paragraph: ({ children }) => {
    return (
      <SharedParagraph className="text-center md:text-left">
        {children}
      </SharedParagraph>
    );
  },
  hyperlink: ({ children, node }) => {
    return (
      <PrismicNextLink field={node.data} className="underline">
        {children}
      </PrismicNextLink>
    );
  }
};

export default async function Page() {
  const client = createClient();
  const page = await client.getSingle('atestados_e_certidoes');

  return (
    <BoundedMain>
      <HeadingBadge as="h1" className="mb-3">
        {page.data.titulo}
      </HeadingBadge>
      <div className="mb-3">
        <PrismicRichText
          field={page.data.subtitulo}
          components={subtitleComponent}
        />
      </div>

      <div className="mb-3">
        <PrismicRichText
          field={page.data.texto_e_link_para_o_sicaf}
          components={sicafParagraph}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-1 gap-x-8">
        <SliceZone slices={page.data.slices} components={components} />
      </div>
    </BoundedMain>
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
