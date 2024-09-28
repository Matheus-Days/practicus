import { Content, isFilled } from '@prismicio/client';
import { SliceComponentProps } from '@prismicio/react';
import HeadingBadge from '@/app/components/HeadingBadge';
import { createClient } from '@/prismicio';
import BoundedSection from '@/app/components/BoundedSection';
import DepoimentoCard from '../../app/components/DepoimentoCard';

/**
 * Props for `SecaoDepoimentos`.
 */
export type SecaoDepoimentosProps =
  SliceComponentProps<Content.SecaoDepoimentosSlice>;

/**
 * Component for "SecaoDepoimentos" Slices.
 */
const SecaoDepoimentos = async ({
  slice
}: SecaoDepoimentosProps): Promise<JSX.Element> => {
  const client = createClient();

  const depoimentos = (
    await Promise.all(
      slice.primary.depoimento.map((item) => {
        if (
          isFilled.contentRelationship(item.depoimento) &&
          item.depoimento.uid
        )
          return client.getByUID('depoimento', item.depoimento.uid);
      })
    )
  ).filter((d) => !!d);

  return (
    <BoundedSection
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
    >
      <HeadingBadge as="h2">{slice.primary.titulo_da_secao}</HeadingBadge>
      <div className="flex flex-wrap gap-3 md:gap-6">
        {depoimentos.map((dep) => (
          <DepoimentoCard key={dep.uid} depoimento={dep} />
        ))}
      </div>
    </BoundedSection>
  );
};

export default SecaoDepoimentos;
