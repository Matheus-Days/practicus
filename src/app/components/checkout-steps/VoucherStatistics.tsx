"use client";

import { Box, Card, CardContent, Typography } from "@mui/material";
import { ConfirmationNumber as TicketIcon } from "@mui/icons-material";
import { useCheckout } from "../../contexts/CheckoutContext";

export default function VoucherStatistics() {
  const { checkout, checkoutRegistrations, registrationsAmount } =
    useCheckout();

  // Não mostrar o componente se não há checkout ou se é um checkout de voucher
  if (!checkout || checkout.checkoutType === "voucher") {
    return null;
  }

  // Calcular estatísticas
  const totalRegistrations = checkout.registrateMyself
    ? registrationsAmount - 1
    : registrationsAmount;
  const usedRegistrations = checkoutRegistrations.filter(
    (reg) =>
      (reg.status === "ok" || reg.status === "pending") && !reg.isMyRegistration
  ).length;
  const availableRegistrations = totalRegistrations - usedRegistrations;

  if (totalRegistrations === 0) {
    return null;
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <TicketIcon color="primary" />
          <Typography variant="h6" component="h3">
            Acompanhe as inscrições via voucher
          </Typography>
        </Box>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          <Box sx={{ flex: "1 1 200px" }}>
            <Typography variant="subtitle2" color="text.secondary">
              Total de vouchers
            </Typography>
            <Typography variant="h4" color="primary">
              {totalRegistrations}
            </Typography>
          </Box>
          <Box sx={{ flex: "1 1 200px" }}>
            <Typography variant="subtitle2" color="text.secondary">
              Vouchers utilizados
            </Typography>
            <Typography variant="h4" color="warning.main">
              {usedRegistrations}
            </Typography>
          </Box>
          <Box sx={{ flex: "1 1 200px" }}>
            <Typography variant="subtitle2" color="text.secondary">
              Vouchers disponíveis
            </Typography>
            <Typography variant="h4" color="success.main">
              {availableRegistrations}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
