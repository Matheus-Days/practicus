"use client";

import { Box, Card, CardContent, Typography } from "@mui/material";
import { ConfirmationNumber as TicketIcon } from "@mui/icons-material";
import { useCheckout } from "../../contexts/CheckoutContext";
import { useVoucherCalculations } from "../../hooks/useVoucherCalculations";

export default function VoucherStatistics() {
  const { checkout } = useCheckout();
  const {
    totalRegistrations,
    usedRegistrations,
    availableRegistrations,
    hasOwnValidRegistration,
  } = useVoucherCalculations();

  // Não mostrar o componente se não há checkout ou se é um checkout de voucher
  if (!checkout || checkout.checkoutType === "voucher") {
    return null;
  }

  if (totalRegistrations === 0) {
    return null;
  }

  return (
    <Card sx={{ width: "100%", maxWidth: "100%", overflow: "hidden" }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 }, overflow: "hidden" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <TicketIcon color="primary" />
          <Typography variant="h6" component="h3">
            Acompanhe as inscrições via voucher
          </Typography>
        </Box>

        {hasOwnValidRegistration && (
          <Typography variant="body2" color="text.secondary" mb={3}>
            Você tem uma inscrição válida para si, logo o número de vouchers é igual ao número de inscrições adquiridas menos 1.
          </Typography>
        )}

        <Box sx={{ 
          display: "flex", 
          flexWrap: "wrap", 
          gap: 2,
          flexDirection: { xs: "column", sm: "row" }
        }}>
          <Box sx={{ 
            flex: { xs: "0 0 64px", sm: "1 1 200px" }, 
            minWidth: { xs: "100%", sm: "200px" },
            textAlign: { xs: "center", sm: "left" }
          }}>
            <Typography variant="subtitle2" color="text.secondary">
              Total de vouchers
            </Typography>
            <Typography variant="h4" color="primary">
              {totalRegistrations}
            </Typography>
          </Box>
          <Box sx={{ 
            flex: { xs: "0 0 64px", sm: "1 1 200px" }, 
            minWidth: { xs: "100%", sm: "200px" },
            textAlign: { xs: "center", sm: "left" }
          }}>
            <Typography variant="subtitle2" color="text.secondary">
              Vouchers utilizados
            </Typography>
            <Typography variant="h4" color="success.main">
              {usedRegistrations}
            </Typography>
          </Box>
          <Box sx={{ 
            flex: { xs: "0 0 64px", sm: "1 1 200px" }, 
            minWidth: { xs: "100%", sm: "200px" },
            textAlign: { xs: "center", sm: "left" }
          }}>
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
