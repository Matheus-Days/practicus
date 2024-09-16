import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";

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
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
    >
      Placeholder component for link_de_download (variation: {slice.variation})
      Slices
    </section>
  );
};

export default LinkDeDownload;
