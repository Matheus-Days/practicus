"use client";

import React from "react";
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
} from "@mui/material";
import {
  MoreVert as MoreVertIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
} from "@mui/icons-material";
import { CircularProgress } from "@mui/material";
import { useAdminContext } from "../../contexts/AdminContext";
import { CheckoutData } from "../../types/checkout";
import { CheckoutStatus } from "../../api/checkouts/checkout.types";
import { calculateTotalPurchasePrice } from "@/lib/checkout-utils";
import CheckoutDetailsDialog from './CheckoutDetailsDialog';

export default function CheckoutsTable() {
  const {
    eventCheckouts,
    loadingCheckouts,
    selectedEvent,
    updateCheckoutStatus,
    updateComplimentaryTickets,
    loadingComplimentaryUpdate,
    loadingCheckoutStatusUpdate,
  } = useAdminContext();

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [selectedCheckout, setSelectedCheckout] =
    React.useState<CheckoutData | null>(null);
  const [checkoutDialogOpen, setCheckoutDialogOpen] = React.useState(false);
  const [selectedCheckoutForDialog, setSelectedCheckoutForDialog] = React.useState<CheckoutData | null>(null);

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    checkout: CheckoutData
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedCheckout(checkout);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCheckout(null);
  };

  const handleViewCheckoutDetails = (checkout: CheckoutData) => {
    setSelectedCheckoutForDialog(checkout);
    setCheckoutDialogOpen(true);
  };

  const handleCheckoutDialogClose = () => {
    setCheckoutDialogOpen(false);
    setSelectedCheckoutForDialog(null);
  };

  const handleStatusChange = async (status: CheckoutStatus) => {
    if (status === 'deleted') {
      const confirmed = window.confirm("Ao cancelar uma compra que já foi aprovada antes, todas as inscrições confirmadas associadas a ela serão invalidadas. Tem certeza que deseja continuar?");
      if (!confirmed) return;
    }
    if (status === 'pending') {
      const confirmed = window.confirm("Ao marcar uma compra como pendente, todas as inscrições não canceladas associadas a ela serão marcadas como pendentes. Tem certeza que deseja continuar?");
      if (!confirmed) return;
    }
    if (status === 'completed') {
      const confirmed = window.confirm("Ao marcar uma compra como concluída, todas as inscrições não canceladas associadas a ela serão marcadas como concluídas. Tem certeza que deseja continuar?");
      if (!confirmed) return;
    }
    if (selectedCheckout) {
      await updateCheckoutStatus(selectedCheckout.id, status);
      handleMenuClose();
    }
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

  const extractCheckoutEmail = (checkout: CheckoutData): string => {
    if (!checkout.billingDetails) return "Não informado";
    if ("email" in checkout.billingDetails)
      return checkout.billingDetails.email;
    if ("responsibleEmail" in checkout.billingDetails)
      return checkout.billingDetails.responsibleEmail;
    return "Não informado";
  };

  const extractCheckoutName = (checkout: CheckoutData): string => {
    if (!checkout.billingDetails) return "Não informado";
    if ("fullName" in checkout.billingDetails)
      return checkout.billingDetails.fullName;
    if ("orgName" in checkout.billingDetails)
      return checkout.billingDetails.orgName;
    return "Não informado";
  };

  if (loadingCheckouts) {
    return (
      <Box sx={{ width: "100%" }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Aquisições ({eventCheckouts.length})
      </Typography>

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Pessoa</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Adquirido por</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Valor</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Data de criação</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {eventCheckouts.map((checkout) => {
              const statusDisplay = getStatusDisplay(checkout.status);
              return (
                <TableRow key={checkout.id} hover>
                  <TableCell>
                    <Chip
                      label={
                        checkout.legalEntity === "pf" ? "Física" : "Jurídica"
                      }
                      color={
                        checkout.legalEntity === "pf" ? "primary" : "secondary"
                      }
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {extractCheckoutName(checkout)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {extractCheckoutEmail(checkout)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {checkout.amount
                        ? formatCurrency(
                            calculateTotalPurchasePrice(
                              selectedEvent!,
                              checkout
                            )
                          )
                        : "-"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={statusDisplay.icon}
                      label={statusDisplay.text}
                      color={statusDisplay.color}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(checkout.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Box display="flex" gap={1} justifyContent="center">
                      <Tooltip title="Ver detalhes">
                        <IconButton
                          size="small"
                          onClick={() => handleViewCheckoutDetails(checkout)}
                          color="primary"
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Mais ações">
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, checkout)}
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

      {eventCheckouts.length === 0 && (
        <Box textAlign="center" py={4}>
          <Typography variant="body1" color="textSecondary">
            Nenhuma aquisição encontrada para este evento.
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
          onClick={() => handleStatusChange("completed")}
          disabled={loadingCheckoutStatusUpdate}
        >
          <ListItemIcon>
            {loadingCheckoutStatusUpdate ? (
              <CircularProgress size={20} />
            ) : (
              <CheckCircleIcon color="success" />
            )}
          </ListItemIcon>
          Marcar como pago
        </MenuItem>
        <MenuItem 
          onClick={() => handleStatusChange("pending")}
          disabled={loadingCheckoutStatusUpdate}
        >
          <ListItemIcon>
            {loadingCheckoutStatusUpdate ? (
              <CircularProgress size={20} />
            ) : (
              <PendingIcon color="warning" />
            )}
          </ListItemIcon>
          Marcar como pagamento pendente
        </MenuItem>
        <MenuItem 
          onClick={() => handleStatusChange("deleted")}
          disabled={loadingCheckoutStatusUpdate}
        >
          <ListItemIcon>
            {loadingCheckoutStatusUpdate ? (
              <CircularProgress size={20} />
            ) : (
              <CancelIcon color="error" />
            )}
          </ListItemIcon>
          Cancelar compra
        </MenuItem>
      </Menu>

      {/* Dialog de detalhes do checkout */}
      <CheckoutDetailsDialog
        open={checkoutDialogOpen}
        onClose={handleCheckoutDialogClose}
        checkoutData={selectedCheckoutForDialog || undefined}
        eventData={selectedEvent || undefined}
        onUpdateComplimentaryTickets={updateComplimentaryTickets}
        loadingComplimentaryUpdate={loadingComplimentaryUpdate}
      />
    </Box>
  );
}
