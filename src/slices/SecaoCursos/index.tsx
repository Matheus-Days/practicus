import { Content } from '@prismicio/client';
import { SliceComponentProps } from '@prismicio/react';
import HeadingBadge from '../../app/components/HeadingBadge';
import { PrismicNextLink } from '@prismicio/next';
import BoundedImage from '../../app/components/BoundedImage';
import BoundedSection from '../../app/components/BoundedSection';
import LinkButton from '../../app/components/LinkButton';

/**
 * Props for `SecaoCursos`.
 */
export type SecaoCursosProps = SliceComponentProps<Content.SecaoCursosSlice>;

/**
 * Component for "SecaoCursos" Slices.
 */
const SecaoCursos = ({ slice }: SecaoCursosProps): JSX.Element => {
  return (
    <BoundedSection
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
    >
      <HeadingBadge>{slice.primary.titulo_da_secao}</HeadingBadge>

      <div className="flex justify-center w-full">
        <div className="relative w-full max-w-[70.5rem]">
          <PrismicNextLink field={slice.primary.link_do_botao} className="flex w-full">
            <BoundedImage
              field={slice.primary.imagem_de_fundo['Telas estreitas']}
              className="md:hidden"
            />
            <BoundedImage
              field={slice.primary.imagem_de_fundo['Telas largas']}
              className="hidden md:block rounded-[1.75rem]"
            />
          </PrismicNextLink>

          <div className="absolute bottom-3 left-3 flex flex-col gap-[0.625rem] w-fit">
            <h2 className="text-xl md:text-2xl font-medium">
              Cursos e Módulos
            </h2>
            <LinkButton
              field={slice.primary.link_do_botao}
              className="hidden md:block"
            >
              Saiba mais
            </LinkButton>
          </div>
        </div>
      </div>
    </BoundedSection>
  );
};

export default SecaoCursos;
