'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  Typography,
  Box,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  Snackbar,
  TextField,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Cancel as CancelIcon,
  Close as CloseIcon,
  ContentCopy as ContentCopyIcon,
  Check as CheckIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { CheckoutData } from '../../types/checkout';
import { calculateTotalPurchasePrice } from '@/lib/checkout-utils';
import { BillingDetailsPF, BillingDetailsPJ } from '../../api/checkouts/checkout.types';
import { EventDocument } from '../../types/events';

interface CheckoutDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  checkoutId?: string;
  checkoutData?: CheckoutData;
  eventData?: EventDocument;
  onFetchCheckout?: (checkoutId: string) => Promise<CheckoutData>;
  onUpdateComplimentaryTickets?: (checkout: CheckoutData, val: number) => Promise<void>;
  loadingComplimentaryUpdate?: boolean;
}

// Subcomponente para dados de pessoa física
interface BillingDetailsPFProps {
  billingDetails: BillingDetailsPF;
}

function BillingDetailsPFComponent({ billingDetails }: BillingDetailsPFProps) {
  return (
    <Box>
      <Typography variant="body2" color="textSecondary">
        Nome Completo:
      </Typography>
      <Typography variant="body1" gutterBottom>
        {billingDetails.fullName || "Não informado"}
      </Typography>
      
      <Typography variant="body2" color="textSecondary">
        Email:
      </Typography>
      <Typography variant="body1" gutterBottom>
        {billingDetails.email || "Não informado"}
      </Typography>
      
      <Typography variant="body2" color="textSecondary">
        Telefone:
      </Typography>
      <Typography variant="body1" gutterBottom>
        {billingDetails.phone || "Não informado"}
      </Typography>
    </Box>
  );
}

// Subcomponente para dados de pessoa jurídica
interface BillingDetailsPJProps {
  billingDetails: BillingDetailsPJ;
}

function BillingDetailsPJComponent({ billingDetails }: BillingDetailsPJProps) {
  return (
    <Box>
      <Typography variant="body2" color="textSecondary">
        Razão Social:
      </Typography>
      <Typography variant="body1" gutterBottom>
        {billingDetails.orgName || "Não informado"}
      </Typography>
      
      <Typography variant="body2" color="textSecondary">
        Nome do Responsável:
      </Typography>
      <Typography variant="body1" gutterBottom>
        {billingDetails.responsibleName || "Não informado"}
      </Typography>
      
      <Typography variant="body2" color="textSecondary">
        Email do Responsável:
      </Typography>
      <Typography variant="body1" gutterBottom>
        {billingDetails.responsibleEmail || "Não informado"}
      </Typography>
      
      <Typography variant="body2" color="textSecondary">
        Telefone do Responsável:
      </Typography>
      <Typography variant="body1" gutterBottom>
        {billingDetails.responsiblePhone || "Não informado"}
      </Typography>
      
      <Typography variant="body2" color="textSecondary">
        CNPJ:
      </Typography>
      <Typography variant="body1" gutterBottom>
        {billingDetails.orgCnpj || "Não informado"}
      </Typography>
      
      <Typography variant="body2" color="textSecondary">
        Endereço da Organização:
      </Typography>
      <Typography variant="body1" gutterBottom>
        {billingDetails.orgAddress || "Não informado"}
      </Typography>
      
      <Typography variant="body2" color="textSecondary">
        Telefone da Organização:
      </Typography>
      <Typography variant="body1" gutterBottom>
        {billingDetails.orgPhone || "Não informado"}
      </Typography>
    </Box>
  );
}

export default function CheckoutDetailsDialog({
  open,
  onClose,
  checkoutId,
  checkoutData,
  eventData,
  onFetchCheckout,
  onUpdateComplimentaryTickets,
  loadingComplimentaryUpdate = false,
}: CheckoutDetailsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkout, setCheckout] = useState<CheckoutData | null>(checkoutData || null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  // Estados para edição de cortesias
  const [complimentaryValue, setComplimentaryValue] = useState<number>(0);
  const [isEditingComplimentary, setIsEditingComplimentary] = useState(false);

  const fetchCheckout = useCallback(async () => {
    if (!checkoutId || !onFetchCheckout) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await onFetchCheckout(checkoutId);
      setCheckout(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar informações do checkout');
    } finally {
      setLoading(false);
    }
  }, [checkoutId, onFetchCheckout]);

  useEffect(() => {
    if (open && checkoutId && onFetchCheckout && !checkoutData) {
      fetchCheckout();
    } else if (checkoutData) {
      setCheckout(checkoutData);
    }
  }, [open, checkoutId, checkoutData, onFetchCheckout, fetchCheckout]);

  // Sincronizar valor de cortesias quando checkout mudar
  useEffect(() => {
    if (checkout) {
      setComplimentaryValue(checkout.complimentary || 0);
      setIsEditingComplimentary(false);
    }
  }, [checkout]);

  const handleClose = () => {
    setCheckout(null);
    setError(null);
    setLoading(false);
    onClose();
  };

  const handleCopyId = async () => {
    if (checkout?.id) {
      try {
        await navigator.clipboard.writeText(checkout.id);
        setSnackbarMessage('ID copiado para a área de transferência!');
        setSnackbarOpen(true);
      } catch (err) {
        console.error('Erro ao copiar ID:', err);
      }
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // Funções para edição de cortesias
  const handleComplimentaryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value) || 0;
    setComplimentaryValue(value);
    setIsEditingComplimentary(value !== (checkout?.complimentary || 0));
  };

  const handleConfirmComplimentary = async () => {
    if (!checkout?.id || !onUpdateComplimentaryTickets) return;
    
    try {
      await onUpdateComplimentaryTickets(checkout, complimentaryValue);
      
      setCheckout(prevCheckout => 
        prevCheckout ? { ...prevCheckout, complimentary: complimentaryValue } : null
      );
      
      setIsEditingComplimentary(false);
      setSnackbarMessage('Cortesias atualizadas com sucesso!');
      setSnackbarOpen(true);
    } catch (err) {
      console.error('Erro ao atualizar cortesias:', err);
    }
  };

  const handleCancelComplimentary = () => {
    setComplimentaryValue(checkout?.complimentary || 0);
    setIsEditingComplimentary(false);
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "pending":
        return {
          text: "Pendente",
          color: "warning" as const,
          icon: <PendingIcon />,
        };
      case "completed":
        return {
          text: "Concluído",
          color: "success" as const,
          icon: <CheckCircleIcon />,
        };
      case "deleted":
        return {
          text: "Cancelado",
          color: "error" as const,
          icon: <CancelIcon />,
        };
      default:
        return {
          text: "Desconhecido",
          color: "default" as const,
          icon: undefined,
        };
    }
  };

  const formatCurrency = (amountInCents: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(amountInCents / 100);
  };

  const formatDate = (date: any) => {
    if (!date) return "-";
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(dateObj);
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Detalhes da aquisição</Typography>
            <Button
              onClick={handleClose}
              startIcon={<CloseIcon />}
              color="inherit"
            >
              Fechar
            </Button>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {loading && (
            <Box display="flex" justifyContent="center" alignItems="center" py={4}>
              <CircularProgress />
              <Typography variant="body1" ml={2}>
                Carregando informações...
              </Typography>
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {checkout && !loading && (
            <Box>
              {/* Status */}
              <Box mb={3}>
                <Typography variant="h6" gutterBottom>
                  Situação da aquisição
                </Typography>
                <Chip
                  icon={getStatusDisplay(checkout.status).icon}
                  label={getStatusDisplay(checkout.status).text}
                  color={getStatusDisplay(checkout.status).color}
                  size="medium"
                  variant="outlined"
                />
              </Box>

              <Divider sx={{ mb: 3 }} />

              {/* Informações Gerais */}
              <Box display="grid" gridTemplateColumns="1fr 1fr" gap={3}>
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Informações gerais
                  </Typography>
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      ID da aquisição:
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                        {checkout.id}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={handleCopyId}
                        color="primary"
                      >
                        <ContentCopyIcon />
                      </IconButton>
                    </Box>
                    
                    <Typography variant="body2" color="textSecondary">
                      Tipo de pessoa:
                    </Typography>
                    <Chip
                      label={checkout.legalEntity === "pf" ? "Física" : "Jurídica"}
                      color={checkout.legalEntity === "pf" ? "primary" : "secondary"}
                      size="small"
                      variant="outlined"
                      sx={{ mb: 1 }}
                    />
                    
                    <Typography variant="body2" color="textSecondary">
                      Número de inscrições:
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {checkout.amount || "Não informado"}
                    </Typography>
                    
                    <Typography variant="body2" color="textSecondary">
                      Valor total:
                    </Typography>
                    <Typography variant="h6" color="primary" gutterBottom>
                      {checkout.amount && eventData
                        ? formatCurrency(calculateTotalPurchasePrice(eventData, checkout))
                        : "-"}
                    </Typography>
                    
                    <Typography variant="body2" color="textSecondary">
                      Data de criação:
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {formatDate(checkout.createdAt)}
                    </Typography>
                    
                    {checkout.updatedAt && (
                      <>
                        <Typography variant="body2" color="textSecondary">
                          Última atualização:
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                          {formatDate(checkout.updatedAt)}
                        </Typography>
                      </>
                    )}
                  </Box>
                </Box>

                <Box>
                  <Typography variant="h6" gutterBottom>
                    Dados de faturamento
                  </Typography>
                  {checkout.billingDetails ? (
                    checkout.legalEntity === "pf" ? (
                      <BillingDetailsPFComponent billingDetails={checkout.billingDetails as BillingDetailsPF} />
                    ) : (
                      <BillingDetailsPJComponent billingDetails={checkout.billingDetails as BillingDetailsPJ} />
                    )
                  ) : (
                    <Typography variant="body1" color="textSecondary">
                      Dados de faturamento não disponíveis
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* Seção de Cortesias */}
              <Divider sx={{ my: 3 }} />
              <Box mb={3}>
                <Typography variant="h6" gutterBottom color="primary">
                  Cortesias
                </Typography>
                <Box display="flex" alignItems="center" gap={2}>
                  <TextField
                    type="number"
                    value={complimentaryValue}
                    onChange={handleComplimentaryChange}
                    size="small"
                    sx={{ width: 100 }}
                    inputProps={{ 
                      min: 0,
                      style: { textAlign: 'center' }
                    }}
                    disabled={loadingComplimentaryUpdate}
                    label="Quantidade"
                  />
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={handleConfirmComplimentary}
                    disabled={!isEditingComplimentary || loadingComplimentaryUpdate}
                    sx={{ 
                      bgcolor: 'success.main', 
                      color: 'white',
                      '&:hover': { bgcolor: 'success.dark' },
                      '&:disabled': { bgcolor: 'grey.300', color: 'grey.500' }
                    }}
                  >
                    <CheckIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="secondary"
                    onClick={handleCancelComplimentary}
                    disabled={!isEditingComplimentary || loadingComplimentaryUpdate}
                    sx={{ 
                      bgcolor: 'secondary.main', 
                      color: 'white',
                      '&:hover': { bgcolor: 'secondary.dark' },
                      '&:disabled': { bgcolor: 'grey.300', color: 'grey.500' }
                    }}
                  >
                    <ClearIcon />
                  </IconButton>
                </Box>
              </Box>

              {/* Informações Adicionais */}
              {checkout.registrateMyself !== undefined && (
                <>
                  <Divider sx={{ my: 3 }} />
                  <Typography variant="h6" gutterBottom>
                    Informações adicionais
                  </Typography>
                  <Box display="grid" gridTemplateColumns="1fr 1fr" gap={3}>
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        O comprador vai ele mesmo se inscrever?
                      </Typography>
                      <Typography variant="body1">
                        {checkout.registrateMyself ? "Sim" : "Não"}
                      </Typography>
                    </Box>
                  </Box>
                </>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Snackbar para notificações */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity="success"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
}
