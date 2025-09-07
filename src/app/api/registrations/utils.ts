import { DocumentSnapshot, Firestore } from "firebase-admin/firestore";
import {
  CreateRegistrationRequest,
  RegistrationDocument,
  UpdateRegistrationRequest,
  UpdateRegistrationStatusRequest,
} from "./registration.types";
import { CheckoutDocument } from "../checkouts/checkout.types";
import { createCheckoutDocumentId } from "../checkouts/utils";

export type CanActivateRegistrationResult =
  | {
      canActivate: true;
    }
  | {
      canActivate: false;
      error: string;
      errorCode: number;
    };

export async function canActivateRegistration(
  checkoutDoc: DocumentSnapshot,
  registration: RegistrationDocument,
  isAdmin: boolean,
  firestore: Firestore,
  registrationId: string
): Promise<CanActivateRegistrationResult> {
  try {
    if (!checkoutDoc.exists) {
      return {
        canActivate: false,
        error: "Compra da inscrição não encontrada",
        errorCode: 404,
      };
    }

    const checkout = checkoutDoc.data() as CheckoutDocument;

    // Verificar se a compra está finalizada e válida
    if (checkout.status !== "completed" && checkout.status !== "pending") {
      return {
        canActivate: false,
        error: "Não é possível ativar uma inscrição cuja compra foi cancelada.",
        errorCode: 403,
      };
    }

    // A ordem dessa verificação é importante: se o usuário for admin, ele pode ativar a inscrição mesmo que a compra não tenha vagas disponíveis
    if (isAdmin) return { canActivate: true };

    // Verificar se o usuário está tentando reativar sua própria inscrição (não permitido)
    if (registrationId !== registration.checkoutId) {
      return {
        canActivate: false,
        error: "Você não pode reativar sua própria inscrição. Apenas o responsável pela compra pode fazer isso.",
        errorCode: 403,
      };
    }

    // Verificar se a compra possui um número de inscrições (checkouts do tipo "voucher" não devem ser 'pais' de uma inscrição)
    if (!checkout.amount) {
      return {
        canActivate: false,
        error: "Aquisição não possui um número de inscrições",
        errorCode: 403,
      };
    }

    // Verificar se ainda há vagas disponíveis
    // Filtra as inscrições válidas (status "ok" ou "pending") do sob responsabilidade do mesmo checkoutId
    const registrationsQuerySnapshot = await firestore
      .collection("registrations")
      .where("checkoutId", "==", registration.checkoutId)
      .where("status", "in", ["ok", "pending"])
      .get();


    const registrationsAmount = registrationsQuerySnapshot.docs.length;

    if (registrationsAmount >= checkout.amount) {
      return {
        canActivate: false,
        error: "Compra já atingiu o número máximo de inscrições ativas",
        errorCode: 403,
      };
    }

    return { canActivate: true };
  } catch (error) {
    return {
      canActivate: false,
      error: "Erro ao verificar se a inscrição pode ser ativada",
      errorCode: 500,
    };
  }
}

export function validateCreateRegistration(
  data: CreateRegistrationRequest
): data is CreateRegistrationRequest {
  if (
    data.checkoutId &&
    data.cpf &&
    data.eventId &&
    data.fullName &&
    data.phone &&
    data.userId &&
    data.credentialName &&
    data.email &&
    data.useImage
  ) {
    return true;
  }

  return false;
}

export function extractCreateRegistrationDataFromRequestBody(
  body: object
): CreateRegistrationRequest {
  const {
    checkoutId,
    cpf,
    eventId,
    fullName,
    isPhoneWhatsapp,
    phone,
    userId,
    city,
    credentialName,
    email,
    employer,
    howDidYouHearAboutUs,
    occupation,
    useImage,
  } = body as CreateRegistrationRequest;

  return {
    checkoutId,
    cpf,
    eventId,
    fullName,
    isPhoneWhatsapp,
    phone,
    userId,
    city,
    credentialName,
    email,
    employer,
    howDidYouHearAboutUs,
    occupation,
    useImage,
  };
}

export function validateUpdateRegistration(
  data: UpdateRegistrationRequest
): data is UpdateRegistrationRequest {
  if (
    data.cpf &&
    data.fullName &&
    data.isPhoneWhatsapp &&
    data.phone &&
    data.credentialName &&
    data.email &&
    data.useImage
  ) {
    return true;
  }

  return false;
}

export function extractUpdateRegistrationDataFromRequestBody(
  body: object
): UpdateRegistrationRequest {
  const {
    city,
    cpf,
    credentialName,
    email,
    employer,
    fullName,
    howDidYouHearAboutUs,
    isPhoneWhatsapp,
    occupation,
    phone,
    useImage,
  } = body as UpdateRegistrationRequest;
  return {
    city,
    cpf,
    credentialName,
    email,
    employer,
    fullName,
    howDidYouHearAboutUs,
    isPhoneWhatsapp,
    occupation,
    phone,
    useImage,
  };
}

export function validateUpdateRegistrationStatus(
  data: UpdateRegistrationStatusRequest
): data is UpdateRegistrationStatusRequest {
  if (
    data.status === "cancelled" ||
    data.status === "invalid" ||
    data.status === "ok" ||
    data.status === "pending"
  )
    return true;
  return false;
}

export function extractUpdateRegistrationStatusDataFromRequestBody(
  body: object
): UpdateRegistrationStatusRequest {
  const { status } = body as UpdateRegistrationStatusRequest;
  return { status };
}

export function generateRegistrationDocumentId(
  eventId: string,
  userId: string
): string {
  return createCheckoutDocumentId(eventId, userId);
}
