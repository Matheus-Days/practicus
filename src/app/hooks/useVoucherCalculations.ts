import { useCheckout } from "../contexts/CheckoutContext";

export interface VoucherCalculations {
  totalRegistrations: number;
  usedRegistrations: number;
  availableRegistrations: number;
  hasOwnValidRegistration: boolean;
}

/**
 * Hook customizado para calcular estatísticas de vouchers de forma padronizada
 * Centraliza a lógica de cálculo de registrations disponíveis, utilizadas e totais
 */
export function useVoucherCalculations(): VoucherCalculations {
  const { checkoutRegistrations, registrationsAmount } = useCheckout();

  const hasOwnValidRegistration = checkoutRegistrations.some(
    (reg) =>
      (reg.status === "ok" || reg.status === "pending") && reg.isMyRegistration
  );

  const totalRegistrations = hasOwnValidRegistration ? registrationsAmount - 1 : registrationsAmount;

  const usedRegistrations = checkoutRegistrations.filter(
    (reg) => (reg.status === "ok" || reg.status === "pending") && !reg.isMyRegistration
  ).length;

  const availableRegistrations = totalRegistrations - usedRegistrations;

  return {
    totalRegistrations,
    usedRegistrations,
    availableRegistrations,
    hasOwnValidRegistration,
  };
}
