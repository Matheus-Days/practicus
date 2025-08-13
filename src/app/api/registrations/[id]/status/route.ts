// Implementar método PATCH para atualizar o status de uma inscrição

import { NextRequest, NextResponse } from "next/server";
import { validateAuth } from "../../../../../lib/auth-utils";
import { DecodedIdToken } from "firebase-admin/auth";
import { RegistrationDocument } from "../../registration.types";
import { firestore } from "../../../../../lib/firebase-admin";
import {
  isUserAdmin,
  canActivateRegistration,
  validateUpdateRegistrationStatus,
  extractUpdateRegistrationStatusDataFromRequestBody,
} from "../../utils";
import { createErrorResponse } from "../../../utils";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const body = await request.json();

  const validBody = validateUpdateRegistrationStatus(body);
  if (!validBody) {
    return createErrorResponse(
      "Valor inválido para situação da inscrição",
      400
    );
  }

  const { status } = extractUpdateRegistrationStatusDataFromRequestBody(body);

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

    // Se o usuário não for o dono da inscrição, verificar se é admin
    if (registration.userId !== authenticatedUser.uid) {
      isAdmin = await isUserAdmin(authenticatedUser, firestore);
      if (!isAdmin)
        return createErrorResponse(
          "Usuário não tem permissão para atualizar o status da inscrição",
          403
        );
    }

    // Ao tentar ativar uma inscrição, verificar se a compra está válida e se ainda há vagas disponíveis
    if (status === "ok") {
      const validationResult = await canActivateRegistration(
        registration,
        isAdmin,
        firestore,
        id
      );

      if (!validationResult.canActivate) {
        return createErrorResponse(
          validationResult.error,
          validationResult.errorCode
        );
      }
    }

    await firestore.collection("registrations").doc(id).update({ status });
  } catch (error) {
    return createErrorResponse("Erro ao atualizar status da inscrição", 500);
  }

  return NextResponse.json({ message: "Status atualizado com sucesso" });
}
