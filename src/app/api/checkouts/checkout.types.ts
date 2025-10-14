export type CheckoutType = "acquire" | "voucher" | "admin";

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

export type CommitmentPayment = {
  method: "empenho";
  status: "pending" | "committed" | "paid";
  value: number;
  commitmentAttachment?: Attachment;
  paymentAttachment?: Attachment;
};

export type CommomPayment = {
  method: "card" | "boleto" | "pix";
  status: "pending" | "paid" | "refunded";
  value: number;
  receiptAttachment?: Attachment;
  externalData?: object;
};

export type Payment = CommitmentPayment | CommomPayment;

export type CheckoutDocument = {
  checkoutType: CheckoutType;
  createdAt: Date;
  eventId: string;
  status: CheckoutStatus;
  userId: string;
  amount?: number;
  complimentary?: number;
  billingDetails?: BillingDetailsPF | BillingDetailsPJ;
  deletedAt?: Date;
  legalEntity?: LegalEntity;
  registrateMyself?: boolean;
  updatedAt?: Date;
  voucher?: string;
  payment?: Payment;
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

export type UpdateCommitmentStatusRequest = Pick<CommitmentPayment, "status">;

//#endregion
