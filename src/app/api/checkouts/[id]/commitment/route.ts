import { validateAuth } from "@/lib/auth-utils";
import { firestore, storage } from "@/lib/firebase-admin";
import { DecodedIdToken } from "firebase-admin/auth";
import { NextRequest, NextResponse } from "next/server";
import { createErrorResponse, createSuccessResponse, isUserAdmin } from "../../../utils";
import {
  Attachment,
  CheckoutDocument,
  CommitmentPayment,
  DeleteCommitmentAttachmentRequest,
} from "../../checkout.types";
import { EventData } from "../../../../types/events";
import { calculateTotalPurchasePrice } from "../../../../../lib/checkout-utils";

/* This will be used not only to send the commitment receipt, but also to initialize the commitment payment */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Receber FormData em vez de JSON
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const checkoutDocumentId = params.id;

    if (!file) {
      return createErrorResponse("Arquivo não fornecido", 400);
    }

    // Verificar se o checkout existe
    const checkoutDoc = await firestore
      .collection("checkouts")
      .doc(checkoutDocumentId)
      .get();
    if (!checkoutDoc.exists) {
      return createErrorResponse("Aquisição não encontrada", 404);
    }

    const checkout = checkoutDoc.data() as CheckoutDocument;

    if (authenticatedUser.uid !== checkout.userId) {
      const isAdmin = await isUserAdmin(authenticatedUser, firestore);
      if (!isAdmin) {
        return createErrorResponse("Usuário não autorizado", 403);
      }
    }

    if (
      !checkout.billingDetails ||
      !("paymentByCommitment" in checkout.billingDetails)
    ) {
      return createErrorResponse(
        "Aquisição com tipo de pagamento inválido.",
        400
      );
    }

    if (
      checkout.payment?.method === "empenho" &&
      checkout.payment.status !== "pending"
    ) {
      return createErrorResponse(
        "Recibo de empenho já validado pela Practicus não pode ser modificado.",
        400
      );
    }

    const eventRef = firestore.collection("events").doc(checkout.eventId);
    const eventDoc = await eventRef.get();
    if (!eventDoc.exists) {
      return createErrorResponse("Evento não encontrado", 404);
    }
    const event = eventDoc.data() as EventData;

    const paymentValue = calculateTotalPurchasePrice(event, checkout);

    // Upload direto para o Storage
    const storagePath = `checkouts/${checkoutDocumentId}/commitmentAttachment`;
    const uploadedAt = new Date();
    const storageRef = storage.bucket().file(storagePath);

    // Converter File para Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Fazer upload do arquivo
    await storageRef.save(buffer, {
      metadata: {
        contentType: file.type,
        metadata: {
          originalName: file.name,
          uploadedBy: authenticatedUser.uid,
          uploadedAt: uploadedAt.toISOString(),
        },
      },
    });

    // Se o upload for bem sucedido, atualizar o documento do checkout com informações do arquivo
    const commitmentAttachment: Attachment = {
      fileName: file.name,
      contentType: file.type,
      storagePath: storagePath,
      uploadedAt,
    };

    const commitmentPayment: CommitmentPayment = {
      method: "empenho",
      status: "pending",
      value: paymentValue,
      commitmentAttachment: commitmentAttachment,
    };

    await checkoutDoc.ref.update({
      payment: commitmentPayment,
    });

    return createSuccessResponse(
      { message: "Arquivo enviado com sucesso" },
      201
    );
  } catch (error) {
    console.error("Erro ao fazer upload do arquivo:", error);
    return createErrorResponse("Erro interno do servidor", 500);
  }
}

/* This will be used to set the paymentReceiptAttachment */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Receber FormData em vez de JSON
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const checkoutDocumentId = params.id;

    if (!file) {
      return createErrorResponse("Arquivo não fornecido", 400);
    }

    // Verificar se o checkout existe
    const checkoutDoc = await firestore
      .collection("checkouts")
      .doc(checkoutDocumentId)
      .get();
    if (!checkoutDoc.exists) {
      return createErrorResponse("Aquisição não encontrada", 404);
    }

    const checkout = checkoutDoc.data() as CheckoutDocument;
    
    if (authenticatedUser.uid !== checkout.userId) {
      const isAdmin = await isUserAdmin(authenticatedUser, firestore);
      if (!isAdmin) {
        return createErrorResponse("Usuário não autorizado", 403);
      }
    }

    if (
      !checkout.billingDetails ||
      !("paymentByCommitment" in checkout.billingDetails)
    ) {
      return createErrorResponse(
        "Aquisição com tipo de pagamento inválido.",
        400
      );
    }

    if (
      checkout.payment?.method === "empenho" &&
      checkout.payment.status === "paid"
    ) {
      return createErrorResponse(
        "Comprovante de pagamento já validado pela Practicus não pode ser modificado.",
        400
      );
    }

    const storagePath = `checkouts/${checkoutDocumentId}/paymentReceiptAttachment`;
    const uploadedAt = new Date();
    const storageRef = storage.bucket().file(storagePath);

    // Converter File para Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Fazer upload do arquivo
    await storageRef.save(buffer, {
      metadata: {
        contentType: file.type,
        metadata: {
          originalName: file.name,
          uploadedBy: authenticatedUser.uid,
          uploadedAt: uploadedAt.toISOString(),
        },
      },
    });

    const paymentAttachment: Attachment = {
      fileName: file.name,
      contentType: file.type,
      storagePath: storagePath,
      uploadedAt,
    };

    await checkoutDoc.ref.update({
      payment: {
        ...checkout.payment,
        paymentAttachment: paymentAttachment,
      } as CommitmentPayment,
    });

    return createSuccessResponse(
      { message: "Arquivo enviado com sucesso" },
      201
    );
  } catch (error) {
    console.error("Erro ao fazer upload do arquivo:", error);
    return createErrorResponse("Erro interno do servidor", 500);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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
    const { attachmentType } = body as DeleteCommitmentAttachmentRequest;
    const checkoutId = params.id;

    if (attachmentType !== "commitment" && attachmentType !== "payment") {
      return createErrorResponse("Tipo de anexo inválido", 400);
    }

    const checkoutDoc = await firestore.collection("checkouts").doc(checkoutId).get();
    if (!checkoutDoc.exists) {
      return createErrorResponse("Aquisição não encontrada", 404);
    }

    const checkout = checkoutDoc.data() as CheckoutDocument;

    if (authenticatedUser.uid !== checkout.userId) {
      const isAdmin = await isUserAdmin(authenticatedUser, firestore);
      if (!isAdmin) {
        return createErrorResponse("Usuário não autorizado", 403);
      }
    }

    if (!checkout.payment) return createErrorResponse("Aquisição não tem informações de pagamento", 404);
    if (checkout.payment.method !== "empenho") return createErrorResponse("Aquisição não consiste em pagamento por empenho", 404);
    
    if (attachmentType === "commitment" && checkout.payment.status !== "pending") {
      return createErrorResponse("Recibo de empenho já validado pela Practicus não pode ser modificado", 400);
    }

    if (attachmentType === "payment" && checkout.payment.status === "paid") {
      return createErrorResponse("Comprovante de pagamento já validado pela Practicus não pode ser modificado", 400);
    }

    if (attachmentType === "commitment") {
      if (!checkout.payment.commitmentAttachment) return createErrorResponse("Recibo de empenho não encontrado", 404);
      await storage.bucket().file(checkout.payment.commitmentAttachment.storagePath).delete();
      await checkoutDoc.ref.update({
        payment: {
          ...checkout.payment,
          commitmentAttachment: undefined,
        } as CommitmentPayment,
      });
    } else {
      if (!checkout.payment.paymentAttachment) return createErrorResponse("Comprovante de pagamento não encontrado", 404);
      await storage.bucket().file(checkout.payment.paymentAttachment.storagePath).delete();
      await checkoutDoc.ref.update({
        payment: {
          ...checkout.payment,
          paymentAttachment: undefined,
        } as CommitmentPayment,
      });
    }
    return new NextResponse(undefined, { status: 204 });
  } catch (error) {
    console.error("Erro ao deletar arquivo:", error);
    return createErrorResponse("Erro interno do servidor", 500);
  }
}
