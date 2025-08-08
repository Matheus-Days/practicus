"use client";

import { useCheckout } from "../../contexts/CheckoutContext";
import Dashboard from "./Dashboard";
import BillingDetails from "./BillingDetails";

export default function CheckoutFlow() {
  const { checkout, currentStep, setCurrentStep } = useCheckout();

  // Se não há checkout ou está deletado, mostrar BillingDetails
  if (!checkout || checkout.status === "deleted") {
    return <BillingDetails />;
  }

  // Se o usuário está na etapa de billing-details, mostrar BillingDetails
  if (currentStep === "billing-details") {
    return <BillingDetails />;
  }

  // Caso contrário, mostrar Dashboard
  return (
    <Dashboard
      onEditBilling={() => setCurrentStep("billing-details")}
      onGoToPayment={() => setCurrentStep("payment")}
      onGoToRegistration={() => setCurrentStep("registration-form")}
    />
  );
} 