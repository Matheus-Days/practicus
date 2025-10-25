import { validateAuth } from "@/lib/auth-utils";
import { firestore } from "@/lib/firebase-admin";
import { DecodedIdToken } from "firebase-admin/auth";
import { NextRequest } from "next/server";
import {
  createErrorResponse,
  createSuccessResponse,
  getRegistrationStatusFromCheckoutStatusChange,
  isUserAdmin,
} from "../../../../utils";
import {
  CheckoutDocument,
  CheckoutStatus,
  CommitmentPayment,
  UpdateCommitmentStatusRequest,
} from "../../../checkout.types";

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

    const body = await request.json();
    const { status: newStatus } = body as UpdateCommitmentStatusRequest;
    const checkoutId = params.id;

    const validStatuses: CommitmentPayment["status"][] = ["pending", "committed", "paid"];

    if (!newStatus || !validStatuses.includes(newStatus)) {
      return createErrorResponse("Situação inválida", 400);
    }

    // Verificar se o usuário é admin (apenas admins podem alterar status)
    const isAdmin = await isUserAdmin(authenticatedUser, firestore);
    if (!isAdmin) {
      return createErrorResponse(
        "Apenas administradores podem alterar o status do pagamento",
        403
      );
    }

    const checkoutDoc = await firestore
      .collection("checkouts")
      .doc(checkoutId)
      .get();
    if (!checkoutDoc.exists) {
      return createErrorResponse("Aquisição não encontrada", 404);
    }

    const checkout = checkoutDoc.data() as CheckoutDocument;

    if (checkout.status === "deleted" || checkout.status === "refunded") {
      return createErrorResponse(
        "Pagamento por empenho não pode ser modificado pois a aquisição está cancelada",
        400
      );
    }

    if (!checkout.payment) {
      return createErrorResponse(
        "Aquisição não tem informações de pagamento",
        404
      );
    }

    if (checkout.payment.method !== "empenho") {
      return createErrorResponse(
        "Pagamento da aquisição não consiste em pagamento por empenho",
        400
      );
    }

    const commitmentPayment = checkout.payment as CommitmentPayment;

    // Validações de transição de status
    if (commitmentPayment.status === "paid" && newStatus === "pending") {
      return createErrorResponse(
        "Não é possível alterar a situação de pago para pendente de uma só vez.",
        400
      );
    }

    if (commitmentPayment.status === "pending" && newStatus === "paid") {
      return createErrorResponse(
        "Não é possível marcar como pago sem antes marcar como empenhado",
        400
      );
    }

    const newCheckoutStatus: CheckoutStatus =
      newStatus === "paid" ? "completed" : "pending";

    // Atualizar o status do pagamento
    await checkoutDoc.ref.update({
      status: newCheckoutStatus,
      payment: {
        ...commitmentPayment,
        status: newStatus,
      } as CommitmentPayment,
    });

    // Atualizar o status das inscrições associadas a esta aquisição
    if (newCheckoutStatus !== checkout.status) {
      const checkoutRegistrations = await firestore
        .collection("registrations")
        .where("checkoutId", "==", checkoutId)
        .get();
      const batch = firestore.batch();
      checkoutRegistrations.docs.forEach((doc) => {
        const newRegistrationStatus =
          getRegistrationStatusFromCheckoutStatusChange(
            newCheckoutStatus,
            doc.data().status
          );
        batch.update(doc.ref, { status: newRegistrationStatus });
      });
      await batch.commit();
    }

    return createSuccessResponse(
      { message: "Status do pagamento atualizado com sucesso" },
      200
    );
  } catch (error) {
    console.error("Erro ao atualizar status do pagamento:", error);
    return createErrorResponse("Erro interno do servidor", 500);
  }
}
