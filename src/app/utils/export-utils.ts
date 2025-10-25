import { CheckoutData } from "../types/checkout";
import { RegistrationData } from "../hooks/registrationAPI";
import { calculateTotalPurchasePrice } from "@/lib/checkout-utils";
import { RegistrationType } from "../components/admin/RegistrationsTable";
import { isPaymentByCommitment } from "../api/checkouts/utils";
import { EventData } from "../types/events";

export const formatDate = (date: any): string => {
  if (!date) return "";
  const dateObj = date.toDate ? date.toDate() : new Date(date);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(dateObj);
};

export const formatCurrency = (amountInCents: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amountInCents / 100);
};

export const formatCPF = (cpf: string): string => {
  if (!cpf) return "";
  const cleanCPF = cpf.replace(/\D/g, "");
  return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};

export const formatCNPJ = (cnpj: string): string => {
  if (!cnpj) return "";
  const cleanCNPJ = cnpj.replace(/\D/g, "");
  return cleanCNPJ.replace(
    /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
    "$1.$2.$3/$4-$5"
  );
};

export const getCheckoutStatusDisplay = (status: string) => {
  switch (status) {
    case "pending":
      return "Pendente";
    case "completed":
      return "Concluído";
    case "deleted":
      return "Cancelado";
    default:
      return "Desconhecido";
  }
};

export const getRegistrationStatusDisplay = (status: string) => {
  switch (status) {
    case "ok":
      return "Confirmada";
    case "cancelled":
      return "Cancelada";
    case "invalid":
      return "Inválida";
    case "pending":
      return "Pendente";
    default:
      return "Desconhecido";
  }
};

export const formatCheckoutForExport = (
  checkout: CheckoutData,
  eventData: EventData
): Record<string, any> => {
  const billingDetails = checkout.billingDetails;
  const isAdmin = checkout.checkoutType === "admin";
  const isPF = checkout.legalEntity === "pf";

  return {
    "ID da aquisição": checkout.id,
    "Tipo de pessoa": isAdmin ? "" : isPF ? "Física" : "Jurídica",
    Situação: isAdmin ? "" : getCheckoutStatusDisplay(checkout.status),
    "Valor total": isAdmin
      ? ""
      : checkout.amount
        ? formatCurrency(calculateTotalPurchasePrice(eventData, checkout))
        : "",
    "Inscrições adquiridas": isAdmin ? "" : checkout.amount || 0,
    Cortesias: isAdmin ? "" : checkout.complimentary || 0,
    Voucher: isAdmin ? "" : checkout.voucher || "",

    "Data de criação": isAdmin ? "" : formatDate(checkout.createdAt),
    "Última atualização": isAdmin
      ? ""
      : checkout.updatedAt
        ? formatDate(checkout.updatedAt)
        : "",

    "Tipo de pagamento": isAdmin
      ? ""
      : isPaymentByCommitment(checkout)
        ? "Empenho"
        : "Comum",

    // Campos para pessoa física
    "Nome completo (comprador)":
      billingDetails && "fullName" in billingDetails
        ? billingDetails.fullName
        : "",
    "Email (comprador)":
      billingDetails && "fullName" in billingDetails
        ? billingDetails.email
        : "",
    "Telefone (comprador)":
      billingDetails && "fullName" in billingDetails
        ? billingDetails.phone
        : "",

    // Campos para pessoa jurídica
    "Nome da organização":
      billingDetails && "orgName" in billingDetails
        ? billingDetails.orgName
        : "",
    CNPJ:
      billingDetails && "orgName" in billingDetails
        ? formatCNPJ(billingDetails.orgCnpj)
        : "",
    "UF da organização":
      billingDetails && "orgName" in billingDetails
        ? billingDetails.orgState
        : "",
    "Município da organização":
      billingDetails && "orgName" in billingDetails
        ? billingDetails.orgCity
        : "",
    "Logradouro da organização":
      billingDetails && "orgName" in billingDetails
        ? billingDetails.orgAddress
        : "",
    CEP:
      billingDetails && "orgName" in billingDetails
        ? billingDetails.orgZip
        : "",
    "Telefone da organização":
      billingDetails && "orgName" in billingDetails
        ? billingDetails.orgPhone
        : "",
    "Nome do responsável":
      billingDetails && "orgName" in billingDetails
        ? billingDetails.responsibleName
        : "",
    "Telefone do responsável":
      billingDetails && "orgName" in billingDetails
        ? billingDetails.responsiblePhone
        : "",
    "Email do responsável":
      billingDetails && "orgName" in billingDetails
        ? billingDetails.responsibleEmail
        : "",
  };
};

export const formatRegistrationForExport = (
  registration: RegistrationData & {
    checkout?: CheckoutData;
    registrationType: RegistrationType;
  },
  eventData: EventData
): Record<string, any> => {
  let registrationTypeDisplay = "";
  if (registration.registrationType === "complimentary")
    registrationTypeDisplay = "Cortesia";
  else if (registration.registrationType === "commitment")
    registrationTypeDisplay = "Empenho";
  else if (registration.registrationType === "commom")
    registrationTypeDisplay = "Comum";

  const checkoutColumns = registration.checkout
    ? formatCheckoutForExport(registration.checkout, eventData)
    : {};

  return {
    "ID da inscrição": registration.id,
    "Tipo de inscrição": registrationTypeDisplay,
    "Nome completo": registration.fullName,
    Email: registration.email,
    Telefone: registration.phone || "",
    CPF: formatCPF(registration.cpf),
    Situação: getRegistrationStatusDisplay(registration.status),
    "Data de inscrição": formatDate(registration.createdAt),
    "Última atualização": registration.updatedAt
      ? formatDate(registration.updatedAt)
      : "",
    "Nome para crachá": registration.credentialName || "",
    "Como soube do evento": registration.howDidYouHearAboutUs || "",
    "Como soube do evento (outro)":
      registration.howDidYouHearAboutUsOther || "",
    Ocupação: registration.occupation || "",
    "Telefone é WhatsApp": registration.isPhoneWhatsapp ? "Sim" : "Não",
    "Autoriza uso de imagem": registration.useImage ? "Sim" : "Não",
    ...checkoutColumns,
  };
};
