'use client';

import { useState, useEffect } from 'react';
import { setDoc, doc } from 'firebase/firestore';
import { useFirebase } from '../hooks/firebase';
import { createClient } from '@/prismicio';
import { NumericFormat } from 'react-number-format';
import { EventData, PriceBreakpoint } from '../types/events';

interface NewEventFormProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated: (event: EventData) => void;
  existingEvents: EventData[]; // Nova prop para receber eventos existentes
}

export default function NewEventForm({ isOpen, onClose, onEventCreated, existingEvents }: NewEventFormProps) {
  const { firestore } = useFirebase();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prismicEvents, setPrismicEvents] = useState<any[]>([]);
  const [loadingPrismicEvents, setLoadingPrismicEvents] = useState(false);
  const [selectedPrismicEvent, setSelectedPrismicEvent] = useState<string>('');
  const [priceBreakpoints, setPriceBreakpoints] = useState<PriceBreakpoint[]>([
    { minQuantity: 1, priceInCents: 50000 } // R$ 500,00 por padrão
  ]);
  const [formData, setFormData] = useState({
    title: '',
    maxParticipants: 1,
    status: 'open'
  });

  // Buscar eventos do Prismic quando o dialog abrir
  useEffect(() => {
    if (isOpen && prismicEvents.length === 0) {
      fetchPrismicEvents();
    }
  }, [isOpen, prismicEvents.length]);

  const fetchPrismicEvents = async () => {
    setLoadingPrismicEvents(true);
    try {
      const client = createClient();
      const response = await client.getAllByType('evento', {
        orderings: [
          { field: 'my.evento.first_publication_date', direction: 'desc' }
        ]
      });
      
      // Filtrar eventos do Prismic que já não foram criados no Firebase
      const existingEventIds = existingEvents.map(event => event.id);
      const availablePrismicEvents = response.filter(prismicEvent => 
        !existingEventIds.includes(prismicEvent.uid)
      );
      
      setPrismicEvents(availablePrismicEvents);
    } catch (err) {
      console.error('Error fetching Prismic events:', err);
      setError('Erro ao carregar eventos do Prismic');
    } finally {
      setLoadingPrismicEvents(false);
    }
  };

  // Função para converter BRL para centavos
  const parseCurrency = (value: string): number => {
    // Remove R$, espaços e outros caracteres
    let cleanValue = value.replace(/R\$\s*/g, '').replace(/\s/g, '');
    
    // Se não há vírgula, assume que é um valor inteiro em reais
    if (!cleanValue.includes(',')) {
      const numValue = parseFloat(cleanValue);
      return isNaN(numValue) ? 0 : Math.round(numValue * 100);
    }
    
    // Se há vírgula, assume formato brasileiro
    // Remove pontos dos milhares e substitui vírgula por ponto
    cleanValue = cleanValue.replace(/\./g, '').replace(',', '.');
    const numValue = parseFloat(cleanValue);
    return isNaN(numValue) ? 0 : Math.round(numValue * 100);
  };

  const handlePrismicEventChange = (eventUid: string) => {
    setSelectedPrismicEvent(eventUid);
    
    if (eventUid) {
      const selectedEvent = prismicEvents.find(event => event.uid === eventUid);
      if (selectedEvent) {
        setFormData({
          title: extractTextFromPrismicField(selectedEvent.data.nome_do_evento) || selectedEvent.uid || '',
          maxParticipants: 1,
          status: 'open'
        });
      }
    } else {
      setFormData({
        title: '',
        maxParticipants: 1,
        status: 'open'
      });
    }
  };

  const addPriceBreakpoint = () => {
    const newBreakpoint: PriceBreakpoint = {
      minQuantity: priceBreakpoints.length + 1,
      priceInCents: priceBreakpoints[priceBreakpoints.length - 1].priceInCents
    };
    setPriceBreakpoints([...priceBreakpoints, newBreakpoint]);
  };

  const removePriceBreakpoint = (index: number) => {
    if (priceBreakpoints.length > 1) {
      const newBreakpoints = priceBreakpoints.filter((_, i) => i !== index);
      // Reajustar quantidades mínimas
      const adjustedBreakpoints = newBreakpoints.map((bp, i) => ({
        ...bp,
        minQuantity: i + 1
      }));
      setPriceBreakpoints(adjustedBreakpoints);
    }
  };

  const updatePriceBreakpoint = (index: number, field: 'minQuantity' | 'priceInCents', value: string) => {
    const newBreakpoints = [...priceBreakpoints];
    if (field === 'minQuantity') {
      newBreakpoints[index].minQuantity = parseInt(value) || 1;
    } else {
      newBreakpoints[index].priceInCents = parseCurrency(value);
    }
    setPriceBreakpoints(newBreakpoints);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPrismicEvent) {
      setError('Selecione um evento');
      return;
    }

    if (!formData.title.trim()) {
      setError('Selecione um evento');
      return;
    }

    // Validar breakpoints
    if (priceBreakpoints.length === 0) {
      setError('Adicione pelo menos um breakpoint de preço');
      return;
    }

    // Ordenar breakpoints por quantidade mínima
    const sortedBreakpoints = [...priceBreakpoints].sort((a, b) => a.minQuantity - b.minQuantity);

    setLoading(true);
    setError(null);

    try {
      const eventDocRef = doc(firestore, 'events', selectedPrismicEvent);
      
      const eventData = {
        title: formData.title,
        maxParticipants: formData.maxParticipants,
        priceBreakpoints: sortedBreakpoints,
        status: formData.status,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await setDoc(eventDocRef, eventData);
      
      const newEvent: EventData = {
        id: selectedPrismicEvent,
        ...eventData,
        status: formData.status as EventData['status']
      };
      
      onEventCreated(newEvent);
      handleClose();
    } catch (err) {
      setError('Erro ao criar evento');
      console.error('Error creating event:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      maxParticipants: 1,
      status: 'open'
    });
    setPriceBreakpoints([{ minQuantity: 1, priceInCents: 50000 }]);
    setSelectedPrismicEvent('');
    setError(null);
    setLoading(false);
    onClose();
  };

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const extractTextFromPrismicField = (field: any): string => {
    if (typeof field === 'string') {
      return field;
    }
    if (field && typeof field === 'object' && field.text) {
      return field.text;
    }
    if (field && typeof field === 'object' && Array.isArray(field)) {
      return field.map(item => extractTextFromPrismicField(item)).join(' ');
    }
    return '';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-[700px] shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Adicionar Novo Evento</h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Evento *
              </label>
              {loadingPrismicEvents ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-sm text-gray-600">Carregando eventos...</span>
                </div>
              ) : (
                <select
                  value={selectedPrismicEvent}
                  onChange={(e) => handlePrismicEventChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={loading}
                >
                  <option value="">Selecione um evento</option>
                  {prismicEvents.map((event) => (
                    <option key={event.uid} value={event.uid}>
                      {extractTextFromPrismicField(event.data.nome_do_evento) || event.uid}
                    </option>
                  ))}
                </select>
              )}
              {prismicEvents.length === 0 && !loadingPrismicEvents && (
                <p className="text-sm text-gray-500 mt-1">
                  {existingEvents.length > 0 
                    ? "Todos os eventos do Prismic já foram criados no sistema."
                    : "Nenhum evento disponível no Prismic"
                  }
                </p>
              )}
            </div>

            {selectedPrismicEvent && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Informações do evento selecionado</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-blue-800">Título:</span>
                    <span className="ml-2 text-blue-700">{formData.title}</span>
                  </div>
                  {(() => {
                    const selectedEvent = prismicEvents.find(event => event.uid === selectedPrismicEvent);
                    if (selectedEvent) {
                      const eventDate = extractTextFromPrismicField(selectedEvent.data.data_do_evento);
                      const eventLocation = extractTextFromPrismicField(selectedEvent.data.local_do_evento);
                      const eventDescription = extractTextFromPrismicField(selectedEvent.data.descricao_do_evento);
                      const eventValue = extractTextFromPrismicField(selectedEvent.data.valor_do_evento_longo);
                      const eventWorkload = extractTextFromPrismicField(selectedEvent.data.carga_horaria);
                      const eventTime = extractTextFromPrismicField(selectedEvent.data.horario);
                      
                      const formatDate = (dateString: string) => {
                        if (!dateString) return '';
                        try {
                          // Se a data vem no formato YYYY-MM-DD, precisamos tratá-la como timezone local
                          // em vez de UTC para evitar problemas de conversão
                          if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
                            // Criar a data no timezone local adicionando T00:00:00
                            const localDate = new Date(dateString + 'T00:00:00');
                            return localDate.toLocaleDateString('pt-BR', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            });
                          } else {
                            // Para outros formatos, usar o comportamento padrão
                            const date = new Date(dateString);
                            return date.toLocaleDateString('pt-BR', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            });
                          }
                        } catch {
                          return dateString;
                        }
                      };
                      
                      return (
                        <>
                          {eventDate && (
                            <div>
                              <span className="font-medium text-blue-800">Data:</span>
                              <span className="ml-2 text-blue-700">{formatDate(eventDate)}</span>
                            </div>
                          )}
                          {eventTime && (
                            <div>
                              <span className="font-medium text-blue-800">Horário:</span>
                              <span className="ml-2 text-blue-700">{eventTime}</span>
                            </div>
                          )}
                          {eventLocation && (
                            <div>
                              <span className="font-medium text-blue-800">Local:</span>
                              <span className="ml-2 text-blue-700">{eventLocation}</span>
                            </div>
                          )}
                          {eventWorkload && (
                            <div>
                              <span className="font-medium text-blue-800">Carga Horária:</span>
                              <span className="ml-2 text-blue-700">{eventWorkload}</span>
                            </div>
                          )}
                          {eventValue && (
                            <div>
                              <span className="font-medium text-blue-800">Investimento:</span>
                              <span className="ml-2 text-blue-700">{eventValue}</span>
                            </div>
                          )}
                          {eventDescription && (
                            <div>
                              <span className="font-medium text-blue-800">Descrição:</span>
                              <span className="ml-2 text-blue-700">{eventDescription}</span>
                            </div>
                          )}
                        </>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Máximo de Participantes *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.maxParticipants}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1;
                    handleInputChange('maxParticipants', Math.max(1, value));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                >
                  <option value="open">Inscrições abertas</option>
                  <option value="closed">Inscrições encerradas</option>
                  <option value="canceled">Cancelado</option>
                </select>
              </div>
            </div>

            {/* Seção de Breakpoints de Preço */}
            <div>
              <div className="flex mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Configuração de níveis de preço *
                </label>
              </div>
              
              <div className="space-y-3">
                {priceBreakpoints.map((breakpoint, index) => (
                  <div key={index} className="flex items-end space-x-3 p-3 border border-gray-200 rounded-md bg-gray-50">
                    { index > 0 && (
                      <div className="flex-1">
                      <label className="block text-xs text-gray-600 mb-1">
                        A partir de quantas inscrições
                      </label>
                      <input
                        type="number"
                        min="2"
                        value={breakpoint.minQuantity}
                        onChange={(e) => updatePriceBreakpoint(index, 'minQuantity', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                        disabled={loading}
                      />
                    </div>
                    ) }
                    
                    <div className="flex-1">
                      <label className="block text-xs text-gray-600 mb-1">
                        Valor por inscrição
                      </label>
                      <NumericFormat
                        value={breakpoint.priceInCents / 100}
                        onValueChange={(values) => {
                          const { value } = values;
                          updatePriceBreakpoint(index, 'priceInCents', value.toString());
                        }}
                        thousandSeparator="."
                        decimalSeparator=","
                        prefix="R$ "
                        decimalScale={2}
                        fixedDecimalScale
                      />
                    </div>
                   
                    {priceBreakpoints.length > 1 && index > 0 && (
                      <button
                        type="button"
                        onClick={() => removePriceBreakpoint(index)}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                        disabled={loading}
                        title="Remover breakpoint"
                      >
                        Remover
                      </button>
                    )}

{index === priceBreakpoints.length - 1 && (
                      <button
                  type="button"
                  onClick={addPriceBreakpoint}
                  className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  disabled={loading}
                >
                  + Adicionar nível de preço
                </button>
                    ) }
                  </div>
                ))}
              </div>
              
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <h5 className="text-sm font-medium text-blue-900 mb-2">Como funciona:</h5>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• O primeiro nível de preço define o valor inicial para todas as inscrições</li>
                  <li>• Níveis de preço adicionais criam descontos por quantidade</li>
                  <li>• Exemplo: R$ 500 inicial, R$ 400 a partir de 4 inscrições</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !selectedPrismicEvent}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Criando...
                  </div>
                ) : (
                  'Criar Evento'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 