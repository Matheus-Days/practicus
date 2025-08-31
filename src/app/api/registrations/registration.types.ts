export type RegistrationFormData = {
  city?: string;
  cpf: string;
  credentialName?: string;
  email?: string;
  employer?: string;
  fullName: string;
  howDidYouHearAboutUs?: string;
  isPhoneWhatsapp: boolean;
  occupation?: string;
  phone: string;
  useImage?: boolean;
};

export type RegistrationStatus = "ok" | "cancelled" | "invalid" | "pending";

export type RegistrationDocument = {
  eventId: string;
  userId: string;
  checkoutId: string;
  createdAt: Date;
  updatedAt?: Date;
  status: RegistrationStatus;
} & RegistrationFormData;

//#region Types for API requests/responses
export type CreateRegistrationRequest = Pick<
  RegistrationDocument,
  "eventId" | "userId" | "checkoutId"
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
