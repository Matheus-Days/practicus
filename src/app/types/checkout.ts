import { User } from "firebase/auth";
import {
  BillingDetailsPF,
  BillingDetailsPJ,
  CheckoutDocument,
  CheckoutType,
  LegalEntity,
  UpdateCheckoutRequest,
} from "../api/checkouts/checkout.types";
import { RegistrationData, RegistrationMinimal } from "../hooks/registrationAPI";
import { RegistrationFormData, RegistrationResponse } from "../api/registrations/registration.types";
import { VoucherData } from "../hooks/voucherAPI";
import { EventData } from "../types/events";

export type CheckoutStep =
  | "select-type" // Selecionar tipo de checkout (acquire ou voucher)
  | "select-legal-entity" // Selecionar PF ou PJ
  | "voucher-validation" // Para voucher: digitar código do voucher
  | "billing-details" // Para PF ou PJ: preencher dados de faturamento, quantidade de inscrições e se é `registrateMyself`
  | "registration-form" // Quando `registrateMyself` é true ou checkoutType é "voucher": preencher dados do participante
  | "overview" // Visualizar dados do checkout (se checkoutType é "acquire") e dados de inscrição se `registrateMyself` é true ou checkoutType é "voucher", podendo voltar para editar
  | "payment" // Se checkoutType é "acquire": tela com vários estados de fluxo de pagamento, é chamada após o overview se o pagamento estiver pendente
  | "commitment"; // Para pagamento por empenho: gerenciar dados do empenho

export type CheckoutData = CheckoutDocument & {
  id: string;
};

export interface CheckoutContextType {
  user: User | null;
  eventId: string;
  event: EventData | null;
  isEventClosed: boolean;
  checkout: CheckoutData | null;
  registration: RegistrationData | null;
  checkoutRegistrations: Array<RegistrationMinimal>;
  loading: boolean;
  error: string | null;
  currentStep: CheckoutStep;
  // Informações do checkout esmiuçadas
  checkoutType: CheckoutType | null;
  billingDetails: BillingDetailsPF | BillingDetailsPJ | null;
  registrationsAmount: number;
  registrateMyself: boolean;
  legalEntity: LegalEntity | null;
  voucher: string | null;
  voucherData: VoucherData | null;
  voucherLoading: boolean;
  formData: Partial<RegistrationFormData>;
  // Funções de preenchimento do checkout
  setBillingDetails: (
    billingDetails: BillingDetailsPF | BillingDetailsPJ | null
  ) => void;
  setRegistrationsAmount: (amount: number) => void;
  setRegistrateMyself: (registrateMyself: boolean) => void;
  setLegalEntity: (legalEntity: LegalEntity | null) => void;
  setVoucher: (voucher: string | null) => void;
  setCheckoutType: (checkoutType: CheckoutType | null) => void;
  // Funções de checkout
  createCheckout: () => Promise<void>;
  createVoucherCheckout: (voucherCode: string, registrationData: RegistrationFormData) => Promise<void>;
  updateCheckout: (updateData: UpdateCheckoutRequest) => Promise<void>;
  deleteCheckout: () => Promise<void>;
  // Funções de registration
  createRegistration: (
    registrationData: RegistrationFormData,
    voucherId?: string
  ) => Promise<void>;
  updateRegistration: (updateData: Partial<RegistrationFormData>) => Promise<void>;
  updateRegistrationStatus: (registrationId: string, status: RegistrationData["status"]) => Promise<RegistrationResponse>;
  // Funções de voucher
  toggleVoucherActiveStatus: (active: boolean) => Promise<void>;
  // Funções de navegação
  setCurrentStep: (step: CheckoutStep) => void;
  updateFormData: (data: Partial<RegistrationFormData>) => void;
  resetCheckout: () => void;
}
