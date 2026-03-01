export type CheckoutType = "acquire" | "admin";

export type LegalEntity = "pf" | "pj";

export type CheckoutStatus =
  | "pending" // Awaiting payment; associated registrations have registration status pending
  | "approved" // Admin recognized validity of payment intention (e.g. commitment); registrations ok
  | "paid" // Admin recognized full payment; registrations ok
  | "refunded"; // Payment refunded or checkout cancelled; no new voucher registrations; existing registrations become invalid

export type BillingDetailsPF = {
  email: string;
  fullName: string;
  phone: string;
};

export type BillingDetailsPJ = {
  orgPhone: string;
  orgName: string;
  orgDepartment?: string;
  orgCnpj: string;
  orgAddress: string;
  orgCity: string;
  orgState: string;
  orgZip: string;
  responsibleName: string;
  responsiblePhone: string;
  responsibleEmail: string;
  paymentByCommitment: boolean;
};

export type Attachment = {
  fileName: string;
  contentType: string;
  storagePath: string;
  uploadedAt: Date;
};

export type Payment = {
  method: "card" | "boleto" | "pix" | "empenho";
  value: number;
  /** Only for commitment payment */
  commitmentAttachment?: Attachment;
  /** For both commitment and common payment */
  paymentAttachment?: Attachment;
  /** For both; uploaded by Practicus team */
  receiptAttachment?: Attachment;
  externalData?: object;
};

export type CheckoutDocument = {
  checkoutType: CheckoutType;
  createdAt: Date;
  eventId: string;
  status: CheckoutStatus;
  userId: string;
  /** Number of tickets being negotiated */
  amount?: number;
  /** Number of complimentary tickets */
  complimentary?: number;
  billingDetails?: BillingDetailsPF | BillingDetailsPJ;
  deletedAt?: Date;
  legalEntity?: LegalEntity;
  registrateMyself?: boolean;
  updatedAt?: Date;
  voucher?: string;
  payment: Payment;
  /** Total value of the checkout in cents */
  totalValue?: number;
};

/** Checkout document archived in deletedCheckouts when a purchase is cancelled (same fields as CheckoutDocument + deletedAt). */
export type DeletedCheckoutDocument = CheckoutDocument & {
  deletedAt: Date;
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

export type UpdateCheckoutStatusRequest = Pick<CheckoutDocument, "status">;

export type DeleteCommitmentAttachmentRequest = {
  attachmentType: "commitment" | "payment";
};

//#endregion
