"use client";

import {
  Box,
  Typography,
  Alert,
} from "@mui/material";
import { useCheckout } from "../../contexts/CheckoutContext";
import CheckoutStatus from "./CheckoutStatus";
import VoucherCode from "./VoucherCode";
import PurchaseSummary from "./PurchaseSummary";
import MyRegistration from "./MyRegistration";
import VoucherStatistics from "./VoucherStatistics";
import VoucherRegistrations from "./VoucherRegistrations";

export default function Dashboard() {
  const { checkout } = useCheckout();

  if (!checkout) {
    return <Alert severity="error">Nenhum checkout encontrado.</Alert>;
  }

  return (
    <Box sx={{ 
      display: "flex", 
      flexDirection: "column", 
      gap: 3, 
      width: "100%",
      maxWidth: "100%",
      overflow: "hidden"
    }}>
      <Typography 
        variant="h4" 
        component="h1" 
        gutterBottom
        sx={{ 
          fontSize: { xs: "1.75rem", sm: "2.125rem" },
          textAlign: { xs: "center", sm: "left" },
          wordBreak: "break-word"
        }}
      >
        Painel da inscrição
      </Typography>

      {/* Status do Checkout */}
      <CheckoutStatus />

      {/* Código do Voucher */}
      {checkout.voucher && (
        <VoucherCode voucher={checkout.voucher} />
      )}

      {/* Resumo da Compra - apenas para checkouts do tipo 'acquire' */}
      {checkout.checkoutType === "acquire" && (
        <PurchaseSummary />
      )}

      {/* Minha Inscrição */}
      <MyRegistration />

      {/* Estatísticas de Vouchers (apenas se completed e tipo acquire) */}
      <VoucherStatistics />

      {/* Tabela de Inscritos (apenas se completed e tipo acquire) */}
      <VoucherRegistrations />
    </Box>
  );
}
