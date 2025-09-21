"use client";

import { Box, Card, CardContent, Typography } from "@mui/material";
import { ConfirmationNumber as TicketIcon } from "@mui/icons-material";
import { useCheckout } from "../../contexts/CheckoutContext";
import { useVoucherCalculations } from "../../hooks/useVoucherCalculations";

export default function VoucherStatistics() {
  const { checkout } = useCheckout();
  const { totalRegistrations, usedRegistrations, availableRegistrations } = useVoucherCalculations();

  // Não mostrar o componente se não há checkout ou se é um checkout de voucher
  if (!checkout || checkout.checkoutType === "voucher") {
    return null;
  }

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
            <Typography variant="h4" color="success.main">
              {usedRegistrations}
            </Typography>
          </Box>
          <Box sx={{ flex: "1 1 200px" }}>
            <Typography variant="subtitle2" color="text.secondary">
              Vouchers disponíveis
            </Typography>
            <Typography variant="h4" color="warning.main">
              {availableRegistrations}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
