"use client";

import { useEffect, useRef, useState } from "react";
import {
  Box,
  Typography,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { useBuyer } from "../../contexts/BuyerContext";
import CheckoutStatus from "./CheckoutStatus";
import VoucherCode from "./VoucherCode";
import PurchaseSummary from "./PurchaseSummary";
import MyRegistration from "./MyRegistration";
import VoucherStatistics from "./VoucherStatistics";
import VoucherRegistrations from "./VoucherRegistrations";
import { useCopyJSON } from "../../hooks/useCopyJSON";
import { useVoucherCalculations } from "../../hooks/useVoucherCalculations";

export default function Dashboard() {
  const { checkout, event, checkoutRegistrations } = useBuyer();
  const { copyJSON } = useCopyJSON();
  const { maxRegistrations } = useVoucherCalculations();

  const [mismatchDialogOpen, setMismatchDialogOpen] = useState(false);
  const [mismatchAcknowledged, setMismatchAcknowledged] = useState(false);
  const prevMismatchRef = useRef(false);

  const isEventOpen = event?.status === "open";
  const mismatch =
    Boolean(checkout) &&
    isEventOpen &&
    checkoutRegistrations.length !== maxRegistrations;

  useEffect(() => {
    if (!mismatch) {
      prevMismatchRef.current = false;
      setMismatchAcknowledged(false);
      setMismatchDialogOpen(false);
      return;
    }

    if (prevMismatchRef.current) return;

    prevMismatchRef.current = true;
    if (!mismatchAcknowledged) setMismatchDialogOpen(true);
  }, [mismatch, mismatchAcknowledged]);

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

      <Dialog
        open={mismatchDialogOpen}
        onClose={() => setMismatchDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <ErrorOutlineIcon color="error" sx={{ fontSize: 32 }} />
          <b>ATENÇÃO: inscrições pendentes</b>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 1 }}>
            Você possui ingressos que <b>NÃO</b> foram utilizados em inscrições. <br />
          </Typography>
          <Typography variant="body1" sx={{ mb: 1 }}>
            Lembre-se que os dados da cobrança <b>NÃO</b> garantem a inscrição do responsável pela compra.
            Se você irá utilizar um dos ingressos para se inscrever, utilize a seção &quot;<b>Minha inscrição no evento</b>&quot;.
          </Typography>
          <Typography variant="body1">
            <strong>Seus ingressos:</strong>{" "}
            {maxRegistrations}
            <br />
            <strong>Inscrições realizadas:</strong> {checkoutRegistrations.length}
            <br />
            <strong>Inscrições pendentes:</strong> {maxRegistrations - checkoutRegistrations.length}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            variant="contained"
            onClick={() => {
              setMismatchAcknowledged(true);
              setMismatchDialogOpen(false);
            }}
          >
            Entendi
          </Button>
        </DialogActions>
      </Dialog>

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
