import { NextRequest, NextResponse } from "next/server";
import { firestore } from "@/lib/firebase-admin";
import { validateAuth } from "@/lib/auth-utils";
import {
  validateCreateCheckoutRequest,
  createErrorResponse,
  createSuccessResponse,
  extractCreateCheckoutDataFromRequestBody,
  createCheckoutDocument,
  createCheckoutDocumentId,
} from "./utils";
import { CreateCheckoutRequest } from "./checkout.types";
import { DecodedIdToken } from "firebase-admin/auth";

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
    console.log(request)
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

    await firestore
      .collection("checkouts")
      .doc(checkoutDocumentId)
      .set(checkoutDocument);

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
