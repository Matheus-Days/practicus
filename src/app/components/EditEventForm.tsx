'use client';

import { useState, useEffect, useCallback } from 'react';
import { updateDoc, doc } from 'firebase/firestore';
import { useFirebase } from '../hooks/firebase';
import { createClient } from '@/prismicio';
import { NumericFormat } from 'react-number-format';
import { EventData, PriceBreakpoint } from '../types/events';

interface EditEventFormProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventData | null;
  onEventUpdated: (updatedEvent: EventData) => void;
}

export default function EditEventForm({ isOpen, onClose, event, onEventUpdated }: EditEventFormProps) {
  const { firestore } = useFirebase();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prismicEvent, setPrismicEvent] = useState<any>(null);
  const [loadingPrismicEvent, setLoadingPrismicEvent] = useState(false);
  const [priceBreakpoints, setPriceBreakpoints] = useState<PriceBreakpoint[]>([
    { minQuantity: 1, priceInCents: 50000 } // R$ 500,00 por padrão
  ]);
  const [formData, setFormData] = useState({
    maxParticipants: 1,
    status: 'open' as 'open' | 'closed' | 'canceled'
  });

  const fetchPrismicEvent = useCallback(async () => {
    if (!event) return;
    
    setLoadingPrismicEvent(true);
    try {
      const client = createClient();
      const prismicEventData = await client.getByUID('evento', event.id);
      setPrismicEvent(prismicEventData);
    } catch (err) {
      console.error('Error fetching Prismic event:', err);
      setError('Erro ao carregar dados do evento no Prismic');
    } finally {
      setLoadingPrismicEvent(false);
    }
  }, [event]);

  // Carregar dados do evento quando o dialog abrir
  useEffect(() => {
    if (isOpen && event) {
      setFormData({
        maxParticipants: event.maxParticipants || 1,
        status: event.status || 'open'
      });
      
      if (event.priceBreakpoints && event.priceBreakpoints.length > 0) {
        setPriceBreakpoints(event.priceBreakpoints);
      } else {
        setPriceBreakpoints([{ minQuantity: 1, priceInCents: 50000 }]);
      }
      
      // Buscar dados do evento no Prismic
      fetchPrismicEvent();
    }
  }, [isOpen, event, fetchPrismicEvent]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!event) {
      setError('Evento não encontrado');
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
      const eventDocRef = doc(firestore, 'events', event.id);
      
      const updatedEventData = {
        maxParticipants: formData.maxParticipants,
        priceBreakpoints: sortedBreakpoints,
        status: formData.status,
        updatedAt: new Date()
      };
      
      await updateDoc(eventDocRef, updatedEventData);
      
      const updatedEvent: EventData = {
        ...event,
        ...updatedEventData
      };
      
      onEventUpdated(updatedEvent);
      handleClose();
    } catch (err) {
      setError('Erro ao atualizar evento');
      console.error('Error updating event:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      maxParticipants: 1,
      status: 'open'
    });
    setPriceBreakpoints([{ minQuantity: 1, priceInCents: 50000 }]);
    setPrismicEvent(null);
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

  if (!isOpen || !event) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-[700px] shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Editar Evento</h3>
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
            {/* Informações do evento no Prismic */}
            {loadingPrismicEvent ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-sm text-gray-600">Carregando informações do evento...</span>
              </div>
            ) : prismicEvent ? (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Informações do evento</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-blue-800">Título:</span>
                    <span className="ml-2 text-blue-700">{extractTextFromPrismicField(prismicEvent.data.nome_do_evento)}</span>
                  </div>
                  {(() => {
                    const eventDate = extractTextFromPrismicField(prismicEvent.data.data_do_evento);
                    const eventLocation = extractTextFromPrismicField(prismicEvent.data.local_do_evento);
                    const eventDescription = extractTextFromPrismicField(prismicEvent.data.descricao_do_evento);
                    const eventValue = extractTextFromPrismicField(prismicEvent.data.valor_do_evento_longo);
                    const eventWorkload = extractTextFromPrismicField(prismicEvent.data.carga_horaria);
                    const eventTime = extractTextFromPrismicField(prismicEvent.data.horario);
                    
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
                  })()}
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                <p className="text-yellow-800 text-sm">
                  Não foi possível carregar as informações do evento no Prismic.
                </p>
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
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Salvando...
                  </div>
                ) : (
                  'Salvar Alterações'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 