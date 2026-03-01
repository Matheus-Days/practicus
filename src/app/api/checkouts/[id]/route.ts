import { NextRequest } from "next/server";
import { firestore } from "@/lib/firebase-admin";
import { validateAuth } from "@/lib/auth-utils";
import {
  validateUpdateCheckoutRequest,
  extractUpdateCheckoutDataFromRequestBody,
} from "../utils";
import {
  CheckoutDocument,
  DeletedCheckoutDocument,
  UpdateCheckoutRequest,
} from "../checkout.types";
import { DecodedIdToken } from "firebase-admin/auth";
import {
  createErrorResponse,
  createSuccessResponse,
  isUserAdmin,
} from "../../utils";
import { NextResponse } from "next/server";
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

// DELETE /api/checkouts/[id] - Cancel checkout (admin or buyer). Archives in deletedCheckouts, invalidates registrations, then removes from checkouts.
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
    const checkoutRef = firestore.collection("checkouts").doc(id);
    const checkoutSnap = await checkoutRef.get();

    if (!checkoutSnap.exists) {
      return createErrorResponse("Compra não encontrada", 404);
    }

    const checkoutData = checkoutSnap.data() as CheckoutDocument;
    const isAdmin = await isUserAdmin(authenticatedUser, firestore);
    const isBuyer = checkoutData.userId === authenticatedUser.uid;

    if (!isAdmin && !isBuyer) {
      return createErrorResponse(
        "Acesso negado. Apenas o comprador ou um administrador podem cancelar esta compra.",
        403
      );
    }

    if (isBuyer && !isAdmin) {
      const eventSnap = await firestore
        .collection("events")
        .doc(checkoutData.eventId)
        .get();
      if (!eventSnap.exists) {
        return createErrorResponse("Evento não encontrado.", 404);
      }
      const eventData = eventSnap.data() as EventDocument;
      if (eventData.status !== "open") {
        return createErrorResponse(
          "Só é possível cancelar a compra enquanto o evento estiver em aberto.",
          403
        );
      }
    }

    const deletedAt = new Date();

    const deletedCheckout: DeletedCheckoutDocument = {
      ...checkoutData,
      deletedAt,
    };

    const registrationsQuery = await firestore
      .collection("registrations")
      .where("checkoutId", "==", id)
      .get();

    const batch = firestore.batch();
    registrationsQuery.docs.forEach((regDoc) => {
      batch.update(regDoc.ref, { status: "invalid", updatedAt: deletedAt });
    });
    await batch.commit();

    await firestore.collection("deletedCheckouts").doc(id).set(deletedCheckout);
    await checkoutRef.delete();

    return new NextResponse(undefined, { status: 204 });
  } catch (error) {
    console.error("Erro ao deletar checkout:", error);
    return createErrorResponse("Erro interno do servidor", 500);
  }
}
