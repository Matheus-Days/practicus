import { DocumentSnapshot, Firestore } from "firebase-admin/firestore";
import {
  CreateRegistrationRequest,
  RegistrationDocument,
  UpdateRegistrationRequest,
  UpdateRegistrationStatusRequest,
} from "./registration.types";
import { CheckoutDocument } from "../checkouts/checkout.types";

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
  firestore: Firestore,
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

    // Verificar se a compra está finalizada e válida (pending, approved, paid)
    if (checkout.status === "refunded") {
      return {
        canActivate: false,
        error: "Não é possível ativar uma inscrição cuja compra foi estornada.",
        errorCode: 403,
      };
    }

    // Verificações de consistência do modelo V2 (aplicam-se a todos, inclusive admin)
    if (!registration.checkoutId) {
      return {
        canActivate: false,
        error: "Inscrição não está vinculada a uma aquisição",
        errorCode: 403,
      };
    }

    // Verificar se a compra possui um número de inscrições
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
    attendeeUserId,
    cpf,
    eventId,
    fullName,
    isPhoneWhatsapp,
    phone,
    credentialName,
    email,
    howDidYouHearAboutUs,
    howDidYouHearAboutUsOther,
    occupation,
    useImage,
  } = body as CreateRegistrationRequest;

  return {
    checkoutId,
    attendeeUserId,
    cpf,
    eventId,
    fullName,
    isPhoneWhatsapp,
    phone,
    credentialName,
    email,
    howDidYouHearAboutUs,
    howDidYouHearAboutUsOther,
    occupation,
    useImage,
  };
}

export function validateUpdateRegistration(
  data: UpdateRegistrationRequest
): data is UpdateRegistrationRequest {
  const hasCpf = typeof data.cpf === "string" && data.cpf.trim() !== "";
  const hasFullName = typeof data.fullName === "string" && data.fullName.trim() !== "";
  const hasPhone = typeof data.phone === "string" && data.phone.trim() !== "";
  const hasCredentialName =
    typeof data.credentialName === "string" && data.credentialName.trim() !== "";
  const hasEmail = typeof data.email === "string" && data.email.trim() !== "";

  const hasIsPhoneWhatsapp = typeof data.isPhoneWhatsapp === "boolean";
  const hasUseImage = typeof data.useImage === "boolean";

  return (
    hasCpf &&
    hasFullName &&
    hasPhone &&
    hasCredentialName &&
    hasEmail &&
    hasIsPhoneWhatsapp &&
    hasUseImage
  );
}

export function extractUpdateRegistrationDataFromRequestBody(
  body: object
): UpdateRegistrationRequest {
  const {
    cpf,
    credentialName,
    email,
    fullName,
    howDidYouHearAboutUs,
    howDidYouHearAboutUsOther,
    isPhoneWhatsapp,
    occupation,
    phone,
    useImage,
  } = body as UpdateRegistrationRequest;
  return {
    cpf,
    credentialName,
    email,
    fullName,
    howDidYouHearAboutUs,
    howDidYouHearAboutUsOther,
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
  throw new Error(
    `generateRegistrationDocumentId is deprecated in schema V2 (eventId=${eventId}, userId=${userId})`
  );
}
