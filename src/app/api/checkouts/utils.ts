import {
  CheckoutDocument,
  CreateCheckoutRequest,
  UpdateCheckoutRequest,
} from "./checkout.types";

//#region Validation functions
export function validateCreateCheckoutRequest(data: any): boolean {
  if (!data.eventId || !data.userId) {
    return false;
  }

  if (
    !data.checkoutType ||
    !["acquire", "voucher"].includes(data.checkoutType)
  ) {
    return false;
  }

  return true;
}

// Validação de dados para atualização de checkout
export function validateUpdateCheckoutRequest(data: any): boolean {
  // TODO: Implementar validação completa dos dados
  if (data.status) {
    return false;
  }

  if (data.amount && typeof data.amount !== "number") {
    return false;
  }

  return true;
}
//#endregion

//#region Helper functions
export function extractCreateCheckoutDataFromRequestBody(
  body: object
): CreateCheckoutRequest {
  const {
    eventId,
    userId,
    checkoutType,
    legalEntity,
    billingDetails,
    amount,
    voucher,
    registrateMyself,
  } = body as CreateCheckoutRequest;
  return {
    eventId,
    userId,
    checkoutType,
    legalEntity,
    billingDetails,
    amount,
    voucher,
    registrateMyself,
  };
}

export function extractUpdateCheckoutDataFromRequestBody(
  body: object
): UpdateCheckoutRequest {
  const {
    amount,
    voucher,
    billingDetails,
    checkoutType,
    legalEntity,
    registrateMyself,
  } = body as UpdateCheckoutRequest;
  return {
    amount,
    voucher,
    billingDetails,
    checkoutType,
    legalEntity,
    registrateMyself,
  };
}

export function createCheckoutDocument(
  data: CreateCheckoutRequest
): CheckoutDocument {
  const dateNow = new Date();
  return {
    ...data,
    createdAt: dateNow,
    updatedAt: dateNow,
    status: "pending",
  };
}

export function createCheckoutDocumentId(
  eventId: string,
  userUid: string
): string {
  return `${eventId}_${userUid}`;
}

export function isPaymentByCommitment(checkout: CheckoutDocument): boolean {
  if (!checkout.billingDetails) return false;
  if ('paymentByCommitment' in checkout.billingDetails) {
    return checkout.billingDetails.paymentByCommitment;
  }
  return false;
}
//#endregion
