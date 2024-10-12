'use client';

import Link from 'next/link';
import { PostDocument } from '../../../prismicio-types';
import 'dayjs/locale/pt-br';
import { MdOutlineFilterList } from 'react-icons/md';
import { ThemeProvider } from '@mui/material';
import { useCallback, useState } from 'react';
import { Query } from '@prismicio/client';
import CustomDatePicker from './CustomDatePicker';
import FiltersButton from './IconButton';
import CustomTextField from './CustomTextField';
import OrderingSelect, { OrderingValue } from './OrderingSelect';
import { muiTheme } from '../utils';
import { twMerge } from 'tailwind-merge';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import dayjs from 'dayjs';

export type PostsSearchParams = {
  page?: string;
  date?: string;
  searchTerms?: string;
  order?: OrderingValue;
};

type BlogListProps = {
  searchParams?: PostsSearchParams;
  postsResponse: Query<PostDocument<string>>;
};

export default function BlogList({ postsResponse }: BlogListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  const createQueryString = useCallback(
    (name: keyof PostsSearchParams, value: string): string => {
      const params = new URLSearchParams(searchParams.toString());
      value ? params.set(name, value) : params.delete(name);
      return params.toString();
    },
    [searchParams]
  );

  const updateQuery = (name: keyof PostsSearchParams, value: string): void => {
    router.push(pathname + '?' + createQueryString(name, value));
  };

  return (
    <div>
      <ThemeProvider theme={muiTheme}>
        <div
          className={twMerge(
            'flex items-center gap-6 mb-3',
            !showFilters && 'mb-6'
          )}
        >
          <CustomTextField
            defaultValue={searchParams.get('searchTerms')}
            onValue={(val) => updateQuery('searchTerms', val)}
          />
          <FiltersButton
            selected={showFilters}
            onClick={() => setShowFilters(!showFilters)}
          >
            <MdOutlineFilterList />
          </FiltersButton>
        </div>

        {showFilters && (
          <div className="flex justify-end gap-4 mb-6">
            <CustomDatePicker
              defaultValue={dayjs(searchParams.get('date'))}
              onDatePick={(date) =>
                updateQuery('date', date?.format('YYYY-MM-DD') || '')
              }
            />
            <OrderingSelect
              defaultValue={searchParams.get('order') as OrderingValue}
              onChange={(ev) => updateQuery('order', ev.target.value)}
            />
          </div>
        )}

        <div className="flex flex-wrap gap-y-4 md:gap-6">
          {postsResponse.results.map((post) => {
            return (
              <Link key={post.id} href={`/post/${post.uid}`}>
                {post.data.titulo_do_post}
              </Link>
            );
          })}
        </div>
      </ThemeProvider>
    </div>
  );
}
