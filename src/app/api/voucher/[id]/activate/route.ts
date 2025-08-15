// POST /api/voucher/:id/activate

import { DecodedIdToken } from "firebase-admin/auth";
import { NextRequest, NextResponse } from "next/server";
import { validateAuth } from "../../../../../lib/auth-utils";
import { createErrorResponse } from "../../../utils";
import { VoucherActivateRequest, VoucherDocument } from "../../voucher.types";
import { firestore } from "../../../../../lib/firebase-admin";
import { CheckoutDocument } from "../../../checkouts/checkout.types";
import { isUserAdmin } from "../../../registrations/utils";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let authenticatedUser: DecodedIdToken;
  let isAdmin = false;
  try {
    authenticatedUser = await validateAuth(request);
  } catch (authError) {
    return createErrorResponse(
      "Não autorizado. Token de autenticação inválido ou expirado.",
      401
    );
  }

  const { id } = params;
  const body = (await request.json()) as VoucherActivateRequest;

  if (body.active === undefined) {
    return createErrorResponse("Estado do voucher é obrigatório.", 400);
  }

  const voucherDoc = await firestore.collection("vouchers").doc(id).get();

  if (!voucherDoc.exists) {
    return createErrorResponse("Voucher não encontrado.", 404);
  }

  const voucherData = voucherDoc.data() as VoucherDocument;
  const buyerCheckoutDoc = await firestore
    .collection("checkouts")
    .doc(voucherData.checkoutId)
    .get();

  if (!buyerCheckoutDoc.exists) {
    return createErrorResponse("Checkout do comprador não encontrado.", 404);
  }

  const buyerCheckoutData = buyerCheckoutDoc.data() as CheckoutDocument;

  if (buyerCheckoutData.userId !== authenticatedUser.uid) {
    isAdmin = await isUserAdmin(authenticatedUser, firestore);
    if (!isAdmin)
      return createErrorResponse(
        "Você não tem permissão para ativar este voucher.",
        403
      );
  }

  await voucherDoc.ref.update({ active: body.active, updatedAt: new Date() });

  return new NextResponse(undefined, { status: 204 });
}
