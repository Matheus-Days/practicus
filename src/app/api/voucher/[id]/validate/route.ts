// GET /api/voucher/:id/validate

import { NextRequest, NextResponse } from "next/server";
import { validateVoucher } from "../../utils";
import { firestore } from "@/lib/firebase-admin";
import { VoucherDocument } from "../../voucher.types";

export async function GET(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const voucherDoc = await firestore.collection("vouchers").doc(id).get();

  if (!voucherDoc.exists) {
    return NextResponse.json(
      { valid: false, message: "Voucher não encontrado." },
      { status: 404 }
    );
  }

  const res = await validateVoucher(firestore, {
    ...(voucherDoc.data() as VoucherDocument),
    id,
  });

  return NextResponse.json(res, { status: res.valid ? 200 : 403 });
}
