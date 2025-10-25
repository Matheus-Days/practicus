'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Alert,
} from '@mui/material';
import { useEventAPI } from '../../hooks/eventAPI';
import { EventDocument } from '../../types/events';
import EventForm from './EventForm';
import { PrismicEventOption } from '../../hooks/prismicAPI';

interface CreateEventDialogProps {
  open: boolean;
  onClose: () => void;
  onEventCreated: () => void;
}

export default function CreateEventDialog({ open, onClose, onEventCreated }: CreateEventDialogProps) {
  const { createEvent } = useEventAPI();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPrismicEvent, setSelectedPrismicEvent] = useState<PrismicEventOption | null>(null);

  const handleSubmit = async (eventData: EventDocument) => {
    if (!selectedPrismicEvent) {
      setError('Selecione um evento do Prismic');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createEvent(selectedPrismicEvent.uid, eventData);
      onEventCreated();
      onClose();
      setSelectedPrismicEvent(null);
    } catch (err) {
      setError('Erro ao criar evento. Verifique se o ID já não existe.');
      console.error('Error creating event:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrismicEventChange = (event: PrismicEventOption | null) => {
    setSelectedPrismicEvent(event);
    setError(null);
  };

  const handleClose = () => {
    if (!loading) {
      setError(null);
      setSelectedPrismicEvent(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Criar Novo Evento</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <EventForm
          onSubmit={handleSubmit}
          onCancel={handleClose}
          loading={loading}
          submitLabel={loading ? 'Criando...' : 'Criar Evento'}
          title="Informações do Evento"
          showEventIdField={true}
          selectedPrismicEvent={selectedPrismicEvent}
          onPrismicEventChange={handlePrismicEventChange}
        />
      </DialogContent>
    </Dialog>
  );
}
