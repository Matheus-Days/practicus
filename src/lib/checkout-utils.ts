import type { PriceBreakpoint } from "@/app/types/events";
import { CheckoutDocument } from "@/app/api/checkouts/checkout.types";

/**
 * Preço total em centavos a partir de uma tabela de breakpoints e quantidade.
 * Usado no preview antes de existir checkout (política ainda no evento).
 */
export function calculateTotalPurchasePriceFromBreakpoints(
  breakpoints: PriceBreakpoint[] | undefined,
  amount: number
): number {
  if (!breakpoints || breakpoints.length === 0) {
    return 0;
  }

  const sortedBreakpoints = [...breakpoints].sort(
    (a, b) => a.minQuantity - b.minQuantity
  );

  const numberOfRegistrations = amount || 1;

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

/**
 * Preço total em centavos usando apenas o snapshot no checkout (priceBreakpointsAtCheckout).
 */
export function calculateTotalPurchasePrice(
  checkout: CheckoutDocument
): number {
  return calculateTotalPurchasePriceFromBreakpoints(
    checkout.priceBreakpointsAtCheckout,
    checkout.amount ?? 1
  );
}
