export type CheckoutType = "acquire" | "voucher";

export type LegalEntity = "pf" | "pj";

export type CheckoutStatus =
  | "pending" // Checkout created, but not finalized
  | "completed" // Checkout finalized (payment approved and registration created if `registrateMyself` is true or checkoutType is "voucher")
  | "refunded" // Checkout canceled and payment refunded
  | "deleted"; // Checkout marked as deleted (we do not actually delete the document)

export type BillingDetailsPF = {
  email: string;
  fullName: string;
  phone: string;
};

export type BillingDetailsPJ = {
  orgPhone: string;
  orgName: string;
  orgCnpj: string;
  orgAddress: string;
  orgZip: string;
  responsibleName: string;
  responsiblePhone: string;
  responsibleEmail: string;
};

export type CheckoutDocument = {
  checkoutType: CheckoutType;
  createdAt: Date;
  eventId: string;
  status: CheckoutStatus;
  userId: string;
  amount?: number;
  billingDetails?: BillingDetailsPF | BillingDetailsPJ;
  deletedAt?: Date;
  legalEntity?: LegalEntity;
  registrateMyself?: boolean;
  updatedAt?: Date;
  voucher?: string;
};

//#region Types for API requests/responses
export type CreateCheckoutRequest = Pick<
  CheckoutDocument,
  | "eventId"
  | "userId"
  | "checkoutType"
  | "legalEntity"
  | "billingDetails"
  | "amount"
  | "voucher"
  | "registrateMyself"
>;

export type UpdateCheckoutRequest = Partial<
  Pick<
    CheckoutDocument,
    | "checkoutType"
    | "legalEntity"
    | "billingDetails"
    | "amount"
    | "voucher"
    | "registrateMyself"
  >
>;

export type CheckoutResponse = {
  documentId: string;
  document: CheckoutDocument;
};

//#endregion
