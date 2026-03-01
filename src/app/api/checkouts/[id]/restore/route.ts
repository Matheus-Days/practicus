import { NextRequest } from "next/server";
import { firestore } from "@/lib/firebase-admin";
import { validateAuth } from "@/lib/auth-utils";
import {
  createErrorResponse,
  createSuccessResponse,
  isUserAdmin,
} from "../../../utils";
import { DecodedIdToken } from "firebase-admin/auth";
import {
  CheckoutDocument,
  DeletedCheckoutDocument,
} from "../../checkout.types";

/**
 * POST /api/checkouts/[id]/restore
 * Admin-only: restore a checkout from deletedCheckouts back to checkouts.
 * Fails if the user already has an active checkout for the same event (same document id);
 * in that case the admin must delete the current checkout before restoring the old one.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    let authenticatedUser: DecodedIdToken;
    try {
      authenticatedUser = await validateAuth(request);
    } catch {
      return createErrorResponse(
        "Não autorizado. Token de autenticação inválido ou expirado.",
        401
      );
    }

    const isAdmin = await isUserAdmin(authenticatedUser, firestore);
    if (!isAdmin) {
      return createErrorResponse(
        "Acesso negado. Apenas administradores podem restaurar um checkout deletado.",
        403
      );
    }

    const { id } = params;
    const deletedRef = firestore.collection("deletedCheckouts").doc(id);
    const deletedSnap = await deletedRef.get();

    if (!deletedSnap.exists) {
      return createErrorResponse(
        "Checkout deletado não encontrado.",
        404
      );
    }

    const deletedData = deletedSnap.data() as DeletedCheckoutDocument;

    const activeCheckoutRef = firestore.collection("checkouts").doc(id);
    const activeSnap = await activeCheckoutRef.get();

    if (activeSnap.exists) {
      return createErrorResponse(
        "O usuário já possui um checkout ativo para este evento. Delete o checkout atual antes de restaurar o antigo.",
        409
      );
    }

    const { deletedAt: _removed, ...checkoutData } = deletedData;
    const restored: CheckoutDocument = checkoutData as CheckoutDocument;

    const batch = firestore.batch();
    batch.set(activeCheckoutRef, restored);
    batch.delete(deletedRef);
    await batch.commit();

    return createSuccessResponse({
      documentId: id,
      message: "Checkout restaurado com sucesso.",
    });
  } catch (error) {
    console.error("Erro ao restaurar checkout:", error);
    return createErrorResponse("Erro interno do servidor", 500);
  }
}
