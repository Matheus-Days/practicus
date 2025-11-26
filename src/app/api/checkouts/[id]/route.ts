import { NextRequest } from "next/server";
import { firestore } from "@/lib/firebase-admin";
import { validateAuth } from "@/lib/auth-utils";
import {
  validateUpdateCheckoutRequest,
  extractUpdateCheckoutDataFromRequestBody,
} from "../utils";
import { CheckoutDocument, UpdateCheckoutRequest } from "../checkout.types";
import { DecodedIdToken } from "firebase-admin/auth";
import {
  createErrorResponse,
  createSuccessResponse,
  getRegistrationStatusFromCheckoutStatusChange,
} from "../../utils";
import { NextResponse } from "next/server";
import { RegistrationDocument } from "../../registrations/registration.types";
import { VoucherDocument } from "../../voucher/voucher.types";
import { EventDocument } from "../../../types/events";
import { calculateTotalPurchasePrice } from "../../../../lib/checkout-utils";

// PUT /api/checkouts/[id] - Atualizar checkout específico
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    let authenticatedUser: DecodedIdToken;

    try {
      authenticatedUser = await validateAuth(request);
    } catch (authError) {
      return createErrorResponse(
        "Não autorizado. Token de autenticação inválido ou expirado.",
        401
      );
    }

    const { id } = params;
    const body = await request.json();

    // Validar dados do checkout
    if (!validateUpdateCheckoutRequest(body)) {
      return createErrorResponse(
        "Dados inválidos para atualização do checkout"
      );
    }

    const updateData: UpdateCheckoutRequest =
      extractUpdateCheckoutDataFromRequestBody(body);

    const checkoutRef = await firestore.collection("checkouts").doc(id).get();
    if (!checkoutRef.exists) {
      return createErrorResponse("Aquisição não encontrada.", 404);
    }
    const checkoutDoc = checkoutRef.data() as CheckoutDocument;

    let totalValue = checkoutDoc.totalValue; // inicialmente o valor anterior do checkout
    if (updateData.amount) {
      // se a quantidade de tickets foi alterada
      const event = await firestore
        .collection("events")
        .doc(checkoutDoc.eventId)
        .get();
      if (!event.exists) {
        return createErrorResponse("Evento não encontrado.", 404);
      }
      const eventDoc = event.data() as EventDocument;
      const oldCalculatedTotalValue = calculateTotalPurchasePrice(
        eventDoc,
        checkoutDoc
      ); // obtém o valor total calculado anterior do checkout
      if (oldCalculatedTotalValue === totalValue) {
        // sendo o calculado antigo igual ao total antigo, sabemos que o totalValue não foi sobrescrito pelo admin, então podemos atualizar o valor total automaticamente
        checkoutDoc.amount = updateData.amount; // atualiza a quantidade de tickets no checkout para calcular o novo valor total
        totalValue = calculateTotalPurchasePrice(eventDoc, checkoutDoc);
      }
    }

    await firestore
      .collection("checkouts")
      .doc(id)
      .update({
        ...updateData,
        totalValue,
        status: "pending",
        updatedAt: new Date(),
      } as Partial<CheckoutDocument>);

    return createSuccessResponse({
      documentId: id,
      document: checkoutDoc,
    });
  } catch (error) {
    console.error("Erro ao atualizar checkout:", error);
    return createErrorResponse("Erro interno do servidor", 500);
  }
}

// DELETE /api/checkouts/[id] - Deletar checkout específico
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    let authenticatedUser: DecodedIdToken;

    try {
      authenticatedUser = await validateAuth(request);
    } catch (authError) {
      return createErrorResponse(
        "Não autorizado. Token de autenticação inválido ou expirado.",
        401
      );
    }

    const { id } = params;

    const checkoutDoc = await firestore.collection("checkouts").doc(id).get();
    const checkoutData = checkoutDoc.data() as CheckoutDocument;

    if (checkoutData.userId !== authenticatedUser.uid) {
      return createErrorResponse(
        "Usuário não tem permissão para deletar esta aquisição",
        403
      );
    }

    await firestore.collection("checkouts").doc(id).update({
      status: "deleted",
      deletedAt: new Date(),
    });

    const checkoutsOwnRegistration = await firestore
      .collection("registrations")
      .doc(checkoutDoc.id)
      .get();
    if (checkoutsOwnRegistration.exists) {
      await checkoutsOwnRegistration.ref.update({
        status: "invalid",
        updatedAt: new Date(),
      });
    }

    const registrationsQuery = await firestore
      .collection("registrations")
      .where("checkoutId", "==", checkoutDoc.id)
      .get();

    const batch = firestore.batch();
    registrationsQuery.forEach((doc) => {
      const registrationData = doc.data() as RegistrationDocument;
      const newStatus = getRegistrationStatusFromCheckoutStatusChange(
        "deleted",
        registrationData.status
      );
      batch.update(doc.ref, { status: newStatus, updatedAt: new Date() });
    });

    await batch.commit();

    return new NextResponse(undefined, { status: 204 });
  } catch (error) {
    console.error("Erro ao deletar checkout:", error);
    return createErrorResponse("Erro interno do servidor", 500);
  }
}
