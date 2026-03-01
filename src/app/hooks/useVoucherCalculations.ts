import { useBuyer } from "../contexts/BuyerContext";

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
  const { checkoutRegistrations, checkout } = useBuyer();

  const registrationsAmount =
    checkout?.amount ?? (checkout?.checkoutType === "acquire" ? 1 : 0);
  const complimentary = checkout?.complimentary || 0;
  const maxRegistrations = complimentary + registrationsAmount;

  const hasOwnValidRegistration = checkoutRegistrations.some(
    (reg) =>
      (reg.status === "ok" || reg.status === "pending") && reg.isMyRegistration
  );

  const totalRegistrations = hasOwnValidRegistration ? maxRegistrations - 1 : maxRegistrations;

  const usedRegistrations = checkoutRegistrations.filter(
    (reg) => (reg.status === "ok" || reg.status === "pending") && !reg.isMyRegistration
  ).length;

  const availableRegistrations = Math.max(0, totalRegistrations - usedRegistrations);

  return {
    totalRegistrations,
    usedRegistrations,
    availableRegistrations,
    hasOwnValidRegistration,
  };
}
