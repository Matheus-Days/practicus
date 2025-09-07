"use client";

import { useState } from "react";
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
import { useCheckout } from "../../contexts/CheckoutContext";
import CheckoutStatus from "./CheckoutStatus";
import VoucherCode from "./VoucherCode";
import PurchaseSummary from "./PurchaseSummary";
import MyRegistration from "./MyRegistration";
import VoucherStatistics from "./VoucherStatistics";
import VoucherRegistrations from "./VoucherRegistrations";

interface DashboardProps {
  onEditBilling?: () => void;
  onGoToPayment?: () => void;
  onGoToRegistration?: () => void;
}

export default function Dashboard({
  onEditBilling,
  onGoToPayment,
}: DashboardProps) {
  const {
    checkout,
    billingDetails,
    registrationsAmount,
    registrateMyself,
    legalEntity,
    setCurrentStep,
    deleteCheckout,
  } = useCheckout();

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  if (!checkout) {
    return <Alert severity="error">Nenhum checkout encontrado.</Alert>;
  }

  const handleCancelAcquisition = async () => {
    if (!checkout?.id) return;

    try {
      await deleteCheckout();
    } catch (error) {
      console.error("Erro ao cancelar aquisição:", error);
    }
  };

  const handleRequestCancellation = () => {
    setCancelDialogOpen(true);
  };

  const handleEditBilling = () => {
    setCurrentStep("billing-details");
    onEditBilling?.();
  };

  const handleGoToPayment = () => {
    setCurrentStep("payment");
    onGoToPayment?.();
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
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
        <PurchaseSummary
          registrationsAmount={registrationsAmount}
          legalEntity={legalEntity}
          registrateMyself={registrateMyself}
          billingDetails={billingDetails}
          checkoutStatus={checkout.status}
          onEditBilling={handleEditBilling}
          onGoToPayment={handleGoToPayment}
          onCancelAcquisition={handleCancelAcquisition}
          onRequestCancellation={handleRequestCancellation}
        />
      )}

      {/* Minha Inscrição */}
      <MyRegistration />

      {/* Estatísticas de Vouchers (apenas se completed e tipo acquire) */}
      {(checkout.status === "completed" || checkout.status === "pending") && checkout.checkoutType === "acquire" && (
        <VoucherStatistics />
      )}

      {/* Tabela de Inscritos (apenas se completed e tipo acquire) */}
      {(checkout.status === "completed" || checkout.status === "pending") && checkout.checkoutType === "acquire" && (
        <VoucherRegistrations />
      )}

      {/* Dialog de Solicitação de Cancelamento */}
      <Dialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Solicitar cancelamento</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Para solicitar o cancelamento de aquisição de inscrições e
            reembolsos, entre em contato direto com a equipe Practicus através
            dos meios oficiais de comunicação disponíveis na página de contato.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Nossa equipe está preparada para auxiliá-lo com todas as suas
            dúvidas e solicitações relacionadas ao seu pedido.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>Fechar</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              setCancelDialogOpen(false);
              window.open("/contato", "_blank");
            }}
          >
            Ir para contato
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
