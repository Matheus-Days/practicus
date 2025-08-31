import { EventDocument } from "@/app/types/events";
import { CheckoutDocument } from "@/app/api/checkouts/checkout.types";

/**
 * Calcula o preço total da compra baseado no evento e checkout
 * Retorna o valor total em centavos
 */
export function calculateTotalPurchasePrice(
  event: EventDocument,
  checkout: CheckoutDocument
): number {
  // Se não há priceBreakpoints, não é possível calcular
  if (!event.priceBreakpoints || event.priceBreakpoints.length === 0) {
    return 0;
  }

  // Ordena os breakpoints por quantidade mínima (crescente)
  const sortedBreakpoints = [...event.priceBreakpoints].sort(
    (a, b) => a.minQuantity - b.minQuantity
  );

  // Usa o amount do checkout como número de inscrições
  const numberOfRegistrations = checkout.amount || 1;
  
  // Encontra o breakpoint aplicável para o número de inscrições
  let applicableBreakpoint = sortedBreakpoints[0];

  for (const breakpoint of sortedBreakpoints) {
    if (numberOfRegistrations >= breakpoint.minQuantity) {
      applicableBreakpoint = breakpoint;
    } else {
      break;
    }
  }

  return numberOfRegistrations * applicableBreakpoint.priceInCents;
}
