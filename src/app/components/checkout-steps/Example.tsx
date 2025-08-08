"use client";

import { Box } from "@mui/material";
import {
  CheckoutStatus,
  VoucherCode,
  PurchaseSummary,
  MyRegistration,
  VoucherStatistics,
  VoucherRegistrations,
} from "./index";
import { CheckoutStatus as CheckoutStatusType } from "../../api/checkouts/checkout.types";
import { BillingDetailsPF } from "../../api/checkouts/checkout.types";

// Exemplo de uso dos componentes individualmente
export default function Example() {
  // Mock data para exemplo
  const mockBillingDetails: BillingDetailsPF = {
    fullName: "João Silva",
    email: "joao@email.com",
    phone: "(11) 99999-9999",
  };

  const mockRegistrations = [
    { id: "1", fullName: "João Silva", email: "joao@email.com", status: "ok" as const },
    { id: "2", fullName: "Maria Santos", email: "maria@email.com", status: "invalid" as const },
  ];

  const handleEditBilling = () => {
    console.log("Editar faturamento");
  };

  const handleGoToPayment = () => {
    console.log("Ir para pagamento");
  };

  const handleCancelAcquisition = () => {
    console.log("Cancelar aquisição");
  };

  const handleRequestCancellation = () => {
    console.log("Solicitar cancelamento");
  };

  const handleGoToRegistration = () => {
    console.log("Ir para inscrição");
  };

  const handleCancelMyRegistration = () => {
    console.log("Cancelar minha inscrição");
  };

  const handleCancelRegistration = (registrationId: string) => {
    console.log("Cancelar inscrição:", registrationId);
  };

  const handleReactivateRegistration = (registrationId: string) => {
    console.log("Reativar inscrição:", registrationId);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Exemplo de uso individual dos componentes */}
      
      <CheckoutStatus status="completed" />
      
      <VoucherCode voucher="ABC123DEF456" />
      
      <PurchaseSummary
        registrationsAmount={5}
        legalEntity="pf"
        registrateMyself={true}
        billingDetails={mockBillingDetails}
        checkoutStatus="pending"
        onEditBilling={handleEditBilling}
        onGoToPayment={handleGoToPayment}
        onCancelAcquisition={handleCancelAcquisition}
        onRequestCancellation={handleRequestCancellation}
      />
      
      <MyRegistration
        registration={null}
        registrateMyself={true}
        checkoutType="acquire"
        onGoToRegistration={handleGoToRegistration}
        onCancelMyRegistration={handleCancelMyRegistration}
      />
      
      <VoucherStatistics
        vouchersAmount={10}
        usedVouchers={3}
      />
      
      <VoucherRegistrations
        registrations={mockRegistrations}
        onCancelRegistration={handleCancelRegistration}
        onReactivateRegistration={handleReactivateRegistration}
      />
    </Box>
  );
} 