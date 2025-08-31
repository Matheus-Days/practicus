'use client';

import React, { useState } from 'react';
import {
  Autocomplete,
  TextField,
  CircularProgress,
  Box,
  Typography,
  Chip,
} from '@mui/material';
import { usePrismicEvents, PrismicEventOption } from '../../hooks/prismicAPI';

interface PrismicEventAutocompleteProps {
  value: PrismicEventOption | null;
  onChange: (event: PrismicEventOption | null) => void;
  error?: boolean;
  helperText?: string;
  filterUsedEvents?: boolean; // Novo prop para controlar o filtro
}

export default function PrismicEventAutocomplete({
  value,
  onChange,
  error = false,
  helperText,
  filterUsedEvents = true, // Por padrão, filtrar eventos já utilizados
}: PrismicEventAutocompleteProps) {
  const { events, loading, error: fetchError } = usePrismicEvents(filterUsedEvents);
  const [inputValue, setInputValue] = useState('');

  const handleChange = (event: any, newValue: PrismicEventOption | null) => {
    onChange(newValue);
  };

  const handleInputChange = (event: any, newInputValue: string) => {
    setInputValue(newInputValue);
  };

  const getOptionLabel = (option: PrismicEventOption) => {
    return option.title;
  };

  const renderOption = (props: any, option: PrismicEventOption) => (
    <Box component="li" {...props} key={option.uid}>
      <Box sx={{ width: '100%' }}>
        <Typography variant="body1" fontWeight="medium">
          {option.title}
        </Typography>
        <Box display="flex" gap={1} mt={0.5}>
          {option.date && (
            <Chip
              label={option.date}
              size="small"
              variant="outlined"
              color="primary"
            />
          )}
          {option.location && (
            <Chip
              label={option.location}
              size="small"
              variant="outlined"
              color="secondary"
            />
          )}
        </Box>
      </Box>
    </Box>
  );

  return (
    <Autocomplete
      value={value}
      onChange={handleChange}
      inputValue={inputValue}
      onInputChange={handleInputChange}
      options={events}
      getOptionLabel={getOptionLabel}
      renderOption={renderOption}
      loading={loading}
      filterOptions={(options, { inputValue }) => {
        const filtered = options.filter((option) =>
          option.title.toLowerCase().includes(inputValue.toLowerCase()) ||
          option.location?.toLowerCase().includes(inputValue.toLowerCase())
        );
        return filtered;
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Selecionar Evento do Prismic"
          error={error || !!fetchError}
          helperText={helperText || fetchError}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      noOptionsText="Nenhum evento encontrado"
      loadingText="Carregando eventos..."
      clearOnBlur={false}
      selectOnFocus
      clearOnEscape
    />
  );
}
