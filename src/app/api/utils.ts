import { DecodedIdToken } from "firebase-admin/auth";
import { Firestore } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { CheckoutStatus } from "./checkouts/checkout.types";
import { RegistrationStatus } from "./registrations/registration.types";

export function createErrorResponse(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function createSuccessResponse<T>(data: T, status: number = 200) {
  return NextResponse.json(data, { status });
}

export async function isUserAdmin(
  user: DecodedIdToken,
  fs: Firestore
): Promise<boolean> {
  const userDoc = await fs.collection("users").doc(user.uid).get();
  const userData = userDoc.data();
  return userData?.admin === true;
}

/**
 * Returns the new registration status when the checkout status changes.
 * Rules: invalid stays invalid; refunded → invalid; approved/paid → ok (unless cancelled); pending → pending (unless cancelled).
 */
export function getRegistrationStatusFromCheckoutStatusChange(
  newCheckoutStatus: CheckoutStatus,
  currRegistrationStatus: RegistrationStatus,
): RegistrationStatus {
  if (currRegistrationStatus === "invalid") return "invalid";
  if (newCheckoutStatus === "refunded") return "invalid";
  if (newCheckoutStatus === "approved" || newCheckoutStatus === "paid")
    return currRegistrationStatus === "cancelled" ? "cancelled" : "ok";
  if (newCheckoutStatus === "pending")
    return currRegistrationStatus === "cancelled" ? "cancelled" : "pending";
  return "invalid";
}
