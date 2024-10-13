import { Metadata } from 'next';
import { PrismicRichText, SliceZone } from '@prismicio/react';

import { createClient } from '@/prismicio';
import { components } from '@/slices';
import BoundedMain from '@/app/components/BoundedMain';
import HeadingBadge from '@/app/components/HeadingBadge';
import { subtitleComponent } from '@/app/components/sharedRichTextComponents';
import BlogList, { PostsSearchParams } from '@/app/components/BlogList';
import { filter } from '@prismicio/client';
import dayjs from 'dayjs';

type PageProps = {
  searchParams?: PostsSearchParams;
};

export default async function Page({ searchParams }: PageProps) {
  const client = createClient();
  const page = await client.getSingle('blog');

  const postsResponse = await client.getByType('post', {
    pageSize: searchParams?.pageSize ? Number(searchParams.pageSize) : 4,
    orderings: [
      {
        field: 'post.first_publication_date',
        direction: searchParams?.order === 'oldest' ? 'asc' : 'desc'
      }
    ],
    filters: [
      searchParams?.searchTerms
        ? filter.fulltext('document', searchParams.searchTerms || '')
        : '',
      searchParams?.date
        ? filter.dateBetween(
            'document.first_publication_date',
            dayjs(searchParams.date).startOf('month').toDate(),
            dayjs(searchParams.date).endOf('month').toDate()
          )
        : ''
    ]
  });

  return (
    <BoundedMain>
      <HeadingBadge as="h1" className="mb-3">
        Blog
      </HeadingBadge>
      <div className="mb-3">
        <PrismicRichText
          field={page.data.subtitulo_da_pagina}
          components={subtitleComponent}
        />
      </div>
      <BlogList postsResponse={postsResponse} />
      <SliceZone slices={page.data.slices} components={components} />
    </BoundedMain>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const client = createClient();
  const page = await client.getSingle('blog');

  return {
    title: page.data.meta_title,
    description: page.data.meta_description
  };
}
