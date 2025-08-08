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
  onGoToRegistration,
}: DashboardProps) {
  const {
    checkout,
    registration,
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

  // Calcular quantidade de vouchers disponíveis
  const vouchersAmount = registrateMyself
    ? registrationsAmount - 1
    : registrationsAmount;

  // Mock data para inscritos (será substituído pela API real)
  const mockRegistrations = [
    { id: "1", fullName: "João Silva", email: "joao@email.com", status: "ok" as const },
    {
      id: "2",
      fullName: "Maria Santos",
      email: "maria@email.com",
      status: "invalid" as const,
    },
    {
      id: "3",
      fullName: "Carina Tavares",
      email: "carina@email.com",
      status: "cancelled" as const,
    },
  ];

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

  const handleGoToRegistration = () => {
    setCurrentStep("registration-form");
    onGoToRegistration?.();
  };

  const handleCancelMyRegistration = () => {
    // TODO: Implementar cancelamento da minha inscrição
    console.log("Cancelar minha inscrição");
  };

  const handleCancelRegistration = (registrationId: string) => {
    // TODO: Implementar cancelamento de inscrição
    console.log("Cancelar inscrição:", registrationId);
  };

  const handleReactivateRegistration = (registrationId: string) => {
    // TODO: Implementar reativação de inscrição
    console.log("Reativar inscrição:", registrationId);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard da Inscrição
      </Typography>

      {/* Status do Checkout */}
      <CheckoutStatus status={checkout.status} />

      {/* Código do Voucher */}
      {checkout.voucher && (
        <VoucherCode voucher={checkout.voucher} />
      )}

      {/* Resumo da Compra */}
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

      {/* Minha Inscrição */}
      <MyRegistration
        registration={registration}
        registrateMyself={registrateMyself}
        checkoutType={checkout.checkoutType}
        onGoToRegistration={handleGoToRegistration}
        onCancelMyRegistration={handleCancelMyRegistration}
      />

      {/* Estatísticas de Vouchers (apenas se completed e vouchersAmount > 0) */}
      {checkout.status === "completed" && vouchersAmount > 0 && (
        <VoucherStatistics
          vouchersAmount={vouchersAmount}
          usedVouchers={mockRegistrations.filter((reg) => reg.status === "ok").length}
        />
      )}

      {/* Tabela de Inscritos (apenas se completed e vouchersAmount > 0) */}
      {checkout.status === "completed" && vouchersAmount > 0 && (
        <VoucherRegistrations
          registrations={mockRegistrations}
          onCancelRegistration={handleCancelRegistration}
          onReactivateRegistration={handleReactivateRegistration}
        />
      )}

      {/* Dialog de Solicitação de Cancelamento */}
      <Dialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Solicitar Cancelamento</DialogTitle>
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
            Ir para Contato
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
