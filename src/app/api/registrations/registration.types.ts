export type RegistrationFormData = {
  cpf: string;
  credentialName?: string;
  email?: string;
  fullName: string;
  howDidYouHearAboutUs?: string;
  howDidYouHearAboutUsOther?: string;
  isPhoneWhatsapp: boolean;
  occupation?: string;
  phone: string;
  useImage?: boolean;
};

export type RegistrationStatus = "ok" | "cancelled" | "invalid" | "pending";

export type RegistrationDocument = {
  /** Schema version for breaking migrations */
  schemaVersion: 2;
  eventId: string;
  /** Present when the registration is linked to a purchase (buyer/admin/attendee via voucher). */
  checkoutId?: string;
  /** Present when this registration belongs to an authenticated attendee user. */
  attendeeUserId?: string;
  /** User that created this registration (buyer/admin/attendee). */
  createdByUserId?: string;
  /** Role of the creator within the flows. */
  createdByRole: "attendee" | "buyer" | "admin";
  createdAt: Date;
  updatedAt?: Date;
  status: RegistrationStatus;
} & RegistrationFormData;

//#region Types for API requests/responses
export type CreateRegistrationRequest = Pick<
  RegistrationDocument,
  "eventId" | "checkoutId" | "attendeeUserId"
> &
  RegistrationFormData;

export type UpdateRegistrationRequest = Partial<RegistrationFormData>;

export type UpdateRegistrationStatusRequest = Pick<
  RegistrationDocument,
  "status"
>;

export type RegistrationResponse = {
  documentId: string;
  document: RegistrationDocument;
};
//#endregion
