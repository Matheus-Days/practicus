import { NextRequest } from "next/server";
import { firestore } from "@/lib/firebase-admin";
import { validateAuth } from "@/lib/auth-utils";
import {
  validateUpdateCheckoutRequest,
  extractUpdateCheckoutDataFromRequestBody,
} from "../utils";
import { CheckoutDocument, UpdateCheckoutRequest } from "../checkout.types";
import { DecodedIdToken } from "firebase-admin/auth";
import { createErrorResponse, createSuccessResponse } from "../../utils";
import { NextResponse } from "next/server";

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

    await firestore
      .collection("checkouts")
      .doc(id)
      .update({
        ...updateData,
        status: "pending",
        updatedAt: new Date(),
      });

    const checkoutDoc = await firestore.collection("checkouts").doc(id).get();

    return createSuccessResponse({
      documentId: id,
      document: checkoutDoc.data(),
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
  console.log("Deleting checkout:", params.id);
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
      return createErrorResponse("Usuário não tem permissão para deletar esta aquisição", 403);
    }

    const registrationDoc = await firestore
      .collection("registrations")
      .doc(id)
      .get();
    
    await registrationDoc.ref.delete();

    await firestore.collection("checkouts").doc(id).update({
      status: "deleted",
      deletedAt: new Date(),
    });

    return new NextResponse(undefined, { status: 204 });
  } catch (error) {
    console.error("Erro ao deletar checkout:", error);
    return createErrorResponse("Erro interno do servidor", 500);
  }
}
