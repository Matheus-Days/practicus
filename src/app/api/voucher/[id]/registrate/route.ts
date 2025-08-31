// POST /api/voucher/:id/registrate

import { NextRequest, NextResponse } from "next/server";
import { firestore } from "@/lib/firebase-admin";
import { CreateVoucherCheckoutRequest, CreateVoucherCheckoutResponse, VoucherDocument } from "../../voucher.types";
import { validateVoucher } from "../../utils";
import { createErrorResponse, createSuccessResponse } from "../../../utils";
import { CheckoutDocument } from "../../../checkouts/checkout.types";
import { DecodedIdToken } from "firebase-admin/auth";
import { validateAuth } from "../../../../../lib/auth-utils";
import { createCheckoutDocumentId } from "../../../checkouts/utils";
import { RegistrationDocument, RegistrationStatus } from "../../../registrations/registration.types";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
  const body = await request.json() as CreateVoucherCheckoutRequest;

  const voucherDoc = await firestore.collection("vouchers").doc(id).get();
  const voucherData = voucherDoc.data() as VoucherDocument;

  if (!voucherDoc.exists) {
    return NextResponse.json({ valid: false, message: "Voucher não encontrado." }, { status: 404 });
  }

  const validateVoucherResult = await validateVoucher(firestore, {
    ...voucherData,
    id,
  });

  if (!validateVoucherResult.valid) {
    return createErrorResponse(validateVoucherResult.message, 403);
  }

  const checkoutDocId: string = createCheckoutDocumentId(body.eventId, authenticatedUser.uid);
  let checkout: CheckoutDocument;
  let registration: RegistrationDocument;

  try {
    checkout = {
      checkoutType: "voucher",
      createdAt: new Date(),
      eventId: body.eventId,
      status: 'completed',
      userId: authenticatedUser.uid,
    }

    const checkoutDocRef = firestore.collection("checkouts").doc(checkoutDocId);
    
    const checkoutDoc = await checkoutDocRef.get();
    if (checkoutDoc.exists && checkoutDoc.data()?.status !== "deleted") {
      return createErrorResponse("Uma outra inscrição (checkout) já existe para esse email.", 400);
    }

    await checkoutDocRef.set(checkout);
  } catch (error) {
    return createErrorResponse("Erro ao criar inscrição (checkout)", 500);
  }

  try {
    const buyerCheckoutDoc = await firestore.collection("checkouts").doc(voucherData.checkoutId).get();
    const buyerCheckoutData = buyerCheckoutDoc.data() as CheckoutDocument;

    registration = {
      checkoutId: voucherData.checkoutId, // refers to the buyers checkout
      createdAt: new Date(),
      eventId: body.eventId,
      status: getRegistrationStatus(buyerCheckoutData),
      userId: authenticatedUser.uid,
      ...body.registration,
    }

    const registrationDocRef = firestore.collection("registrations").doc(checkoutDocId);

    await registrationDocRef.set(registration);
  } catch (error) {
    return createErrorResponse("Erro ao criar inscrição", 500);
  }

  return createSuccessResponse<CreateVoucherCheckoutResponse>({
    checkoutId: checkoutDocId,
    checkout,
    registrationId: checkoutDocId,
    registration,
  }, 200);
}

function getRegistrationStatus(buyerCheckoutData: CheckoutDocument): RegistrationStatus {
  if (buyerCheckoutData.status === "completed") {
    return "ok";
  } else if (buyerCheckoutData.status === "pending") {
    return "pending";
  } else {
    return "invalid";
  }
}