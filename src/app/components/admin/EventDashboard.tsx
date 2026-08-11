"use client";

import React, { useCallback, useMemo } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  TextField,
  IconButton,
  Stack,
} from "@mui/material";
import {
  People as PeopleIcon,
  ShoppingCart as ShoppingCartIcon,
  CheckCircle as CheckCircleIcon,
  Description as DescriptionIcon,
  Payments as PaymentsIcon,
  ConfirmationNumber as VoucherIcon,
  Pending as PendingIcon,
  AttachMoney as MoneyIcon,
  EventAvailable as EventAvailableIcon,
  EventBusy as EventBusyIcon,
  ContentCopy as ContentCopyIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import { useAdminContext } from "../../contexts/AdminContext";
import { InputAdornment } from "@mui/material";

export default function EventDashboard() {
  const {
    selectedEvent,
    eventDashboardData,
    eventCheckouts,
    eventRegistrations,
    loadingDashboard,
    showNotification,
  } = useAdminContext();

  const eventIdForRoutes = selectedEvent?.id;
  const pjPurchaseUrl = eventIdForRoutes
    ? `${window.location.origin}/evento/${eventIdForRoutes}/compra`
    : "";
  const pfPurchaseUrl = eventIdForRoutes
    ? `${window.location.origin}/evento/${eventIdForRoutes}/compra-pf`
    : "";

  const copyToClipboard = useCallback(
    async (label: string, value: string) => {
      try {
        await navigator.clipboard.writeText(value);
        showNotification(`${label} copiada!`, "success");
      } catch (err) {
        console.error("Erro ao copiar:", err);
        showNotification("Não foi possível copiar a URL.", "error");
      }
    },
    [showNotification]
  );

  // Calcular informações computadas
  const computedData = useMemo(() => {
    if (!selectedEvent) {
      return {
        totalTickets: 0,
        issuedTickets: 0,
        availableTickets: 0,
        validRegistrations: 0,
        pendingRegistrations: 0,
        paidTickets: 0,
        pendingPaymentTickets: 0,
        pendingCommitmentTickets: 0,
        adminComplimentaryTickets: 0,
        adminRegistrations: 0,
        pendingAdminRegistrations: 0,
      };
    }
    // 1. Informações de venda
    const totalTickets = selectedEvent.maxParticipants || 0;
    const issuedTickets = eventCheckouts
      .filter(c => c.status !== "refunded")
      .reduce((sum, checkout) => sum + (checkout.amount || 0) + (checkout.complimentary || 0), 0);
    const availableTickets = Math.max(0, totalTickets - issuedTickets);

    // 2. Informações de inscrição
    const validRegistrations = eventRegistrations.filter(
      r => r.status === "ok" || r.status === "pending"
    ).length;
    const pendingRegistrations = Math.max(0, issuedTickets - validRegistrations);

    // 3. Informações de pagamento
    const paidTickets = eventCheckouts
      .filter(c => c.status === "paid" || c.status === "approved")
      .reduce((sum, checkout) => sum + (checkout.amount || 0), 0);

    const pendingPaymentTickets = eventCheckouts
      .filter(c => c.status === "pending" && c.payment?.method == "empenho")
      .reduce((sum, checkout) => sum + (checkout.amount || 0), 0);

    const pendingCommitmentTickets = eventCheckouts
      .filter(c => c.payment?.method === "empenho" && c.status === "pending")
      .reduce((sum, checkout) => sum + (checkout.amount || 0), 0);

    // 4. Informações de cortesias
    const adminCheckout = eventCheckouts.find(c => c.checkoutType === "admin");
    const adminComplimentaryTickets = adminCheckout?.complimentary || 0;
    const adminRegistrations = eventRegistrations.filter(
      r => r.checkoutId === adminCheckout?.id && r.status === "ok"
    ).length;
    const pendingAdminRegistrations = Math.max(0, adminComplimentaryTickets - adminRegistrations);

    return {
      // Venda
      totalTickets,
      issuedTickets,
      availableTickets,
      // Inscrição
      validRegistrations,
      pendingRegistrations,
      // Pagamento
      paidTickets,
      pendingPaymentTickets,
      pendingCommitmentTickets,
      // Cortesias
      adminComplimentaryTickets,
      adminRegistrations,
      pendingAdminRegistrations,
    };
  }, [selectedEvent, eventCheckouts, eventRegistrations]);

  if (!selectedEvent || !eventDashboardData) {
    return null;
  }

  if (loadingDashboard) {
    return (
      <Box sx={{ width: "100%", mb: 3 }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box display="flex" flexDirection="column" gap={3} sx={{ mb: 3 }}>
      <Typography variant="h5" gutterBottom>
        Painel do evento: {selectedEvent.title}
      </Typography>

      <Card sx={{ maxWidth: "50%"}}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Links de compra para este evento
          </Typography>

          <Stack spacing={2}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr auto" },
                gap: 1,
                alignItems: "center",
              }}
            >
              <TextField
                label="PESSOA JURÍDICA"
                value={pjPurchaseUrl}
                fullWidth
                size="small"
                InputProps={{
                  readOnly: true,
                  startAdornment: (
                    <InputAdornment position="start">
                      <BusinessIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
              <IconButton
                aria-label="Copiar URL de compra PJ"
                onClick={() => copyToClipboard("URL de compra PJ", pjPurchaseUrl)}
                disabled={!pjPurchaseUrl}
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr auto" },
                gap: 1,
                alignItems: "center",
              }}
            >
              <TextField
                label="PESSOA FÍSICA"
                value={pfPurchaseUrl}
                fullWidth
                size="small"
                InputProps={{
                  readOnly: true,
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
              <IconButton
                aria-label="Copiar URL de compra PF"
                onClick={() => copyToClipboard("URL de compra PF", pfPurchaseUrl)}
                disabled={!pfPurchaseUrl}
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* 1. Informações de Venda */}
      <Box>
        <Typography variant="h6" gutterBottom color="primary">
          📊 Informações de venda
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={2}>
          <Box flex="1" minWidth="300px">
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <EventAvailableIcon color="primary" />
                  <Typography variant="h6">Total de ingressos</Typography>
                </Box>
                <Typography variant="h4" color="primary">
                  {computedData.totalTickets}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Capacidade máxima do evento
                </Typography>
              </CardContent>
            </Card>
          </Box>
          <Box flex="1" minWidth="300px">
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <ShoppingCartIcon color="success" />
                  <Typography variant="h6">Ingressos emitidos</Typography>
                </Box>
                <Typography variant="h4" color="success.main">
                  {computedData.issuedTickets}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total de ingressos vendidos + cortesias
                </Typography>
              </CardContent>
            </Card>
          </Box>
          <Box flex="1" minWidth="300px">
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <EventBusyIcon color="warning" />
                  <Typography variant="h6">Ingressos disponíveis</Typography>
                </Box>
                <Typography variant="h4" color="warning.main">
                  {computedData.availableTickets}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Vagas ainda disponíveis
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Box>

      {/* 2. Informações de Inscrição */}
      <Box>
        <Typography variant="h6" gutterBottom color="primary">
          👥 Informações de inscrição
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={2}>
          <Box flex="1" minWidth="300px">
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <CheckCircleIcon color="success" />
                  <Typography variant="h6">Inscrições realizadas</Typography>
                </Box>
                <Typography variant="h4" color="success.main">
                  {computedData.validRegistrations}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Inscrições confirmadas + pendentes
                </Typography>
              </CardContent>
            </Card>
          </Box>
          <Box flex="1" minWidth="300px">
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <PendingIcon color="warning" />
                  <Typography variant="h6">Inscrições pendentes</Typography>
                </Box>
                <Typography variant="h4" color="warning.main">
                  {computedData.pendingRegistrations}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Ingressos emitidos sem inscrição
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Box>

      {/* 3. Informações de Pagamento */}
      <Box>
        <Typography variant="h6" gutterBottom color="primary">
          💳 Informações de pagamento
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={2}>
          <Box flex="1" minWidth="300px">
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <MoneyIcon color="success" />
                  <Typography variant="h6">Ingressos pagos</Typography>
                </Box>
                <Typography variant="h4" color="success.main">
                  {computedData.paidTickets}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Compra marcada como &quot;paga&quot;
                </Typography>
              </CardContent>
            </Card>
          </Box>
          <Box flex="1" minWidth="300px">
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <PaymentsIcon color="warning" />
                  <Typography variant="h6">Ingressos pendentes de pagamento</Typography>
                </Box>
                <Typography variant="h4" color="warning.main">
                  {computedData.pendingPaymentTickets}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Compras com pagamento marcado como &quot;pendente&quot;
                </Typography>
              </CardContent>
            </Card>
          </Box>
          <Box flex="1" minWidth="300px">
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <DescriptionIcon color="info" />
                  <Typography variant="h6">Ingressos pendentes de empenho</Typography>
                </Box>
                <Typography variant="h4" color="info.main">
                  {computedData.pendingCommitmentTickets}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Compras com empenho pendente
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Box>

      {/* 4. Informações de Cortesias */}
      <Box>
        <Typography variant="h6" gutterBottom color="primary">
          🎫 Informações de cortesias
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={2}>
          <Box flex="1" minWidth="300px">
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <VoucherIcon color="primary" />
                  <Typography variant="h6">Cortesias do administrador</Typography>
                </Box>
                <Typography variant="h4" color="primary.main">
                  {computedData.adminComplimentaryTickets}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total de cortesias disponíveis
                </Typography>
              </CardContent>
            </Card>
          </Box>
          <Box flex="1" minWidth="300px">
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <PeopleIcon color="warning" />
                  <Typography variant="h6">Cortesias pendentes de inscrição</Typography>
                </Box>
                <Typography variant="h4" color="warning.main">
                  {computedData.pendingAdminRegistrations}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Cortesias não utilizadas
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
