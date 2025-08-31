'use client';

import React, { useState, useEffect } from 'react';
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Button,
  IconButton,
  Card,
  CardContent,
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { EventDocument, EventStatus, PriceBreakpoint } from '../../types/events';
import PrismicEventAutocomplete from './PrismicEventAutocomplete';
import PrismicPriceInfo from './PrismicPriceInfo';
import { PrismicEventOption } from '../../hooks/prismicAPI';

interface EventFormProps {
  initialData?: Partial<EventDocument>;
  onSubmit: (data: EventDocument) => void;
  onCancel: () => void;
  loading?: boolean;
  submitLabel?: string;
  title?: string;
  showEventIdField?: boolean;
  selectedPrismicEvent?: PrismicEventOption | null;
  onPrismicEventChange?: (event: PrismicEventOption | null) => void;
}

export default function EventForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  loading = false,
  submitLabel = 'Salvar',
  title = 'Formulário de Evento',
  showEventIdField = false,
  selectedPrismicEvent,
  onPrismicEventChange
}: EventFormProps) {
  const [formData, setFormData] = useState({
    maxParticipants: '',
    status: 'open' as EventStatus,
    priceBreakpoints: [] as PriceBreakpoint[],
    title: '',
    eventDate: '',
    eventLocal: '',
  });

  const [localSelectedPrismicEvent, setLocalSelectedPrismicEvent] = useState<PrismicEventOption | null>(selectedPrismicEvent ?? null);

  // Validação dos pricepoints
  const getPriceBreakpointsValidation = () => {
    if (formData.priceBreakpoints.length === 0) {
      return { isValid: false, message: 'Adicione pelo menos um preço' };
    }

    const quantities = formData.priceBreakpoints.map(bp => bp.minQuantity);
    const hasDuplicates = quantities.length !== new Set(quantities).size;
    const isOrdered = quantities.every((qty, i) => i === 0 || qty > quantities[i - 1]);

    if (hasDuplicates) {
      return { isValid: false, message: 'Quantidades duplicadas não são permitidas' };
    }

    if (!isOrdered) {
      return { isValid: false, message: 'Quantidades devem estar em ordem crescente' };
    }

    return { isValid: true, message: '' };
  };

  useEffect(() => {
    if (initialData) {
      setFormData({
        maxParticipants: initialData.maxParticipants?.toString() || '',
        status: initialData.status || 'open',
        priceBreakpoints: initialData.priceBreakpoints || [],
        title: initialData.title || '',
        eventDate: initialData.eventDate || '',
        eventLocal: initialData.eventLocal || '',
      });
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const eventData: EventDocument = {
      maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : 0,
      status: formData.status,
      priceBreakpoints: formData.priceBreakpoints,
      title: formData.title,
      eventDate: formData.eventDate,
      eventLocal: formData.eventLocal,
      createdAt: new Date(),
    };

    onSubmit(eventData);
  };

  const addPriceBreakpoint = () => {
    setFormData(prev => ({
      ...prev,
      priceBreakpoints: [
        ...prev.priceBreakpoints,
        { minQuantity: 1, priceInCents: 0 }
      ]
    }));
  };

  const removePriceBreakpoint = (index: number) => {
    setFormData(prev => ({
      ...prev,
      priceBreakpoints: prev.priceBreakpoints.filter((_, i) => i !== index)
    }));
  };

  const updatePriceBreakpoint = (index: number, field: keyof PriceBreakpoint, value: string) => {
    const numValue = value === '' ? 0 : parseInt(value);
    if (isNaN(numValue)) return;

    setFormData(prev => {
      const updatedBreakpoints = prev.priceBreakpoints.map((bp, i) => {
        if (i === index) {
          const updated = { ...bp, [field]: numValue };
          
          // Validação: primeiro pricepoint deve ter quantidade mínima 1
          if (i === 0 && field === 'minQuantity') {
            updated.minQuantity = 1;
          }
          
          return updated;
        }
        return bp;
      });

      // Validação: verificar se há quantidades duplicadas e se estão ordenadas
      const quantities = updatedBreakpoints.map(bp => bp.minQuantity);
      const hasDuplicates = quantities.length !== new Set(quantities).size;
      const isOrdered = quantities.every((qty, i) => i === 0 || qty > quantities[i - 1]);
      
      if (hasDuplicates || !isOrdered) {
        return prev; // Não atualiza se há duplicatas ou não está ordenado
      }

      return {
        ...prev,
        priceBreakpoints: updatedBreakpoints
      };
    });
  };

  const handlePrismicEventChange = (event: PrismicEventOption | null) => {
    setLocalSelectedPrismicEvent(event);
    onPrismicEventChange?.(event);
    if (event) {
      setFormData(prev => ({
        ...prev,
        title: event.originalTitle,
        eventDate: event.eventDate,
        eventLocal: event.eventLocal,
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Box display="flex" flexDirection="column" gap={3}>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>

        {/* Autocomplete de selecionar evento do Prismic */}
        {showEventIdField && (
          <PrismicEventAutocomplete
            value={localSelectedPrismicEvent}
            onChange={handlePrismicEventChange}
            helperText="Selecione um evento para preencher automaticamente o título"
            filterUsedEvents={true}
          />
        )}

        {/* Local do evento | Data do evento */}
        <Box display="flex" gap={2} flexWrap="wrap">
          <Box flex={1} minWidth="300px">
            <TextField
              label="Local do Evento"
              value={formData.eventLocal}
              onChange={(e) => setFormData(prev => ({ ...prev, eventLocal: e.target.value }))}
              fullWidth
              helperText="Local do evento (ex: São Paulo, SP)"
            />
          </Box>
          <Box flex={1} minWidth="300px">
            <TextField
              label="Data do Evento"
              value={formData.eventDate}
              onChange={(e) => setFormData(prev => ({ ...prev, eventDate: e.target.value }))}
              fullWidth
              helperText="Data do evento (ex: 15/12/2024)"
            />
          </Box>
        </Box>

        {/* Número de vagas | Situação */}
        <Box display="flex" gap={2} flexWrap="wrap">
          <Box flex={1} minWidth="300px">
            <TextField
              label="Número de vagas"
              type="number"
              value={formData.maxParticipants}
              onChange={(e) => setFormData(prev => ({ ...prev, maxParticipants: e.target.value }))}
              fullWidth
              required
            />
          </Box>
          <Box flex={1} minWidth="300px">
            <FormControl fullWidth>
              <InputLabel>Situação</InputLabel>
              <Select
                value={formData.status}
                label="Situação"
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as EventStatus }))}
                required
              >
                <MenuItem value="open">Inscrições abertas</MenuItem>
                <MenuItem value="closed">Inscrições encerradas</MenuItem>
                <MenuItem value="canceled">Cancelado</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* Informações de Preço do Prismic */}
        <PrismicPriceInfo event={localSelectedPrismicEvent} />

        {/* Preços por quantidade */}
        <Box>
          <Typography variant="subtitle1" gutterBottom>
            Preços por quantidade
          </Typography>
          
          <Box display="flex" justifyContent="flex-end" mb={2}>
            <Button
              startIcon={<AddIcon />}
              onClick={addPriceBreakpoint}
              variant="outlined"
              size="small"
            >
              Adicionar Preço
            </Button>
          </Box>

          {formData.priceBreakpoints.length === 0 && (
            <Typography variant="body2" color="textSecondary" textAlign="center" py={2}>
              Nenhum preço configurado. Adicione pelo menos um preço.
            </Typography>
          )}

          {formData.priceBreakpoints.length > 0 && (
            <Box sx={{ mb: 2 }}>
              {(() => {
                const validation = getPriceBreakpointsValidation();
                if (!validation.isValid) {
                  return (
                    <Typography variant="body2" color="error" sx={{ mb: 1 }}>
                      ⚠️ {validation.message}
                    </Typography>
                  );
                }
                return (
                  <Typography variant="body2" color="success.main" sx={{ mb: 1 }}>
                    ✅ Preços configurados corretamente
                  </Typography>
                );
              })()}
            </Box>
          )}

          {formData.priceBreakpoints.map((breakpoint, index) => (
            <Card key={index} variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Box display="flex" gap={2} alignItems="flex-start">
                  <TextField
                    label="Quantidade Mínima"
                    type="number"
                    value={breakpoint.minQuantity.toString()}
                    onChange={(e) => updatePriceBreakpoint(index, 'minQuantity', e.target.value)}
                    sx={{ flex: 1 }}
                    required
                    disabled={index === 0}
                    helperText={index === 0 ? "Primeira quantidade mínima é sempre 1" : ""}
                  />
                  <TextField
                    label="Preço (centavos)"
                    type="number"
                    value={breakpoint.priceInCents.toString()}
                    onChange={(e) => updatePriceBreakpoint(index, 'priceInCents', e.target.value)}
                    sx={{ flex: 1 }}
                    required
                    helperText={`R$ ${(breakpoint.priceInCents / 100).toFixed(2)}`}
                  />
                  {index > 0 && (
                    <IconButton
                      onClick={() => removePriceBreakpoint(index)}
                      color="error"
                      size="small"
                      sx={{ alignSelf: 'center' }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>

        {/* Botões */}
        <Box display="flex" gap={2} justifyContent="flex-end">
          <Button onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={loading || !getPriceBreakpointsValidation().isValid}
          >
            {submitLabel}
          </Button>
        </Box>
      </Box>
    </form>
  );
}
