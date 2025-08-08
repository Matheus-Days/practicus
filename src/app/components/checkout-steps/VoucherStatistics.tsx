"use client";

import {
  Box,
  Card,
  CardContent,
  Typography,
} from "@mui/material";
import {
  ConfirmationNumber as TicketIcon,
} from "@mui/icons-material";

interface VoucherStatisticsProps {
  vouchersAmount: number;
  usedVouchers: number;
}

export default function VoucherStatistics({
  vouchersAmount,
  usedVouchers,
}: VoucherStatisticsProps) {
  const availableVouchers = vouchersAmount - usedVouchers;

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
              Total de Vouchers
            </Typography>
            <Typography variant="h4" color="primary">
              {vouchersAmount}
            </Typography>
          </Box>
          <Box sx={{ flex: "1 1 200px" }}>
            <Typography variant="subtitle2" color="text.secondary">
              Vouchers Utilizados
            </Typography>
            <Typography variant="h4" color="success.main">
              {usedVouchers}
            </Typography>
          </Box>
          <Box sx={{ flex: "1 1 200px" }}>
            <Typography variant="subtitle2" color="text.secondary">
              Vouchers Disponíveis
            </Typography>
            <Typography variant="h4" color="warning.main">
              {availableVouchers}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
} 