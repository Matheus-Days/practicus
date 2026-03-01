"use client";

import { useEffect } from "react";
import { Box, Typography, Alert } from "@mui/material";
import { useBuyer } from "../../contexts/BuyerContext";
import CheckoutStatus from "./CheckoutStatus";
import VoucherCode from "./VoucherCode";
import PurchaseSummary from "./PurchaseSummary";
import MyRegistration from "./MyRegistration";
import VoucherStatistics from "./VoucherStatistics";
import VoucherRegistrations from "./VoucherRegistrations";
import { useCopyJSON } from "../../hooks/useCopyJSON";

export default function Dashboard() {
  const { checkout } = useBuyer();
  const { copyJSON } = useCopyJSON();

  useEffect(() => {
    const handleKeyDown = async (event: KeyboardEvent) => {
      if (event.ctrlKey && event.altKey && event.key === "h") {
        event.preventDefault();
        
        if (checkout) {
          try {
            await copyJSON(checkout);
            console.log("Checkout copiado para o clipboard!");
          } catch (error) {
            console.error("Erro ao copiar checkout:", error);
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [checkout, copyJSON]);

  if (!checkout) {
    return <Alert severity="error">Nenhum checkout encontrado.</Alert>;
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 3,
        width: "100%",
        maxWidth: "100%",
        overflow: "hidden",
      }}
    >
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        sx={{
          fontSize: { xs: "1.75rem", sm: "2.125rem" },
          textAlign: { xs: "center", sm: "left" },
          wordBreak: "break-word",
        }}
      >
        Painel da inscrição
      </Typography>

      {/* Status do Checkout */}
      <CheckoutStatus />

      {/* Resumo da Compra - apenas para checkouts do tipo 'acquire' */}
      {checkout.checkoutType === "acquire" && <PurchaseSummary />}

      {/* Minha Inscrição */}
      <MyRegistration />

      {/* Código do Voucher */}
      {checkout.voucher && <VoucherCode voucher={checkout.voucher} />}

      {/* Estatísticas de Vouchers (apenas se paid/approved e tipo acquire) */}
      <VoucherStatistics />

      {/* Tabela de Inscritos */}
      <VoucherRegistrations />
    </Box>
  );
}
