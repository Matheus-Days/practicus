'use client';

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Divider,
} from '@mui/material';
import { Info as InfoIcon } from '@mui/icons-material';
import { PrismicEventOption } from '../../hooks/prismicAPI';

interface PrismicPriceInfoProps {
  event: PrismicEventOption | null;
}

export default function PrismicPriceInfo({ event }: PrismicPriceInfoProps) {
  if (!event) {
    return null;
  }

  const hasPriceInfo = event.priceShort || event.priceLong;

  if (!hasPriceInfo) {
    return (
      <Card sx={{ 
        backgroundColor: '#f5f5f5', 
        border: '1px solid #e0e0e0',
        mb: 2 
      }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <InfoIcon color="action" fontSize="small" />
            <Typography variant="subtitle2" color="textSecondary">
              Informações de preço do evento
            </Typography>
          </Box>
          <Typography variant="body2" color="textSecondary">
            Nenhuma informação de preço disponível para este evento.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ 
      backgroundColor: '#e3f2fd', 
      border: '1px solid #2196f3',
      mb: 2 
    }}>
      <CardContent>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <InfoIcon color="primary" fontSize="small" />
          <Typography variant="subtitle2" color="primary" fontWeight="medium">
            Informações de preço do evento
          </Typography>
          <Chip 
            label="Referência" 
            size="small" 
            color="primary" 
            variant="outlined"
          />
        </Box>

        {event.priceShort && (
          <Box mb={2}>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Preço resumido:
            </Typography>
            <Typography variant="body1" fontWeight="medium" color="primary">
              {event.priceShort}
            </Typography>
          </Box>
        )}

        {event.priceLong && (
          <>
            {event.priceShort && <Divider sx={{ my: 1 }} />}
            <Box>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Detalhamento de preços:
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  whiteSpace: 'pre-line',
                  backgroundColor: 'rgba(33, 150, 243, 0.1)',
                  p: 1,
                  borderRadius: 1,
                  border: '1px solid rgba(33, 150, 243, 0.2)'
                }}
              >
                {event.priceLong}
              </Typography>
            </Box>
          </>
        )}

        <Box mt={2}>
          <Typography variant="caption" color="textSecondary">
            💡 Use essas informações como referência para configurar os preços por quantidade abaixo.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
