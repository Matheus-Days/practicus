import { validateAuth } from "@/lib/auth-utils";
import { firestore } from "@/lib/firebase-admin";
import { DecodedIdToken } from "firebase-admin/auth";
import { NextRequest } from "next/server";
import { createErrorResponse, createSuccessResponse, isUserAdmin } from "../../../../utils";
import {
  CheckoutDocument,
  CommitmentPayment,
  UpdateCommitmentStatusRequest,
} from "../../../checkout.types";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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
    const { status: newStatus } = body as UpdateCommitmentStatusRequest;
    const checkoutId = params.id;

    if (!newStatus || !["pending", "committed", "paid"].includes(newStatus)) {
      return createErrorResponse("Situação inválida", 400);
    }

    const checkoutDoc = await firestore.collection("checkouts").doc(checkoutId).get();
    if (!checkoutDoc.exists) {
      return createErrorResponse("Aquisição não encontrada", 404);
    }

    const checkout = checkoutDoc.data() as CheckoutDocument;

    // Verificar se o usuário é admin (apenas admins podem alterar status)
    const isAdmin = await isUserAdmin(authenticatedUser, firestore);
    if (!isAdmin) {
      return createErrorResponse("Apenas administradores podem alterar o status do pagamento", 403);
    }

    if (!checkout.payment) {
      return createErrorResponse("Aquisição não tem informações de pagamento", 404);
    }

    if (checkout.payment.method !== "empenho") {
      return createErrorResponse("Aquisição não consiste em pagamento por empenho", 400);
    }

    const commitmentPayment = checkout.payment as CommitmentPayment;

    // Validações de transição de status
    if (commitmentPayment.status === "paid" && newStatus === "pending") {
      return createErrorResponse("Não é possível alterar a situação de pago para pendente de uma só vez.", 400);
    }

    if (commitmentPayment.status === "pending" && newStatus === "paid") {
      return createErrorResponse("Não é possível marcar como pago sem antes marcar como empenhado", 400);
    }

    // Atualizar o status do pagamento
    await checkoutDoc.ref.update({
      payment: {
        ...commitmentPayment,
        status: newStatus,
      } as CommitmentPayment,
    });

    return createSuccessResponse(
      { message: "Status do pagamento atualizado com sucesso" },
      200
    );
  } catch (error) {
    console.error("Erro ao atualizar status do pagamento:", error);
    return createErrorResponse("Erro interno do servidor", 500);
  }
}