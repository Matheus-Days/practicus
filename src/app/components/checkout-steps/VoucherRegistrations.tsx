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

interface VoucherRegistration {
  id: string;
  fullName: string;
  email: string;
  status: "ok" | "invalid" | "cancelled";
}

interface VoucherRegistrationsProps {
  registrations: VoucherRegistration[];
  onCancelRegistration?: (registrationId: string) => void;
  onReactivateRegistration?: (registrationId: string) => void;
}

export default function VoucherRegistrations({
  registrations,
  onCancelRegistration,
  onReactivateRegistration,
}: VoucherRegistrationsProps) {
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    "success" | "error" | "info"
  >("success");

  const handleCancelRegistration = (registrationId: string) => {
    // TODO: Implementar cancelamento de inscrição
    setSnackbarMessage(
      "Funcionalidade de cancelamento será implementada em breve"
    );
    setSnackbarSeverity("info");
    setSnackbarOpen(true);
    onCancelRegistration?.(registrationId);
  };

  const handleReactivateRegistration = (registrationId: string) => {
    // TODO: Implementar reativação de inscrição
    setSnackbarMessage(
      "Funcionalidade de reativação será implementada em breve"
    );
    setSnackbarSeverity("info");
    setSnackbarOpen(true);
    onReactivateRegistration?.(registrationId);
  };

  const getRegistrationStatusInfo = (status: string) => {
    switch (status) {
      case "ok":
        return {
          label: "Ativa",
          color: "success" as const,
          icon: <CheckCircleIcon fontSize="small" color="success" />,
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
  if (registrations.length === 0) {
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
          </Box>

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
                {registrations.map((reg) => {
                  const statusInfo = getRegistrationStatusInfo(reg.status);
                  return (
                    <TableRow key={reg.id}>
                      <TableCell>{reg.fullName}</TableCell>
                      <TableCell>{reg.email}</TableCell>
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
                        ) : reg.status === "cancelled" ? (
                          <Button
                            variant="outlined"
                            color="success"
                            size="small"
                            startIcon={<RefreshIcon />}
                            onClick={() => handleReactivateRegistration(reg.id)}
                          >
                            Reativar inscrição
                          </Button>
                        ) : (
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            startIcon={<DeleteIcon />}
                            onClick={() => handleCancelRegistration(reg.id)}
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
