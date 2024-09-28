import { Content } from '@prismicio/client';
import { PrismicNextLink } from '@prismicio/next';
import { SliceComponentProps } from '@prismicio/react';
import { MdOutlineFileDownload } from 'react-icons/md';

/**
 * Props for `LinkDeDownload`.
 */
export type LinkDeDownloadProps =
  SliceComponentProps<Content.LinkDeDownloadSlice>;

/**
 * Component for "LinkDeDownload" Slices.
 */
const LinkDeDownload = ({ slice }: LinkDeDownloadProps): JSX.Element => {
  return (
    <span
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
    >
      <PrismicNextLink
        field={slice.primary.arquivo}
        className="flex gap-2 items-center max-w-[28.5rem] border-b border-b-accent"
      >
        <div className="p-3">
          <MdOutlineFileDownload className="size-6" />
        </div>
        <span className="font-body font-medium text-sm md:text-lg">
          {slice.primary.nome_do_arquivo}
        </span>
      </PrismicNextLink>
    </span>
  );
};

export default LinkDeDownload;
