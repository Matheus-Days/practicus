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
import { CheckoutDocument } from "../../../checkouts/checkout.types";
import { createErrorResponse, isUserAdmin } from "../../../utils";

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

    const userIsRegistrationOwner =
      registration.attendeeUserId === authenticatedUser.uid;

    isAdmin = await isUserAdmin(authenticatedUser, firestore);
    // Para status que dependem de capacidade, precisamos do checkout.
    if (!registration.checkoutId) {
      // Sem checkout, somente dono/admin podem alterar status.
      if (!userIsRegistrationOwner) {
        if (!isAdmin) {
          return createErrorResponse(
            "Usuário não tem permissão para atualizar esta inscrição",
            403
          );
        }
      }
      await firestore.collection("registrations").doc(id).update({ status });
      return NextResponse.json({ message: "Situação da inscrição atualizada com sucesso" });
    }

    const checkoutDoc = await firestore
      .collection("checkouts")
      .doc(registration.checkoutId)
      .get();
    if (!checkoutDoc.exists) {
      return createErrorResponse("Compra da inscrição não encontrada", 404);
    }
    const checkout = checkoutDoc.data() as CheckoutDocument;

    // Permissões:
    // - participante (attendeeUserId) pode atualizar o status da própria inscrição
    // - comprador (checkout.userId) pode atualizar o status da inscrição do seu checkout
    // - admin pode tudo
    if (!userIsRegistrationOwner && checkout.userId !== authenticatedUser.uid) {
      isAdmin = await isUserAdmin(authenticatedUser, firestore);
      if (!isAdmin) {
        return createErrorResponse(
          "Usuário não tem permissão para atualizar esta inscrição",
          403
        );
      }
    }

    // Ao tentar ativar uma inscrição, verificar se a compra está válida e se ainda há vagas disponíveis
    if (status === "ok") {
      const validationResult = await canActivateRegistration(
        checkoutDoc,
        registration,
        firestore
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

  return NextResponse.json({ message: "Situação da inscrição atualizada com sucesso" });
}
