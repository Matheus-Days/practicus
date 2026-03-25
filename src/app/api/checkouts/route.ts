import { NextRequest } from "next/server";
import { firestore } from "@/lib/firebase-admin";
import { validateAuth } from "@/lib/auth-utils";
import {
  validateCreateCheckoutRequest,
  extractCreateCheckoutDataFromRequestBody,
  createCheckoutDocument,
  createCheckoutDocumentId,
} from "./utils";
import { CheckoutDocument, CreateCheckoutRequest } from "./checkout.types";
import { DecodedIdToken } from "firebase-admin/auth";
import { createErrorResponse, createSuccessResponse } from "../utils";
import { VoucherDocument } from "../voucher/voucher.types";
import { EventDocument } from "../../types/events";
import { calculateTotalPurchasePrice } from "../../../lib/checkout-utils";

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

    const checkoutDoc = await firestore
      .collection("checkouts")
      .doc(checkoutDocumentId)
      .get();
    if (checkoutDoc.exists) {
      return createErrorResponse(
        "Uma outra aquisição de inscrições já existe para esse evento.",
        400
      );
    }

    const event = await firestore
      .collection("events")
      .doc(checkoutData.eventId)
      .get();
    if (!event.exists) {
      return createErrorResponse("Evento não encontrado.", 404);
    }
    const eventDoc = event.data() as EventDocument;
    if (eventDoc.status !== "open") {
      return createErrorResponse(
        "Este evento não está aberto para novas compras de inscrição.",
        403
      );
    }

    const attendeeRegistrationsSnapshot = await firestore
      .collection("registrations")
      .where("eventId", "==", checkoutData.eventId)
      .where("attendeeUserId", "==", authenticatedUser.uid)
      .where("status", "in", ["ok", "pending"])
      .get();

    const hasActiveVoucherRegistration = attendeeRegistrationsSnapshot.docs.some(
      (docSnap) => {
        const registration = docSnap.data() as { checkoutId?: string };
        return !registration.checkoutId;
      }
    );
    if (hasActiveVoucherRegistration) {
      return createErrorResponse(
        "Você já possui inscrição ativa neste evento via voucher. A compra de nova aquisição nesta conta está bloqueada.",
        409
      );
    }

    if (eventDoc.priceBreakpoints?.length) {
      checkoutDocument.priceBreakpointsAtCheckout = [
        ...eventDoc.priceBreakpoints,
      ]
        .sort((a, b) => a.minQuantity - b.minQuantity)
        .map((bp) => ({ ...bp }));
    }

    checkoutDocument.totalValue = calculateTotalPurchasePrice(checkoutDocument);
    checkoutDocument.payment.value = checkoutDocument.totalValue ?? 0;

    const { voucher: _clientVoucher, ...checkoutWithoutClientVoucher } =
      checkoutDocument;
    const voucherRef = firestore.collection("vouchers").doc();
    const voucherDoc: VoucherDocument = {
      active: true,
      checkoutId: checkoutDocumentId,
      createdAt: new Date(),
    };
    const checkoutToPersist: CheckoutDocument = {
      ...checkoutWithoutClientVoucher,
      voucher: voucherRef.id,
    };

    const batch = firestore.batch();
    batch.set(checkoutDoc.ref, checkoutToPersist);
    batch.set(voucherRef, voucherDoc);
    await batch.commit();

    return createSuccessResponse(
      {
        documentId: checkoutDocumentId,
        document: checkoutToPersist,
      },
      201
    );
  } catch (error) {
    console.error("Erro ao criar checkout:", error);
    return createErrorResponse("Erro interno do servidor", 500);
  }
}
