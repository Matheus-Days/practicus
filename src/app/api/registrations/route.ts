// implementar método POST para criar uma inscrição

import { DecodedIdToken } from "firebase-admin/auth";
import { NextRequest } from "next/server";
import { validateAuth } from "../../../lib/auth-utils";
import {
  canActivateRegistration,
  extractCreateRegistrationDataFromRequestBody,
  generateRegistrationDocumentId,
  isUserAdmin,
  validateCreateRegistration,
} from "./utils";
import {
  CreateRegistrationRequest,
  RegistrationDocument,
} from "./registration.types";
import { firestore } from "../../../lib/firebase-admin";
import { createErrorResponse, createSuccessResponse } from "../utils";

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

    const registrationDoc = generateRegistrationDocument(data);

    const registrationDocId = generateRegistrationDocumentId(
      data.eventId,
      data.userId
    );

    const validationResult = await canActivateRegistration(
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
  data: CreateRegistrationRequest
): RegistrationDocument {
  return {
    ...data,
    createdAt: new Date(),
    status: "ok",
  };
}
