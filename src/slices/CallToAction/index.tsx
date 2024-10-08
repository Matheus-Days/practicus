import { Content, isFilled } from '@prismicio/client';
import {
  JSXMapSerializer,
  PrismicRichText,
  SliceComponentProps
} from '@prismicio/react';
import BoundedSection from '../../app/components/BoundedSection';
import LinkButton from '../../app/components/LinkButton';

/**
 * Props for `CallToAction`.
 */
export type CallToActionProps = SliceComponentProps<Content.CallToActionSlice>;

const components: JSXMapSerializer = {
  paragraph: ({ children }) => (
    <p className="font-display text-lg md:text-2xl text-primary text-center md:text-left">
      {children}
    </p>
  ),
  strong: ({ children }) => <b className="font-medium">{children}</b>,
  em: ({ children }) => <em className="italic">{children}</em>
};

/**
 * Component for "CallToAction" Slices.
 */
const CallToAction = ({ slice }: CallToActionProps): JSX.Element => {
  return (
    <BoundedSection
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
      className="gap-3 md:gap-3"
    >
      <div>
        <PrismicRichText
          field={slice.primary.texto_cta}
          components={components}
        />
      </div>
      {slice.primary.texto_do_botao_cta &&
        isFilled.link(slice.primary.link_do_cta) && (
          <LinkButton
            field={slice.primary.link_do_cta}
            className="w-[16.125rem] text-lg"
          >
            {slice.primary.texto_do_botao_cta}
          </LinkButton>
        )}
    </BoundedSection>
  );
};

export default CallToAction;
