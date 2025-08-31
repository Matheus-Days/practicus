'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Alert,
} from '@mui/material';
import { useEventAPI } from '../../hooks/eventAPI';
import { EventData, EventDocument } from '../../types/events';
import EventForm from './EventForm';

interface EditEventDialogProps {
  open: boolean;
  onClose: () => void;
  event: EventData | null;
  onEventUpdated: (updatedEvent: EventData) => void;
}

export default function EditEventDialog({ open, onClose, event, onEventUpdated }: EditEventDialogProps) {
  const { updateEvent } = useEventAPI();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (eventData: EventDocument) => {
    if (!event) return;

    setLoading(true);
    setError(null);

    try {
      await updateEvent(event.id, eventData);

      // Criar evento atualizado para callback
      const updatedEvent: EventData = {
        ...event,
        ...eventData,
      };

      onEventUpdated(updatedEvent);
      onClose();
    } catch (err) {
      setError('Erro ao atualizar evento');
      console.error('Error updating event:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <EventForm
          initialData={event || undefined}
          onSubmit={handleSubmit}
          onCancel={handleClose}
          loading={loading}
          submitLabel={loading ? 'Salvando...' : 'Salvar'}
          title={`Editar Evento: ${event?.title}`}
        />
      </DialogContent>
    </Dialog>
  );
}
