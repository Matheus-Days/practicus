import { NextRequest } from "next/server";
import { validateAuth } from "../../../../lib/auth-utils";
import { DecodedIdToken } from "firebase-admin/auth";
import {
  RegistrationDocument,
  RegistrationResponse,
} from "../registration.types";
import { firestore } from "../../../../lib/firebase-admin";
import {
  validateUpdateRegistration,
  extractUpdateRegistrationDataFromRequestBody,
} from "../utils";
import {
  createErrorResponse,
  createSuccessResponse,
  isUserAdmin,
} from "../../utils";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const body = await request.json();

  const validBody = validateUpdateRegistration(body);
  if (!validBody) {
    return createErrorResponse(
      "Dados inválidos para atualização da inscrição",
      400
    );
  }

  const updateData = extractUpdateRegistrationDataFromRequestBody(body);

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

    const registrationDoc = await firestore
      .collection("registrations")
      .doc(id)
      .get();

    if (!registrationDoc.exists) {
      return createErrorResponse("Inscrição não encontrada", 404);
    }

    const registration = registrationDoc.data() as RegistrationDocument;

    // Verificar permissões: apenas o dono da inscrição ou um admin pode atualizar
    if (registration.attendeeUserId !== authenticatedUser.uid) {
      isAdmin = await isUserAdmin(authenticatedUser, firestore);
      if (!isAdmin) {
        return createErrorResponse(
          "Usuário não tem permissão para atualizar esta inscrição",
          403
        );
      }
    }

    // Atualizar o documento com os novos dados e timestamp
    const timestamp = new Date();
    await firestore
      .collection("registrations")
      .doc(id)
      .update({
        ...updateData,
        updatedAt: timestamp,
      });

    return createSuccessResponse<RegistrationResponse>({
      documentId: id,
      document: {
        ...registration,
        ...updateData,
        updatedAt: timestamp,
      },
    });
  } catch (error) {
    return createErrorResponse("Erro ao atualizar inscrição", 500);
  }
}
