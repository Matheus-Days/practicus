import { CheckoutData } from "../types/checkout";
import { RegistrationData } from "../hooks/registrationAPI";
import { calculateTotalPurchasePrice } from "@/lib/checkout-utils";
import { RegistrationType } from "../components/admin/RegistrationsTable";
import { isPaymentByCommitment } from "../api/checkouts/utils";

export const formatDate = (date: any): string => {
  if (!date) return "-";
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
  if (!cpf) return "-";
  const cleanCPF = cpf.replace(/\D/g, "");
  return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};

export const formatCNPJ = (cnpj: string): string => {
  if (!cnpj) return "-";
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
  eventData: any
): Record<string, any> => {
  const billingDetails = checkout.billingDetails;
  const isPF = checkout.legalEntity === "pf";

  return {
    "ID do Checkout": checkout.id,
    "Tipo de Pessoa": isPF ? "Física" : "Jurídica",
    Status: getCheckoutStatusDisplay(checkout.status),
    "Valor Total": checkout.amount
      ? formatCurrency(calculateTotalPurchasePrice(eventData, checkout))
      : "-",
    "Inscrições adquiridas": checkout.amount || 0,
    Cortesias: checkout.complimentary || 0,
    Voucher: checkout.voucher || "-",

    "Data de Criação": formatDate(checkout.createdAt),
    "Última Atualização": checkout.updatedAt
      ? formatDate(checkout.updatedAt)
      : "-",

    "Tipo de pagamento": isPaymentByCommitment(checkout) ? "Empenho" : "Comum",

    ...(isPF && billingDetails && "fullName" in billingDetails
      ? {
          "Nome Completo": billingDetails.fullName,
          Email: billingDetails.email,
          Telefone: billingDetails.phone,
        }
      : {}),

    ...(!isPF && billingDetails && "orgName" in billingDetails
      ? {
          "Nome da Organização": billingDetails.orgName,
          CNPJ: formatCNPJ(billingDetails.orgCnpj),
          "UF da Organização": billingDetails.orgState,
          "Município da Organização": billingDetails.orgCity,
          "Logradouro da Organização": billingDetails.orgAddress,
          CEP: billingDetails.orgZip,
          "Telefone da Organização": billingDetails.orgPhone,
          "Nome do Responsável": billingDetails.responsibleName,
          "Telefone do Responsável": billingDetails.responsiblePhone,
          "Email do Responsável": billingDetails.responsibleEmail,
        }
      : {}),
  };
};

export const formatRegistrationForExport = (
  registration: RegistrationData & { registrationType: RegistrationType }
): Record<string, any> => {
  let registrationTypeDisplay = "";
  if (registration.registrationType === "complimentary")
    registrationTypeDisplay = "Cortesia";
  else if (registration.registrationType === "commitment")
    registrationTypeDisplay = "Empenho";
  else if (registration.registrationType === "commom")
    registrationTypeDisplay = "Comum";
  return {
    "ID da Inscrição": registration.id,
    "Tipo de Inscrição": registrationTypeDisplay,
    "Nome Completo": registration.fullName,
    Email: registration.email,
    Telefone: registration.phone || "-",
    CPF: formatCPF(registration.cpf),
    Situação: getRegistrationStatusDisplay(registration.status),
    "Data de Inscrição": formatDate(registration.createdAt),
    "Última atualização": registration.updatedAt
      ? formatDate(registration.updatedAt)
      : "-",
    "ID do Checkout": registration.checkoutId,
    "Nome no Credencial": registration.credentialName || "-",
    "Como soube do evento": registration.howDidYouHearAboutUs || "-",
    "Como soube do evento (outro)":
      registration.howDidYouHearAboutUsOther || "-",
    Ocupação: registration.occupation || "-",
    "Telefone é WhatsApp": registration.isPhoneWhatsapp ? "Sim" : "Não",
    "Autoriza uso de imagem": registration.useImage ? "Sim" : "Não",
  };
};
