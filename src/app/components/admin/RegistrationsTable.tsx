'use client';

import React, { ReactElement, useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Box,
  LinearProgress,
  Alert,
  Menu,
  MenuItem,
  ListItemIcon,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Block as BlockIcon,
  Pending as PendingIcon,
  ShoppingCart as ShoppingCartIcon,
} from '@mui/icons-material';
import { CircularProgress } from '@mui/material';
import { useAdminContext } from '../../contexts/AdminContext';
import { RegistrationData } from '../../hooks/registrationAPI';
import { RegistrationStatus } from '../../api/registrations/registration.types';
import CheckoutDetailsDialog from './CheckoutDetailsDialog';

export default function RegistrationsTable() {
  const {
    eventRegistrations,
    eventCheckouts,
    loadingRegistrations,
    updateRegistrationStatus,
    selectedEvent,
    getCheckoutById,
    loadingRegistrationStatusUpdate,
  } = useAdminContext();

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [selectedRegistration, setSelectedRegistration] = React.useState<RegistrationData | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
  const [selectedCheckoutId, setSelectedCheckoutId] = useState<string | null>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, registration: RegistrationData) => {
    setAnchorEl(event.currentTarget);
    setSelectedRegistration(registration);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRegistration(null);
  };

  const handleStatusChange = async (status: RegistrationStatus) => {
    if (selectedRegistration && !loadingRegistrationStatusUpdate) {
      handleMenuClose();
      await updateRegistrationStatus(selectedRegistration.id, status);
    }
  };

  const handleActivateRegistration = async () => {
    if (!selectedRegistration) return;
    
    // Buscar o checkout associado à inscrição
    const checkout = eventCheckouts.find(c => c.id === selectedRegistration.checkoutId);
    
    if (!checkout) {
      return;
    }
    
    // Determinar o novo status baseado no status do checkout
    const newStatus: RegistrationStatus = checkout.status === 'pending' ? 'pending' : 'ok';
    
    await handleStatusChange(newStatus);
  };

  const handleCancelRegistration = async () => {
    await handleStatusChange('cancelled');
  };

  // Função para verificar se o botão "Ativar inscrição" deve estar habilitado
  const canActivateRegistration = (registration: RegistrationData) => {
    const checkout = eventCheckouts.find(c => c.id === registration.checkoutId);
    
    if (!checkout) return false;
    
    // Não pode ativar se o checkout for deleted ou refunded
    if (checkout.status === 'deleted' || checkout.status === 'refunded') {
      return false;
    }
    
    // Não pode ativar se a inscrição já estiver pending ou ok
    if (registration.status === 'pending' || registration.status === 'ok') {
      return false;
    }
    
    return true;
  };

  // Função para verificar se o botão "Desativar inscrição" deve estar habilitado
  const canCancelRegistration = (registration: RegistrationData) => {
    const checkout = eventCheckouts.find(c => c.id === registration.checkoutId);
    
    // Não pode desativar se a inscrição já estiver cancelada
    if (registration.status === 'cancelled') {
      return false;
    }
    
    // Não pode desativar se o checkout for deleted ou refunded
    if (checkout && (checkout.status === 'deleted' || checkout.status === 'refunded')) {
      return false;
    }
    
    return true;
  };

  const handleStatusFilterChange = (event: any) => {
    setStatusFilter(event.target.value);
  };

  const handleViewCheckout = (checkoutId: string) => {
    setSelectedCheckoutId(checkoutId);
    setCheckoutDialogOpen(true);
  };

  const handleCheckoutDialogClose = () => {
    setCheckoutDialogOpen(false);
    setSelectedCheckoutId(null);
  };

  // Filtrar inscrições baseado no status selecionado
  const filteredRegistrations = useMemo(() => {
    if (statusFilter === 'all') {
      return eventRegistrations;
    }
    return eventRegistrations.filter(registration => registration.status === statusFilter);
  }, [eventRegistrations, statusFilter]);

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'ok':
        return { text: 'Confirmada', color: 'success' as const, icon: <CheckCircleIcon /> };
      case 'cancelled':
        return { text: 'Cancelada', color: 'error' as const, icon: <CancelIcon /> };
      case 'invalid':
        return { text: 'Inválida', color: 'error' as const, icon: <BlockIcon /> };
      case 'pending':
        return { text: 'Pendente', color: 'warning' as const, icon: <PendingIcon /> };
      default:
        return { text: 'Desconhecido', color: 'default' as const, icon: null };
    }
  };

  const formatDate = (date: any) => {
    if (!date) return '-';
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(dateObj);
  };

  if (loadingRegistrations) {
    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">
          Inscrições ({filteredRegistrations.length})
        </Typography>
        
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="status-filter-label">Situação</InputLabel>
          <Select
            labelId="status-filter-label"
            value={statusFilter}
            label="Situação"
            onChange={handleStatusFilterChange}
          >
            <MenuItem value="all">Todas</MenuItem>
            <MenuItem value="ok">Confirmadas</MenuItem>
            <MenuItem value="cancelled">Canceladas</MenuItem>
            <MenuItem value="invalid">Inválidas</MenuItem>
            <MenuItem value="pending">Pendentes</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Nome completo</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
              <TableCell>Telefone</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Situação</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Data de inscrição</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRegistrations.map((registration) => {
              const statusDisplay = getStatusDisplay(registration.status);
              return (
                <TableRow key={registration.id} hover>
                  <TableCell>
                    <Typography variant="body2">
                      {registration.fullName}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {registration.email}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {registration.phone || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={statusDisplay.icon as ReactElement}
                      label={statusDisplay.text}
                      color={statusDisplay.color}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(registration.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Box display="flex" gap={1} justifyContent="center">
                      {registration.checkoutId && (
                        <Tooltip title="Ver aquisição">
                          <IconButton
                            size="small"
                            onClick={() => handleViewCheckout(registration.checkoutId!)}
                            color="primary"
                          >
                            <ShoppingCartIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Mais ações">
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, registration)}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {filteredRegistrations.length === 0 && (
        <Box textAlign="center" py={4}>
          <Typography variant="body1" color="textSecondary">
            {statusFilter === 'all' 
              ? 'Nenhuma inscrição encontrada para este evento.'
              : `Nenhuma inscrição com situação "${getStatusDisplay(statusFilter).text}" encontrada.`
            }
          </Typography>
        </Box>
      )}

      {/* Menu de ações */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem 
          onClick={handleActivateRegistration}
          disabled={loadingRegistrationStatusUpdate || !selectedRegistration || !canActivateRegistration(selectedRegistration)}
        >
          <ListItemIcon>
            {loadingRegistrationStatusUpdate ? (
              <CircularProgress size={20} />
            ) : (
              <CheckCircleIcon color="success" />
            )}
          </ListItemIcon>
          Ativar inscrição
        </MenuItem>
        <MenuItem 
          onClick={handleCancelRegistration}
          disabled={loadingRegistrationStatusUpdate || !selectedRegistration || !canCancelRegistration(selectedRegistration)}
        >
          <ListItemIcon>
            {loadingRegistrationStatusUpdate ? (
              <CircularProgress size={20} />
            ) : (
              <CancelIcon color="error" />
            )}
          </ListItemIcon>
          Desativar inscrição
        </MenuItem>
      </Menu>

      {/* Dialog de detalhes do checkout */}
      <CheckoutDetailsDialog
        open={checkoutDialogOpen}
        onClose={handleCheckoutDialogClose}
        checkoutId={selectedCheckoutId || undefined}
        eventData={selectedEvent || undefined}
        onFetchCheckout={getCheckoutById}
      />
    </Box>
  );
}
