import { RegistrationDocument, RegistrationFormData } from "../registrations/registration.types";

export type VoucherDocument = {
  active: boolean;
  checkoutId: string;
  createdAt: Date;
  updatedAt?: Date;
};

export type ValidateVoucherResponse =
  | {
      valid: true;
    }
  | {
      valid: false;
      message: string;
    };

export type CreateVoucherCheckoutRequest = {
  voucher: string;
  eventId: string;
  userId: string;
  registration: RegistrationFormData;
}

export type CreateVoucherCheckoutResponse = {
  registrationId: string;
  registration: RegistrationDocument;
}

export type VoucherActivateRequest = {
  active: boolean;
}
