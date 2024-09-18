import { Metadata } from 'next';
import { JSXMapSerializer, PrismicRichText, SliceZone } from '@prismicio/react';

import { createClient } from '@/prismicio';
import { components } from '@/slices';
import HeadingBadge from '@/app/components/HeadingBadge';
import BoundedMain from '@/app/components/BoundedMain';
import {
  commonComponents,
  richTextComponents
} from '../components/sharedRichTextComponents';
import { MdOutlinePsychology, MdOutlineVisibility } from 'react-icons/md';
import { TbTarget } from 'react-icons/tb';
import { RichTextField } from '@prismicio/client';

const companyValueIcons = {
  Propósito: MdOutlinePsychology,
  Missão: TbTarget,
  Visão: MdOutlineVisibility
};

const componentsForCompanyValue: JSXMapSerializer = {
  ...commonComponents,
  paragraph: ({ children }) => (
    <p className="font-body text-base text-primary min-h-[14px] md:min-h-4">
      {children}
    </p>
  )
};

type CompanyValueProps = {
  icon: keyof typeof companyValueIcons;
  field: RichTextField | null | undefined;
};

function CompanyValue({ field, icon }: CompanyValueProps) {
  const Icon = companyValueIcons[icon];

  return (
    <div className="font-body md:bg-white rounded-xl inline-flex gap-2 md:flex-col md:items-center md:py-3 md:px-5 md:w-full md:shadow-md">
      <div className="shrink-0 inline-flex w-[3.75rem] md:w-[4.875rem] md:p-1 flex-col gap-2 items-center">
        <Icon className="h-5 w-5 m-0.5 md:h-[1.875rem] md:w-[1.875rem] md:m-[0.1875rem]" />
        <p className="text-xs md:text-base">{icon}</p>
      </div>
      <div>
        <PrismicRichText field={field} components={componentsForCompanyValue} />
      </div>
    </div>
  );
}

export default async function Page() {
  const client = createClient();
  const page = await client.getSingle('quem_somos');

  const videoUrl = (page.data.video as any).url;

  return (
    <BoundedMain>
      <HeadingBadge>{page.data.titulo}</HeadingBadge>
      <div className="flex justify-center mt-3 md:mt-6">
        <iframe
          width="100%"
          height="190"
          src={videoUrl}
          title="Vídeo institucional da Practicus Capacitação e Treinamento"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          className="max-w-[40rem] md:h-[22.5rem]"
        ></iframe>
      </div>
      <div className="mt-6">
        <PrismicRichText
          field={page.data.texto_de_apresentacao}
          components={richTextComponents}
        />
      </div>

      <hr className="border-t md:border-t-2 border-accent my-6" />

      <h3 className="md:hidden font-display text-lg font-medium mb-3">
        Propósito, missão e visão da Practicus
      </h3>

      <div className="flex flex-col md:flex-row gap-6 ">
        <CompanyValue icon="Propósito" field={page.data.proposito} />
        <CompanyValue icon="Missão" field={page.data.missao} />
        <CompanyValue icon="Visão" field={page.data.visao} />
      </div>

      <SliceZone slices={page.data.slices} components={components} />
    </BoundedMain>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const client = createClient();
  const page = await client.getSingle('quem_somos');

  return {
    title: page.data.meta_title,
    description: page.data.meta_description
  };
}
