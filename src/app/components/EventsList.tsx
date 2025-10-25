'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { useFirebase } from '../hooks/firebase';
import NewEventForm from './NewEventForm';
import EditEventForm from './EditEventForm';
import { EventData } from '../types/events';

export default function EventsList() {
  const { firestore } = useFirebase();
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewEventForm, setShowNewEventForm] = useState(false);
  const [showEditEventForm, setShowEditEventForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const eventsRef = collection(firestore, 'events');
      const querySnapshot = await getDocs(eventsRef);
      
      const eventsData: EventData[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as EventData));
      
      setEvents(eventsData);
    } catch (err) {
      setError('Erro ao carregar eventos');
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  }, [firestore]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Tem certeza que deseja excluir este evento?')) {
      return;
    }

    try {
      await deleteDoc(doc(firestore, 'events', eventId));
      setEvents(events.filter(event => event.id !== eventId));
    } catch (err) {
      setError('Erro ao excluir evento');
      console.error('Error deleting event:', err);
    }
  };

  const handleEditEvent = (event: EventData) => {
    setSelectedEvent(event);
    setShowEditEventForm(true);
  };

  const handleEventUpdated = (updatedEvent: EventData) => {
    setEvents(events.map(event => 
      event.id === updatedEvent.id ? updatedEvent : event
    ));
  };

  const handleEventCreated = (newEvent: EventData) => {
    setEvents([...events, newEvent]);
  };

  const getStatusDisplay = (status?: string) => {
    switch (status) {
      case 'open':
        return { text: 'Inscrições abertas', class: 'bg-green-100 text-green-800' };
      case 'closed':
        return { text: 'Inscrições encerradas', class: 'bg-yellow-100 text-yellow-800' };
      case 'canceled':
        return { text: 'Cancelado', class: 'bg-red-100 text-red-800' };
      default:
        return { text: 'Desconhecido', class: 'bg-gray-100 text-gray-800' };
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">{error}</p>
        <button 
          onClick={fetchEvents}
          className="mt-2 text-red-600 hover:text-red-800 underline"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Gerenciar Eventos</h2>
              <p className="text-sm text-gray-600 mt-1">
                {events.length} evento{events.length !== 1 ? 's' : ''} encontrado{events.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={() => setShowNewEventForm(true)}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Adicionar Evento
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID do Evento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Participantes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{event.id}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      getStatusDisplay(event.status).class
                    }`}>
                      {getStatusDisplay(event.status).text}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditEvent(event)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {events.length === 0 && (
          <div className="px-6 py-8 text-center">
            <p className="text-gray-500">Nenhum evento encontrado.</p>
          </div>
        )}
      </div>
      
      <NewEventForm
        isOpen={showNewEventForm}
        onClose={() => setShowNewEventForm(false)}
        onEventCreated={handleEventCreated}
        existingEvents={events}
      />
      
      <EditEventForm
        isOpen={showEditEventForm}
        onClose={() => setShowEditEventForm(false)}
        event={selectedEvent}
        onEventUpdated={handleEventUpdated}
      />
    </>
  );
} 