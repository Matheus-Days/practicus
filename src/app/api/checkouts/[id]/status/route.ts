import { NextRequest } from "next/server";
import { firestore } from "@/lib/firebase-admin";
import { validateAuth } from "@/lib/auth-utils";
import { DecodedIdToken } from "firebase-admin/auth";
import {
  createErrorResponse,
  createSuccessResponse,
  getRegistrationStatusFromCheckoutStatusChange,
  isUserAdmin,
} from "../../../utils";
import {
  CheckoutDocument,
  CheckoutResponse,
  CheckoutStatus,
  UpdateCheckoutStatusRequest,
} from "../../checkout.types";
import { RegistrationDocument } from "../../../registrations/registration.types";
import { VoucherDocument } from "../../../voucher/voucher.types";
import { isPaymentByCommitment } from "../../utils";

// PATCH /api/checkouts/[id]/status - Alterar status da compra (apenas admin)
export async function PATCH(
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

    // Verificar se o usuário é admin
    const isAdmin = await isUserAdmin(authenticatedUser, firestore);
    if (!isAdmin) {
      return createErrorResponse(
        "Acesso negado. Apenas administradores podem alterar a situação da compra.",
        403
      );
    }

    const { id } = params;
    const body = (await request.json()) as UpdateCheckoutStatusRequest;

    // Validar se o status foi fornecido
    if (!body.status) {
      return createErrorResponse("Situação da compra é obrigatória");
    }

    // Validar se o status é válido
    const validStatuses: CheckoutStatus[] = [
      "pending",
      "completed",
      "refunded",
      "deleted",
    ];
    if (!validStatuses.includes(body.status)) {
      return createErrorResponse(
        `Situação inválida. Situações válidas: ${validStatuses.join(", ")}`
      );
    }

    // Verificar se o checkout existe
    const checkoutDoc = await firestore.collection("checkouts").doc(id).get();

    if (!checkoutDoc.exists) {
      return createErrorResponse("Compra não encontrada", 404);
    }

    const checkoutData = checkoutDoc.data() as CheckoutDocument;

    if (isPaymentByCommitment(checkoutData) && body.status !== "deleted") {
      return createErrorResponse(
        "Não é possível alterar diretamente a situação da compra pois o pagamento é por empenho.",
        400
      );
    }
    
    const registrationsQuery = await firestore
    .collection("registrations")
    .where("checkoutId", "==", checkoutDoc.id)
    .get();
    
    const batch = firestore.batch();

    // Atualizar o status do checkout
    const updateData: Partial<CheckoutDocument> = {
      status: body.status,
      updatedAt: new Date(),
    };
    batch.update(checkoutDoc.ref, updateData);

    // Atualizar status das inscrições associadas a esta compra
    registrationsQuery.forEach((doc) => {
      const registrationData = doc.data() as RegistrationDocument;
      const newStatus = getRegistrationStatusFromCheckoutStatusChange(
        body.status,
        registrationData.status
      );
      batch.update(doc.ref, { status: newStatus, updatedAt: new Date() });
    });

    // Criar voucher se a compra estiver sendo marcada como concluída e não tiver voucher
    if (body.status === "completed" && !checkoutData.voucher) {
      const voucherDoc: VoucherDocument = {
        active: true,
        checkoutId: id,
        createdAt: new Date(),
      };
      batch.set(firestore.collection("vouchers").doc(), voucherDoc);
    }

    await batch.commit();

    return createSuccessResponse<CheckoutResponse>({
      documentId: id,
      document: {
        ...checkoutData,
        ...updateData,
      },
    });
  } catch (error) {
    return createErrorResponse("Erro interno do servidor", 500);
  }
}
