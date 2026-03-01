// implementar método POST para criar uma inscrição

import { DecodedIdToken } from "firebase-admin/auth";
import { NextRequest } from "next/server";
import { validateAuth } from "../../../lib/auth-utils";
import {
  canActivateRegistration,
  extractCreateRegistrationDataFromRequestBody,
  validateCreateRegistration,
} from "./utils";
import {
  CreateRegistrationRequest,
  RegistrationDocument,
} from "./registration.types";
import { firestore } from "../../../lib/firebase-admin";
import {
  createErrorResponse,
  createSuccessResponse,
  isUserAdmin,
} from "../utils";
import { CheckoutDocument, CheckoutStatus } from "../checkouts/checkout.types";

export async function POST(request: NextRequest) {
  const body = await request.json();

  const validBody = validateCreateRegistration(body);
  if (!validBody) {
    return createErrorResponse(
      "Valores inválidos para criação da inscrição",
      400
    );
  }

  const data = extractCreateRegistrationDataFromRequestBody(body);

  try {
    let authenticatedUser: DecodedIdToken;
    let isAdmin = false;

    try {
      authenticatedUser = await validateAuth(request);
    } catch (authError) {
      return createErrorResponse(
        "Não autorizado. Token de autenticação inválido ou expirado.",
        401
      );
    }

    if (!data.checkoutId) {
      return createErrorResponse(
        "checkoutId é obrigatório para criar inscrição",
        400
      );
    }

    const checkoutDoc = await firestore
      .collection("checkouts")
      .doc(data.checkoutId)
      .get();

    if (!checkoutDoc.exists) {
      return createErrorResponse("Compra da inscrição não encontrada", 404);
    }

    const checkout = checkoutDoc.data() as CheckoutDocument;

    // Permissão:
    // - admin pode criar para qualquer checkout
    // - buyer (dono do checkout) pode criar inscrições para si ou para terceiros (sem attendeeUserId)
    isAdmin = await isUserAdmin(authenticatedUser, firestore);
    const isCheckoutOwner = checkout.userId === authenticatedUser.uid;
    if (!isAdmin && !isCheckoutOwner) {
      return createErrorResponse(
        "Usuário não tem permissão para criar inscrição neste checkout",
        403
      );
    }

    const createdByRole = isAdmin ? ("admin" as const) : ("buyer" as const);
    const createdByUserId = authenticatedUser.uid;

    const registrationDoc = generateRegistrationDocument(
      data,
      checkout,
      createdByRole,
      createdByUserId
    );

    const registrationDocId = crypto.randomUUID();

    const validationResult = await canActivateRegistration(
      checkoutDoc,
      registrationDoc,
      isAdmin,
      firestore
    );

    if (!validationResult.canActivate) {
      return createErrorResponse(
        validationResult.error,
        validationResult.errorCode
      );
    }

    const registrationDocRef = firestore
      .collection("registrations")
      .doc(registrationDocId);

    const registrationDocExists = await registrationDocRef.get();

    if (registrationDocExists.exists) {
      return createErrorResponse("Inscrição já existe", 400);
    }

    await registrationDocRef.set(registrationDoc);

    return createSuccessResponse(
      {
        documentId: registrationDocId,
        document: registrationDoc,
      },
      201
    );
  } catch (error) {
    return createErrorResponse("Erro ao criar inscrição", 500);
  }
}

function generateRegistrationDocument(
  data: CreateRegistrationRequest,
  checkout: CheckoutDocument,
  createdByRole: "buyer" | "admin",
  createdByUserId: string
): RegistrationDocument {
  return {
    schemaVersion: 2,
    createdByRole,
    createdByUserId,
    eventId: data.eventId,
    checkoutId: data.checkoutId,
    attendeeUserId: data.attendeeUserId,
    cpf: data.cpf,
    credentialName: data.credentialName,
    email: data.email,
    fullName: data.fullName,
    howDidYouHearAboutUs: data.howDidYouHearAboutUs,
    howDidYouHearAboutUsOther: data.howDidYouHearAboutUsOther,
    isPhoneWhatsapp: data.isPhoneWhatsapp,
    occupation: data.occupation,
    phone: data.phone,
    useImage: data.useImage,
    createdAt: new Date(),
    status:
      checkout.status === "paid" || checkout.status === "approved"
        ? "ok"
        : "pending",
  };
}
