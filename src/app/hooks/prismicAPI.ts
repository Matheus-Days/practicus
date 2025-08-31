import { useState, useEffect } from 'react';
import { createClient } from '../../prismicio';
import { EventoDocument } from '../../../prismicio-types';
import { asText } from '@prismicio/client';
import { collection, getDocs } from 'firebase/firestore';
import { useFirebase } from './firebase';
import { formatDate } from '../utils';

// Função auxiliar para extrair texto de campos Rich Text do Prismic
const extractTextFromPrismicField = (field: any): string => {
  if (!field || !Array.isArray(field)) return '';
  return field.map((item: any) => item.text || '').join(' ').trim();
};

export interface PrismicEventOption {
  uid: string;
  title: string;
  originalTitle: string;
  date?: string;
  location?: string;
  eventDate: string;
  eventLocal: string;
  priceShort?: string;
  priceLong?: string;
}

export const usePrismicEvents = (filterUsedEvents: boolean = false) => {
  const [events, setEvents] = useState<PrismicEventOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { firestore } = useFirebase();

  const fetchFirestoreEvents = async (): Promise<string[]> => {
    try {
      const eventsQuery = collection(firestore, "events");
      const eventsSnapshot = await getDocs(eventsQuery);
      const usedPrismicUids: string[] = [];
      
      eventsSnapshot.forEach((doc) => {
        // O ID do documento no Firestore é o próprio UID do Prismic
        usedPrismicUids.push(doc.id);
      });
      
      return usedPrismicUids;
    } catch (err) {
      console.error('Erro ao buscar eventos do Firestore:', err);
      return [];
    }
  };

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);

    try {
      const client = createClient();
      const response = await client.getAllByType('evento', {
        orderings: [
          { field: 'my.evento.data_do_evento', direction: 'desc' }
        ]
      });

      let usedPrismicUids: string[] = [];
      
      // Se filtro estiver ativado, buscar UIDs já utilizados no Firestore
      if (filterUsedEvents) {
        usedPrismicUids = await fetchFirestoreEvents();
      }

      const eventOptions: PrismicEventOption[] = response
        .map((event: EventoDocument) => {
          const baseTitle = asText(event.data.nome_do_evento) || 'Evento sem título';
          // Usar a função formatDate do utils que já trata o timezone corretamente
          const date = event.data.data_do_evento ? formatDate(event.data.data_do_evento, 'DD/MM/YYYY') : undefined;
          const location = event.data.local_do_evento_curto || undefined;
          
          // Criar título único incluindo data e local quando disponível
          let uniqueTitle = baseTitle;
          if (date) {
            uniqueTitle += ` (${date})`;
          }
          if (location) {
            uniqueTitle += ` - ${location}`;
          }
          
          return {
            uid: event.uid,
            title: uniqueTitle,
            originalTitle: baseTitle,
            date,
            location,
            eventDate: date || '',
            eventLocal: location || '',
            priceShort: event.data.valor_do_evento || '',
            priceLong: extractTextFromPrismicField(event.data.valor_do_evento_longo),
          };
        })
        // Filtrar eventos já utilizados se o filtro estiver ativado
        .filter((event) => !filterUsedEvents || !usedPrismicUids.includes(event.uid));

      // Remover duplicatas baseado no UID
      const uniqueEvents = eventOptions.filter((event, index, self) => 
        index === self.findIndex(e => e.uid === event.uid)
      );

      setEvents(uniqueEvents);
    } catch (err) {
      setError('Erro ao buscar eventos do Prismic');
      console.error('Error fetching Prismic events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [filterUsedEvents, firestore]);

  return {
    events,
    loading,
    error,
    refetch: fetchEvents,
  };
};
