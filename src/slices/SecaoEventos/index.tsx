import { Content, isFilled } from '@prismicio/client';
import { SliceComponentProps } from '@prismicio/react';
import HeadingBadge from '../../app/components/HeadingBadge';
import CourseCard, { EventoCardData } from '../../app/components/CourseCard';
import { createClient } from '@/prismicio';
import BoundedSection from '../../app/components/BoundedSection';

/**
 * Props for `SecaoEventos`.
 */
export type SecaoEventosProps = SliceComponentProps<Content.SecaoEventosSlice>;

/**
 * Component for "SecaoEventos" Slices.
 */
const SecaoEventos = async ({
  slice
}: SecaoEventosProps): Promise<JSX.Element> => {
  const client = createClient();

  let eventos = (
    await Promise.all(
      slice.primary.eventos.map((item) => {
        if (isFilled.contentRelationship(item.evento) && item.evento.uid)
          return client.getByUID('evento', item.evento.uid);
      })
    )
  )
    .filter((e) => !!e)
    .map((e) => {
      const evento: EventoCardData = {
        __typename: 'evento',
        date: e.data.data_do_evento,
        link: e.data.link_do_evento,
        location: e.data.local_do_evento,
        picture: {
          small: e.data.imagem_ilustrativa['Tela estreita'],
          large: e.data.imagem_ilustrativa['Tela larga']
        },
        price: e.data.valor_do_evento,
        title: e.data.nome_do_evento,
        uid: e.uid
      };
      return evento;
    });

    eventos = [...eventos, ...eventos/* , ...eventos */];

  return (
    <BoundedSection
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
    >
      <HeadingBadge>{slice.primary.titulo_da_secao}</HeadingBadge>

      {eventos.length > 0 ? (
        <div className="flex flex-col max-w-[70.5rem] md:flex-row justify-center w-full gap-4 md:gap-6">
          {eventos.map((evento) => (
            <CourseCard key={evento.uid} data={evento} className="w-full min-w-[20.5rem] min-h-[15.25rem] md:min-h-[18.375rem]" />
          ))}
        </div>
      ) : (
        <p className="font-body">Nenhum evento em aberto.</p>
      )}
    </BoundedSection>
  );
};

export default SecaoEventos;
