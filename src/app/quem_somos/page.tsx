import { Metadata } from "next";
import { SliceZone } from "@prismicio/react";

import { createClient } from "@/prismicio";
import { components } from "@/slices";
import HeadingBadge from '../components/HeadingBadge';
import { PrismicNextImage } from '@prismicio/next';

export default async function Page() {
  const client = createClient();
  const page = await client.getSingle("quem_somos");

  return <main>
    <HeadingBadge>{page.data.titulo}</HeadingBadge>
    <PrismicNextImage field={page.data.foto_ilustrativa} />
    <SliceZone slices={page.data.slices} components={components} />;
  </main>
}

export async function generateMetadata(): Promise<Metadata> {
  const client = createClient();
  const page = await client.getSingle("quem_somos");

  return {
    title: page.data.meta_title,
    description: page.data.meta_description,
  };
}