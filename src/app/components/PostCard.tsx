import { Content, LinkField, RichTextField } from '@prismicio/client';
import {
  JSXMapSerializer,
  PrismicImage,
  PrismicRichText
} from '@prismicio/react';
import LinkButton from './LinkButton';
import { twMerge } from 'tailwind-merge';
import { PostDocument } from '../../../prismicio-types';
import { commonComponents } from './sharedRichTextComponents';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const formatDate = (date: string): string => {
  if (!date) return '';
  return dayjs(date).tz('America/Fortaleza').format('DD/MM/YYYY');
};

type PostCardProps = {
  className?: string;
  post: PostDocument<string>;
};

const conteudoComponents: JSXMapSerializer = {
  ...commonComponents,
  paragraph: ({ children }) => (
    <p className="font-display text-sm text-primary line-clamp-3">{children}</p>
  )
};

export default function PostCard({ className, post }: PostCardProps) {
  const linkField: LinkField = {
    url: `/post/${post.uid}`,
    link_type: 'Document'
  };

  const conteudoFirstParagraph = post.data.conteudo.find(
    (node) => node.type === 'paragraph'
  );
  const reducedConteudo: RichTextField = [
    conteudoFirstParagraph || { type: 'paragraph', text: '', spans: [] }
  ];

  return (
    <div className={twMerge('rounded-xl bg-white', className)}>
      <div className="relative">
        <PrismicImage
          field={post.data.imagem_ilustrativa['Card e banner (tela estreita)']}
          className="md:hidden rounded-t-xl w-full"
        />
        <PrismicImage
          field={post.data.imagem_ilustrativa['Card (tela larga)']}
          className="hidden md:block rounded-t-xl w-full"
        />
      </div>
      <div className="flex flex-col gap-3 p-3 shadow-md rounded-b-xl">
        <div className="flex flex-col gap-1">
          <h3 className="font-display font-medium text-[0.8125rem] leading-[1.2188rem] tracking-[0.0094rem] text-primary">
            {post.data.titulo_do_post}
          </h3>
          <div className='min-h-[2.75rem]'>
            <PrismicRichText
              field={reducedConteudo}
              components={conteudoComponents}
            />
          </div>
          <div>
            <p className="flex gap-1 items-center h-5">
              <strong className="font-medium text-[0.8125rem] leading-[1] tracking-[0.0094rem]">
                Por:
              </strong>
              <span className="flex w-full justify-between items-center text-sm leading-[1] mt-[0.1875rem]">
                {post.data.autor}
                <time dateTime={post.first_publication_date}>
                  {formatDate(post.first_publication_date)}
                </time>
              </span>
            </p>
          </div>
        </div>
        <LinkButton field={linkField}>Ler artigo</LinkButton>
      </div>
    </div>
  );
}
