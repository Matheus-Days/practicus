"use client";

import { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Snackbar,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import {
  Group as GroupIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Block as BlockIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
} from "@mui/icons-material";
import { useCheckout } from "../../contexts/CheckoutContext";
import { useRegistrationAPI } from "../../hooks/registrationAPI";
import { RegistrationStatus } from "../../api/registrations/registration.types";

export default function VoucherRegistrations() {
  const {
    checkout,
    checkoutRegistrations,
    refreshCheckoutRegistrations,
    registrationsAmount,
  } = useCheckout();
  const { updateRegistrationStatus } = useRegistrationAPI();

  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    "success" | "error" | "info"
  >("success");

  // Calcular vouchers disponíveis (mesmo cálculo do VoucherStatistics)
  const totalRegistrations = checkout?.registrateMyself
    ? registrationsAmount - 1
    : registrationsAmount;
  const usedRegistrations = checkoutRegistrations.filter(
    (reg) => (reg.status === "ok" || reg.status === "pending") && !reg.isMyRegistration
  ).length;
  const availableRegistrations = totalRegistrations - usedRegistrations;

  const handleActivateRegistration = async (registrationId: string) => {
    try {
      setLoading(true);

      if (!checkout) {
        throw new Error("Checkout não encontrado");
      }

      // Determinar o novo status baseado no status do checkout
      const newStatus = (checkout.status === 'pending' ? 'pending' : 'ok') as RegistrationStatus;
      
      await updateRegistrationStatus(registrationId, newStatus);

      // Recarregar lista
      await refreshCheckoutRegistrations();

      setSnackbarMessage("Inscrição ativada com sucesso");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error: any) {
      setSnackbarMessage(error.message);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRegistration = async (registrationId: string) => {
    try {
      setLoading(true);

      // Atualizar status para cancelled
      await updateRegistrationStatus(registrationId, "cancelled");

      // Recarregar lista
      await refreshCheckoutRegistrations();

      setSnackbarMessage("Inscrição cancelada com sucesso");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error: any) {
      setSnackbarMessage(error.message);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // Função para verificar se o botão "Ativar inscrição" deve estar habilitado
  const canActivateRegistration = (registration: any) => {
    if (!checkout) return false;
    
    // Não pode ativar se o checkout for deleted ou refunded
    if (checkout.status === 'deleted' || checkout.status === 'refunded') {
      return false;
    }
    
    // Não pode ativar se a inscrição já estiver ok
    if (registration.status === 'ok') {
      return false;
    }
    
    return true;
  };

  // Função para verificar se o botão "Cancelar inscrição" deve estar habilitado
  const canCancelRegistration = (registration: any) => {
    // Não pode cancelar se a inscrição já estiver cancelada
    if (registration.status === 'cancelled') {
      return false;
    }
    
    // Não pode cancelar se o checkout for deleted ou refunded
    if (checkout && (checkout.status === 'deleted' || checkout.status === 'refunded')) {
      return false;
    }
    
    return true;
  };

  const getRegistrationStatusInfo = (status: string) => {
    switch (status) {
      case "ok":
        return {
          label: "Ativa",
          color: "success" as const,
          icon: <CheckCircleIcon fontSize="small" color="success" />,
        };
      case "pending":
        return {
          label: "Pendente",
          color: "warning" as const,
          icon: <PendingIcon fontSize="small" color="warning" />,
        };
      case "invalid":
        return {
          label: "Inválida",
          color: "default" as const,
          icon: <BlockIcon fontSize="small" color="disabled" />,
        };
      case "cancelled":
        return {
          label: "Cancelada",
          color: "error" as const,
          icon: <CancelIcon fontSize="small" color="error" />,
        };
      default:
        return {
          label: "Desconhecido",
          color: "default" as const,
          icon: <PendingIcon fontSize="small" color="disabled" />,
        };
    }
  };

  // Mostrar o componente se há registrations, mesmo que não sejam ativas
  if (checkoutRegistrations.length === 0) {
    return null;
  }

  return (
    <>
      <Card>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <GroupIcon color="primary" />
            <Typography variant="h6" component="h3">
              Inscritos via voucher
            </Typography>
            {loading && <CircularProgress size={20} sx={{ ml: 1 }} />}
            <Box sx={{ flexGrow: 1 }} />
            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={refreshCheckoutRegistrations}
              disabled={loading}
              sx={{ ml: "auto" }}
            >
              Atualizar lista
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      Nome Completo
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>E-mail</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Situação</TableCell>
                    <TableCell align="center" sx={{ fontWeight: "bold" }}>
                      Ações
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {checkoutRegistrations
                    .filter((reg) => !reg.isMyRegistration)
                    .map((reg) => {
                      const statusInfo = getRegistrationStatusInfo(reg.status);
                      return (
                        <TableRow key={reg.id}>
                          <TableCell>{reg.fullName}</TableCell>
                          <TableCell>{reg.email || "Não informado"}</TableCell>
                          <TableCell>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              {statusInfo.icon}
                              <Chip
                                label={statusInfo.label}
                                color={statusInfo.color}
                                size="small"
                                variant="outlined"
                              />
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            {reg.status === "invalid" ? (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ fontStyle: "italic" }}
                              >
                                Ação indisponível
                              </Typography>
                            ) : (reg.status === "cancelled") ? (
                              <Tooltip
                                title={
                                  availableRegistrations <= 0
                                    ? "Não há vouchers disponíveis"
                                    : ""
                                }
                              >
                                <span>
                                  <Button
                                    variant="outlined"
                                    color="success"
                                    size="small"
                                    startIcon={<RefreshIcon />}
                                    onClick={() =>
                                      handleActivateRegistration(reg.id)
                                    }
                                    disabled={
                                      loading || availableRegistrations <= 0 || !canActivateRegistration(reg)
                                    }
                                  >
                                    Ativar inscrição
                                  </Button>
                                </span>
                              </Tooltip>
                            ) : (
                              <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                startIcon={<DeleteIcon />}
                                onClick={() => handleCancelRegistration(reg.id)}
                                disabled={loading || !canCancelRegistration(reg)}
                              >
                                Cancelar inscrição
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
}
