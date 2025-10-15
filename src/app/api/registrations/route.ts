// implementar método POST para criar uma inscrição

import { DecodedIdToken } from "firebase-admin/auth";
import { NextRequest } from "next/server";
import { validateAuth } from "../../../lib/auth-utils";
import {
  canActivateRegistration,
  extractCreateRegistrationDataFromRequestBody,
  generateRegistrationDocumentId,
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
import { isPaymentByCommitment } from "../checkouts/utils";

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

    if (authenticatedUser.uid !== data.userId) {
      isAdmin = await isUserAdmin(authenticatedUser, firestore);
      if (!isAdmin) {
        return createErrorResponse(
          "Usuário não tem permissão para criar inscrição",
          403
        );
      }
    }

    const checkoutDoc = await firestore
      .collection("checkouts")
      .doc(data.checkoutId)
      .get();
    const checkout = checkoutDoc.data() as CheckoutDocument;
    const registrationDoc = generateRegistrationDocument(data, checkout);

    const registrationDocId = generateRegistrationDocumentId(
      data.eventId,
      data.userId
    );

    const validationResult = await canActivateRegistration(
      checkoutDoc,
      registrationDoc,
      isAdmin,
      firestore,
      registrationDocId
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
  checkout: CheckoutDocument
): RegistrationDocument {
  return {
    ...data,
    createdAt: new Date(),
    status:
      checkout.status === "completed" || isPaymentByCommitment(checkout)
        ? "ok"
        : "pending",
  };
}
