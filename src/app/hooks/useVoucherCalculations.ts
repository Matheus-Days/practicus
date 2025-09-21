import { useCheckout } from "../contexts/CheckoutContext";

export interface VoucherCalculations {
  totalRegistrations: number;
  usedRegistrations: number;
  availableRegistrations: number;
}

/**
 * Hook customizado para calcular estatísticas de vouchers de forma padronizada
 * Centraliza a lógica de cálculo de registrations disponíveis, utilizadas e totais
 */
export function useVoucherCalculations(): VoucherCalculations {
  const { checkoutRegistrations, registration, registrationsAmount } =
    useCheckout();

  const totalRegistrations = registrationsAmount;

  const usedRegistrations = checkoutRegistrations.filter(
    (reg) => reg.status === "ok" || reg.status === "pending"
  ).length;

  const availableRegistrations = totalRegistrations - usedRegistrations;

  return {
    totalRegistrations,
    usedRegistrations,
    availableRegistrations,
  };
}
