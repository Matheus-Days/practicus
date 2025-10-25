// Implementar método PATCH para atualizar o status de uma inscrição

import { NextRequest, NextResponse } from "next/server";
import { validateAuth } from "../../../../../lib/auth-utils";
import { DecodedIdToken } from "firebase-admin/auth";
import { RegistrationDocument } from "../../registration.types";
import { firestore } from "../../../../../lib/firebase-admin";
import {
  canActivateRegistration,
  validateUpdateRegistrationStatus,
  extractUpdateRegistrationStatusDataFromRequestBody,
} from "../../utils";
import { createErrorResponse, isUserAdmin } from "../../../utils";
import { CheckoutDocument } from "../../../checkouts/checkout.types";

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
    const userIsRegistrationOwner =
      registration.userId === authenticatedUser.uid;
    let checkout: CheckoutDocument | null = null;

    if (!userIsRegistrationOwner) {
      const checkoutDoc = await firestore
        .collection("checkouts")
        .doc(registration.checkoutId)
        .get();

      if (!checkoutDoc.exists) {
        return createErrorResponse("Compra da inscrição não encontrada", 404);
      }

      checkout = checkoutDoc.data() as CheckoutDocument;

      isAdmin = await isUserAdmin(authenticatedUser, firestore);
      if (!isAdmin && checkout.userId !== authenticatedUser.uid)
        return createErrorResponse(
          "Usuário não tem permissão para ativar a inscrição",
          403
        );
    }

    const checkoutDoc = await firestore
      .collection("checkouts")
      .doc(registration.checkoutId)
      .get();

    // Ao tentar ativar uma inscrição, verificar se a compra está válida e se ainda há vagas disponíveis
    if (status === "ok") {
      const validationResult = await canActivateRegistration(
        checkoutDoc,
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
