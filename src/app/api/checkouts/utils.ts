import {
  CheckoutDocument,
  CreateCheckoutRequest,
  LegalEntity,
  UpdateCheckoutRequest,
} from "./checkout.types";

//#region Validation functions
export function validateCreateCheckoutRequest(data: any): boolean {
  if (!data.eventId || !data.userId) {
    return false;
  }

  if (!data.checkoutType || !["acquire", "admin"].includes(data.checkoutType)) {
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
    paymentByCommitment,
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
    paymentByCommitment,
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
    paymentByCommitment,
  } = body as UpdateCheckoutRequest;
  return {
    amount,
    voucher,
    billingDetails,
    checkoutType,
    legalEntity,
    registrateMyself,
    paymentByCommitment,
  };
}

/** Define `payment.method` a partir do parâmetro de raiz (criação). */
export function paymentMethodFromCommitmentRequest(
  legalEntity: LegalEntity | undefined,
  paymentByCommitment: boolean | undefined
): CheckoutDocument["payment"]["method"] {
  if (legalEntity === "pj" && paymentByCommitment === true) {
    return "empenho";
  }
  return "card";
}

/**
 * PUT: retorna o novo `payment.method` quando há sinal explícito de empenho ou mudança para PF;
 * `null` = não alterar método.
 */
export function resolvePutPaymentMethod(
  checkoutDoc: CheckoutDocument,
  updateData: UpdateCheckoutRequest
): CheckoutDocument["payment"]["method"] | null {
  const touchesCommitmentRelevant =
    updateData.billingDetails !== undefined ||
    updateData.legalEntity !== undefined ||
    updateData.paymentByCommitment !== undefined;

  if (!touchesCommitmentRelevant) {
    return null;
  }

  const effectiveLegal: LegalEntity | undefined =
    updateData.legalEntity ?? checkoutDoc.legalEntity;

  if (effectiveLegal === "pf") {
    return "card";
  }

  let flag: boolean | undefined = updateData.paymentByCommitment;
  if (
    flag === undefined &&
    updateData.billingDetails &&
    "paymentByCommitment" in updateData.billingDetails &&
    typeof (updateData.billingDetails as { paymentByCommitment?: boolean })
      .paymentByCommitment === "boolean"
  ) {
    flag = (updateData.billingDetails as { paymentByCommitment: boolean })
      .paymentByCommitment;
  }

  if (flag !== undefined) {
    return paymentMethodFromCommitmentRequest("pj", flag);
  }

  return null;
}

export function createCheckoutDocument(
  data: CreateCheckoutRequest
): CheckoutDocument {
  const dateNow = new Date();
  const { paymentByCommitment, voucher: _clientVoucher, ...restData } = data;
  const payment: CheckoutDocument["payment"] = {
    method: paymentMethodFromCommitmentRequest(
      data.legalEntity,
      paymentByCommitment
    ),
    value: 0,
  };
  return {
    ...restData,
    billingDetails: data.billingDetails,
    createdAt: dateNow,
    updatedAt: dateNow,
    status: "pending",
    payment,
  };
}

export function createCheckoutDocumentId(
  eventId: string,
  userUid: string
): string {
  return `${eventId}_${userUid}`;
}
//#endregion
