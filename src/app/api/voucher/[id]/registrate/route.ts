// POST /api/voucher/:id/registrate

import { NextRequest, NextResponse } from "next/server";
import { firestore } from "@/lib/firebase-admin";
import {
  CreateVoucherCheckoutRequest,
  CreateVoucherCheckoutResponse,
  VoucherDocument,
} from "../../voucher.types";
import { validateVoucher } from "../../utils";
import { createErrorResponse, createSuccessResponse } from "../../../utils";
import { CheckoutDocument } from "../../../checkouts/checkout.types";
import { DecodedIdToken } from "firebase-admin/auth";
import { validateAuth } from "../../../../../lib/auth-utils";
import {
  RegistrationDocument,
  RegistrationStatus,
} from "../../../registrations/registration.types";

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
  const body = (await request.json()) as CreateVoucherCheckoutRequest;
  if (body.userId !== authenticatedUser.uid) {
    return createErrorResponse(
      "Usuário não tem permissão para usar este voucher",
      403
    );
  }

  const voucherDoc = await firestore.collection("vouchers").doc(id).get();
  const voucherData = voucherDoc.data() as VoucherDocument;

  if (!voucherDoc.exists) {
    return NextResponse.json(
      { valid: false, message: "Voucher não encontrado." },
      { status: 404 }
    );
  }

  const validateVoucherResult = await validateVoucher(firestore, {
    ...voucherData,
    id,
  });

  if (!validateVoucherResult.valid) {
    return createErrorResponse(validateVoucherResult.message, 403);
  }

  let registration: RegistrationDocument;
  const registrationId = crypto.randomUUID();

  try {
    const buyerCheckoutDoc = await firestore
      .collection("checkouts")
      .doc(voucherData.checkoutId)
      .get();
    if (!buyerCheckoutDoc.exists) {
      return createErrorResponse(
        "Compra vinculada ao voucher não encontrada",
        404
      );
    }
    const buyerCheckoutData = buyerCheckoutDoc.data() as CheckoutDocument;

    const processedRegistration = {
      ...body.registration,
      fullName:
        body.registration.fullName?.toUpperCase?.() ||
        body.registration.fullName,
      credentialName:
        body.registration.credentialName?.toUpperCase?.() ||
        body.registration.credentialName,
      occupation:
        body.registration.occupation?.toUpperCase?.() ||
        body.registration.occupation,
      howDidYouHearAboutUs:
        body.registration.howDidYouHearAboutUs?.toUpperCase?.() ||
        body.registration.howDidYouHearAboutUs,
      howDidYouHearAboutUsOther:
        body.registration.howDidYouHearAboutUsOther?.toUpperCase?.() ||
        body.registration.howDidYouHearAboutUsOther,
    };

    registration = {
      schemaVersion: 2,
      eventId: body.eventId,
      checkoutId: voucherData.checkoutId,
      attendeeUserId: authenticatedUser.uid,
      createdByUserId: authenticatedUser.uid,
      createdByRole: "attendee",
      createdAt: new Date(),
      status: getRegistrationStatus(buyerCheckoutData),
      ...processedRegistration,
    };

    await firestore
      .collection("registrations")
      .doc(registrationId)
      .set(registration);
  } catch (error) {
    console.error(error);
    return createErrorResponse("Erro ao criar inscrição", 500);
  }

  return createSuccessResponse<CreateVoucherCheckoutResponse>(
    {
      registrationId,
      registration,
    },
    200
  );
}

function getRegistrationStatus(
  buyerCheckoutData: CheckoutDocument
): RegistrationStatus {
  if (
    buyerCheckoutData.checkoutType === "admin" ||
    buyerCheckoutData.status === "paid" ||
    buyerCheckoutData.status === "approved"
  ) {
    return "ok";
  }
  if (buyerCheckoutData.status === "pending") {
    return "pending";
  }
  return "invalid";
}
