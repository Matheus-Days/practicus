"use client";

import { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import { useBuyer } from "../../contexts/BuyerContext";
import {
  RegistrationMinimal,
  useRegistrationAPI,
} from "../../hooks/registrationAPI";
import {
  RegistrationFormData,
  RegistrationStatus,
} from "../../api/registrations/registration.types";
import { useVoucherCalculations } from "../../hooks/useVoucherCalculations";
import RegistrationForm from "../RegistrationForm";
import { Add as AddIcon } from "@mui/icons-material";

export default function VoucherRegistrations() {
  const {
    checkout,
    checkoutRegistrations,
    createCheckoutRegistration,
    event,
    loading: buyerLoading,
  } = useBuyer();
  const { updateRegistrationStatus } = useRegistrationAPI();
  const { availableRegistrations } = useVoucherCalculations();

  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState<
    Partial<RegistrationFormData>
  >({});
  const [createIsValid, setCreateIsValid] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    "success" | "error" | "info"
  >("success");

  const handleOpenCreate = () => {
    setCreateError(null);
    setCreateIsValid(false);
    setCreateFormData({});
    setCreateOpen(true);
  };

  const handleCreate = async () => {
    try {
      setCreateError(null);
      setCreating(true);
      await createCheckoutRegistration(createFormData as RegistrationFormData);
      setCreateOpen(false);
      setSnackbarMessage("Inscrição criada com sucesso");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao criar inscrição";
      setCreateError(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleActivateRegistration = async (registrationId: string) => {
    try {
      setLoading(true);

      if (!checkout) {
        throw new Error("Checkout não encontrado");
      }

      // Determinar o novo status baseado no status do checkout
      const newStatus = (
        checkout.status === "pending" ? "pending" : "ok"
      ) as RegistrationStatus;

      await updateRegistrationStatus(registrationId, newStatus);

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
  const canActivateRegistration = (registration: RegistrationMinimal) => {
    if (!checkout) return false;

    // Não pode ativar se o checkout for deleted ou refunded
    if (checkout.status === "refunded") {
      return false;
    }

    // Não pode ativar se a inscrição já estiver ok ou pendente
    if (registration.status === "ok" || registration.status === "pending") {
      return false;
    }

    return true;
  };

  // Função para verificar se o botão "Desativar inscrição" deve estar habilitado
  const canCancelRegistration = (registration: any) => {
    // Não pode desativar se a inscrição já estiver cancelada
    if (registration.status === "cancelled") {
      return false;
    }

    // Não pode desativar se o checkout for deleted ou refunded
    if (checkout && checkout.status === "refunded") {
      return false;
    }

    return true;
  };

  const getRegistrationStatusInfo = (registration: RegistrationMinimal) => {
    switch (registration.status) {
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
          label: "Desativada",
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

  if (!checkout) {
    return null;
  }

  const canCreateRegistration =
    availableRegistrations > 0 &&
    checkout.status !== "refunded" &&
    !creating &&
    !buyerLoading &&
    event?.status === "open";

  return (
    <>
      <Card>
        <CardContent sx={{ p: { xs: 2, sm: 3 }, overflow: "hidden" }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 2,
              flexDirection: { xs: "column", sm: "row" },
              textAlign: { xs: "center", sm: "left" },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <GroupIcon color="primary" />
              <Typography variant="h6" component="h3">
                Inscrições realizadas
              </Typography>
              {loading && <CircularProgress size={20} sx={{ ml: 1 }} />}
            </Box>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenCreate}
              disabled={!canCreateRegistration}
              sx={{ width: { xs: "100%", sm: "auto" } }}
            >
              Nova inscrição
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box
              sx={{
                overflow: "auto",
                width: "100%",
                maxWidth: "100%",
              }}
            >
              <TableContainer
                component={Paper}
                variant="outlined"
                sx={{
                  minWidth: { xs: "100%", sm: "auto" },
                  maxWidth: "100%",
                }}
              >
                <Table
                  sx={{
                    minWidth: { xs: 600, sm: "auto" },
                    tableLayout: { xs: "fixed", sm: "auto" },
                  }}
                >
                  <TableHead>
                    <TableRow>
                      <TableCell
                        sx={{
                          fontWeight: "bold",
                          minWidth: { xs: 150, sm: "auto" },
                          maxWidth: { xs: 150, sm: "none" },
                        }}
                      >
                        Nome completo
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: "bold",
                          minWidth: { xs: 120, sm: "auto" },
                          maxWidth: { xs: 120, sm: "none" },
                        }}
                      >
                        E-mail
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: "bold",
                          minWidth: { xs: 100, sm: "auto" },
                        }}
                      >
                        Situação
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          fontWeight: "bold",
                          minWidth: { xs: 120, sm: "auto" },
                        }}
                      >
                        Ações
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {checkoutRegistrations.filter((reg) => !reg.isMyRegistration)
                      .length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4}>
                          <Typography variant="body2" color="text.secondary">
                            Nenhuma inscrição por voucher realizada ainda.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      checkoutRegistrations
                      .filter((reg) => !reg.isMyRegistration)
                      .map((reg) => {
                        const statusInfo = getRegistrationStatusInfo(reg);
                        return (
                          <TableRow key={reg.id}>
                            <TableCell
                              sx={{
                                wordBreak: "break-word",
                                maxWidth: { xs: 150, sm: "none" },
                              }}
                            >
                              {reg.fullName}
                            </TableCell>
                            <TableCell
                              sx={{
                                wordBreak: "break-word",
                                maxWidth: { xs: 120, sm: "none" },
                              }}
                            >
                              {reg.email || "Não informado"}
                            </TableCell>
                            <TableCell>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                  flexDirection: { xs: "column", sm: "row" },
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
                              ) : reg.status === "cancelled" ? (
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
                                        loading ||
                                        availableRegistrations <= 0 ||
                                        !canActivateRegistration(reg)
                                      }
                                      sx={{
                                        fontSize: {
                                          xs: "0.75rem",
                                          sm: "0.875rem",
                                        },
                                        minWidth: { xs: "auto", sm: "auto" },
                                      }}
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
                                  onClick={() =>
                                    handleCancelRegistration(reg.id)
                                  }
                                  disabled={
                                    loading || !canCancelRegistration(reg)
                                  }
                                  sx={{
                                    fontSize: { xs: "0.75rem", sm: "0.875rem" },
                                    minWidth: { xs: "auto", sm: "auto" },
                                  }}
                                >
                                  Desativar inscrição
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
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

      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Nova inscrição</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            {createError ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {createError}
              </Alert>
            ) : null}
            <RegistrationForm
              initialData={createFormData}
              onDataChange={setCreateFormData}
              onValidationChange={setCreateIsValid}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            variant="outlined"
            onClick={() => setCreateOpen(false)}
            disabled={creating || buyerLoading}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={creating || buyerLoading || !createIsValid}
            startIcon={creating ? <CircularProgress size={18} /> : undefined}
          >
            {creating ? "Salvando..." : "Salvar"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
