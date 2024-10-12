import { Metadata } from "next";
import { notFound } from "next/navigation";
import { SliceZone } from "@prismicio/react";

import { createClient } from "@/prismicio";
import { components } from "@/slices";
import BoundedMain from '@/app/components/BoundedMain';
import HeadingBadge from '@/app/components/HeadingBadge';
import { PrismicNextImage } from '@prismicio/next';

type Params = { uid: string };

export default async function Page({ params }: { params: Params }) {
  const client = createClient();
  const page = await client
    .getByUID("post", params.uid)
    .catch(() => notFound());

  return (
    <BoundedMain>
      <HeadingBadge as="h1">Blog</HeadingBadge>
      <h1 className="font-display font-medium text-2xl">{page.data.titulo_do_post}</h1>
      <PrismicNextImage field={page.data.imagem_ilustrativa['Banner (tela larga)']} />
      <SliceZone slices={page.data.slices} components={components} />
    </BoundedMain>
  )
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const client = createClient();
  const page = await client
    .getByUID("post", params.uid)
    .catch(() => notFound());

  return {
    title: page.data.meta_title,
    description: page.data.meta_description,
  };
}

export async function generateStaticParams() {
  const client = createClient();
  const pages = await client.getAllByType("post");

  return pages.map((page) => {
    return { uid: page.uid };
  });
}