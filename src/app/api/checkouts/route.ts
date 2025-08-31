import { NextRequest } from "next/server";
import { firestore } from "@/lib/firebase-admin";
import { validateAuth } from "@/lib/auth-utils";
import {
  validateCreateCheckoutRequest,
  extractCreateCheckoutDataFromRequestBody,
  createCheckoutDocument,
  createCheckoutDocumentId,
} from "./utils";
import { CreateCheckoutRequest } from "./checkout.types";
import { DecodedIdToken } from "firebase-admin/auth";
import { createErrorResponse, createSuccessResponse } from "../utils";
import { VoucherDocument } from "../voucher/voucher.types";

// POST /api/checkouts - Create a new checkout
export async function POST(request: NextRequest) {
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

    const body = await request.json();

    // Validar dados do checkout
    if (!validateCreateCheckoutRequest(body)) {
      return createErrorResponse("Dados inválidos para criação do checkout");
    }

    const checkoutData: CreateCheckoutRequest =
      extractCreateCheckoutDataFromRequestBody(body);

    // Opcional: Verificar se o usuário está tentando criar checkout para si mesmo
    // (dependendo da sua lógica de negócio)
    if (checkoutData.userId && checkoutData.userId !== authenticatedUser.uid) {
      return createErrorResponse(
        "Não autorizado. Você só pode criar checkouts para sua própria conta.",
        403
      );
    }

    const checkoutDocument = createCheckoutDocument({
      ...checkoutData,
      userId: authenticatedUser.uid, // Garantir que o userId seja do usuário autenticado
    });

    const checkoutDocumentId = createCheckoutDocumentId(
      checkoutData.eventId,
      authenticatedUser.uid
    );

    const checkoutDoc = await firestore.collection("checkouts").doc(checkoutDocumentId).get();
    if (checkoutDoc.exists && checkoutDoc.data()?.status !== "deleted") {
      return createErrorResponse("Uma outra compra de inscrições já existe para esse email.", 400);
    }

    await checkoutDoc.ref.set(checkoutDocument);

    const voucherDoc: VoucherDocument = {
      active: true,
      checkoutId: checkoutDocumentId,
      createdAt: new Date(),
    };
    const voucherRes = await firestore.collection("vouchers").add(voucherDoc);

    await firestore
      .collection("checkouts")
      .doc(checkoutDocumentId)
      .update({ voucher: voucherRes.id });

    return createSuccessResponse(
      {
        documentId: checkoutDocumentId,
        document: checkoutDocument,
      },
      201
    );
  } catch (error) {
    console.error("Erro ao criar checkout:", error);
    return createErrorResponse("Erro interno do servidor", 500);
  }
}
