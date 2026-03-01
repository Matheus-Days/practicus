import { validateAuth } from "@/lib/auth-utils";
import { firestore, storage } from "@/lib/firebase-admin";
import { DecodedIdToken } from "firebase-admin/auth";
import { NextRequest, NextResponse } from "next/server";
import {
  createErrorResponse,
  createSuccessResponse,
  isUserAdmin,
} from "../../../utils";
import {
  Attachment,
  CheckoutDocument,
  DeleteCommitmentAttachmentRequest,
  Payment,
} from "../../checkout.types";
import { EventData } from "../../../../types/events";
import { calculateTotalPurchasePrice } from "../../../../../lib/checkout-utils";

async function getAuthenticatedUser(request: NextRequest): Promise<DecodedIdToken> {
  return validateAuth(request);
}

async function getCheckoutDocument(checkoutId: string) {
  const checkoutDoc = await firestore.collection("checkouts").doc(checkoutId).get();
  if (!checkoutDoc.exists) {
    return null;
  }
  return checkoutDoc;
}

async function ensureUserCanManageCheckout(
  authenticatedUser: DecodedIdToken,
  checkout: CheckoutDocument
) {
  if (authenticatedUser.uid === checkout.userId) return true;
  return isUserAdmin(authenticatedUser, firestore);
}

async function uploadAttachmentToStorage(
  checkoutId: string,
  file: File,
  filename: string,
  uploadedBy: string
): Promise<Attachment> {
  const storagePath = `checkouts/${checkoutId}/${filename}`;
  const uploadedAt = new Date();
  const storageRef = storage.bucket().file(storagePath);
  const buffer = Buffer.from(await file.arrayBuffer());

  await storageRef.save(buffer, {
    metadata: {
      contentType: file.type,
      metadata: {
        originalName: file.name,
        uploadedBy,
        uploadedAt: uploadedAt.toISOString(),
      },
    },
  });

  return {
    fileName: file.name,
    contentType: file.type,
    storagePath,
    uploadedAt,
  };
}

// POST /api/checkouts/[id]/payment - Upload do recibo de empenho
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    let authenticatedUser: DecodedIdToken;
    try {
      authenticatedUser = await getAuthenticatedUser(request);
    } catch {
      return createErrorResponse(
        "Não autorizado. Token de autenticação inválido ou expirado.",
        401
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const checkoutId = params.id;

    if (!file) {
      return createErrorResponse("Arquivo não fornecido", 400);
    }

    const checkoutDoc = await getCheckoutDocument(checkoutId);
    if (!checkoutDoc) {
      return createErrorResponse("Aquisição não encontrada", 404);
    }
    const checkout = checkoutDoc.data() as CheckoutDocument;

    const canManage = await ensureUserCanManageCheckout(authenticatedUser, checkout);
    if (!canManage) {
      return createErrorResponse("Usuário não autorizado", 403);
    }

    if (checkout.payment.method !== "empenho") {
      return createErrorResponse(
        "Recibo de empenho só pode ser enviado para aquisições por empenho.",
        400
      );
    }

    if (checkout.status !== "pending") {
      return createErrorResponse(
        "Recibo de empenho já validado não pode ser modificado.",
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

    const commitmentAttachment = await uploadAttachmentToStorage(
      checkoutId,
      file,
      "commitmentAttachment",
      authenticatedUser.uid
    );

    const payment: Payment = {
      ...checkout.payment,
      method: "empenho",
      value: paymentValue,
      commitmentAttachment,
    };

    await checkoutDoc.ref.update({
      payment,
      updatedAt: new Date(),
    });

    return createSuccessResponse({ message: "Recibo enviado com sucesso" }, 201);
  } catch (error) {
    console.error("Erro ao fazer upload do recibo:", error);
    return createErrorResponse("Erro interno do servidor", 500);
  }
}

// PATCH /api/checkouts/[id]/payment - Upload do comprovante de pagamento
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    let authenticatedUser: DecodedIdToken;
    try {
      authenticatedUser = await getAuthenticatedUser(request);
    } catch {
      return createErrorResponse(
        "Não autorizado. Token de autenticação inválido ou expirado.",
        401
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const checkoutId = params.id;

    if (!file) {
      return createErrorResponse("Arquivo não fornecido", 400);
    }

    const checkoutDoc = await getCheckoutDocument(checkoutId);
    if (!checkoutDoc) {
      return createErrorResponse("Aquisição não encontrada", 404);
    }
    const checkout = checkoutDoc.data() as CheckoutDocument;

    const canManage = await ensureUserCanManageCheckout(authenticatedUser, checkout);
    if (!canManage) {
      return createErrorResponse("Usuário não autorizado", 403);
    }

    if (checkout.status === "paid") {
      return createErrorResponse(
        "Comprovante de pagamento já validado não pode ser modificado.",
        400
      );
    }

    const paymentAttachment = await uploadAttachmentToStorage(
      checkoutId,
      file,
      "paymentReceiptAttachment",
      authenticatedUser.uid
    );

    await checkoutDoc.ref.update({
      payment: {
        ...checkout.payment,
        paymentAttachment,
      },
      updatedAt: new Date(),
    });

    return createSuccessResponse({ message: "Comprovante enviado com sucesso" }, 201);
  } catch (error) {
    console.error("Erro ao fazer upload do comprovante:", error);
    return createErrorResponse("Erro interno do servidor", 500);
  }
}

// PUT /api/checkouts/[id]/payment - Upload da nota fiscal (somente admin)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    let authenticatedUser: DecodedIdToken;
    try {
      authenticatedUser = await getAuthenticatedUser(request);
    } catch {
      return createErrorResponse(
        "Não autorizado. Token de autenticação inválido ou expirado.",
        401
      );
    }

    const isAdmin = await isUserAdmin(authenticatedUser, firestore);
    if (!isAdmin) {
      return createErrorResponse("Usuário não autorizado", 403);
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const checkoutId = params.id;

    if (!file) {
      return createErrorResponse("Arquivo não fornecido", 400);
    }

    const checkoutDoc = await getCheckoutDocument(checkoutId);
    if (!checkoutDoc) {
      return createErrorResponse("Aquisição não encontrada", 404);
    }
    const checkout = checkoutDoc.data() as CheckoutDocument;

    if (checkout.status !== "paid") {
      return createErrorResponse(
        "A nota fiscal só pode ser anexada quando a aquisição estiver com situação paga.",
        400
      );
    }

    const receiptAttachment = await uploadAttachmentToStorage(
      checkoutId,
      file,
      "invoiceAttachment",
      authenticatedUser.uid
    );

    await checkoutDoc.ref.update({
      payment: {
        ...checkout.payment,
        receiptAttachment,
      },
      updatedAt: new Date(),
    });

    return createSuccessResponse(
      { message: "Nota fiscal enviada com sucesso", attachment: receiptAttachment },
      201
    );
  } catch (error) {
    console.error("Erro ao fazer upload da nota fiscal:", error);
    return createErrorResponse("Erro interno do servidor", 500);
  }
}

// DELETE /api/checkouts/[id]/payment - Deletar anexos de recibo/comprovante
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    let authenticatedUser: DecodedIdToken;
    try {
      authenticatedUser = await getAuthenticatedUser(request);
    } catch {
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

    const checkoutDoc = await getCheckoutDocument(checkoutId);
    if (!checkoutDoc) {
      return createErrorResponse("Aquisição não encontrada", 404);
    }
    const checkout = checkoutDoc.data() as CheckoutDocument;

    const canManage = await ensureUserCanManageCheckout(authenticatedUser, checkout);
    if (!canManage) {
      return createErrorResponse("Usuário não autorizado", 403);
    }

    if (attachmentType === "commitment") {
      if (checkout.payment.method !== "empenho") {
        return createErrorResponse(
          "Recibo de empenho só existe para aquisições por empenho.",
          400
        );
      }
      if (checkout.status !== "pending") {
        return createErrorResponse(
          "Recibo de empenho já validado não pode ser modificado.",
          400
        );
      }
      if (!checkout.payment.commitmentAttachment) {
        return createErrorResponse("Recibo de empenho não encontrado", 404);
      }
      await storage
        .bucket()
        .file(checkout.payment.commitmentAttachment.storagePath)
        .delete();
      await checkoutDoc.ref.update({
        payment: {
          ...checkout.payment,
          commitmentAttachment: undefined,
        },
        updatedAt: new Date(),
      });
    } else {
      if (checkout.status === "paid") {
        return createErrorResponse(
          "Comprovante de pagamento já validado não pode ser modificado.",
          400
        );
      }
      if (!checkout.payment.paymentAttachment) {
        return createErrorResponse("Comprovante de pagamento não encontrado", 404);
      }
      await storage
        .bucket()
        .file(checkout.payment.paymentAttachment.storagePath)
        .delete();
      await checkoutDoc.ref.update({
        payment: {
          ...checkout.payment,
          paymentAttachment: undefined,
        },
        updatedAt: new Date(),
      });
    }

    return new NextResponse(undefined, { status: 204 });
  } catch (error) {
    console.error("Erro ao deletar arquivo de pagamento:", error);
    return createErrorResponse("Erro interno do servidor", 500);
  }
}
