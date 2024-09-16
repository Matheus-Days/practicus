import { ImageFieldImage, RichTextField } from '@prismicio/client';
import { PrismicNextImage } from '@prismicio/next';
import { JSXMapSerializer, PrismicRichText } from '@prismicio/react';

type PageBannerProps = {
  className?: string;
  smImageField: ImageFieldImage | null | undefined;
  lgImageField: ImageFieldImage | null | undefined;
  titleField: RichTextField | null | undefined;
};

const components: JSXMapSerializer = {
  paragraph: ({ children }) => (
    <h2 className="font-display text-lg md:text-xl text-surface">{children}</h2>
  ),
  strong: ({ children }) => <b className="font-medium">{children}</b>,
  em: ({ children }) => <em className="italic">{children}</em>
};

export default function PageBanner({
  smImageField,
  lgImageField,
  titleField
}: PageBannerProps) {
  return (
    <div className="relative rounded-xl">
      <PrismicNextImage
        field={smImageField}
        className="md:hidden rounded-xl w-full"
      />
      <PrismicNextImage
        field={lgImageField}
        className="hidden md:block rounded-xl w-full"
      />
      <div className="absolute inset-0 z-20 px-3">
        <div className="flex h-full items-center">
          <PrismicRichText field={titleField} components={components} />
        </div>
      </div>
      <div className="absolute inset-0 bg-[#1E1E1E] opacity-30 rounded-xl z-10"></div>
    </div>
  );
}
