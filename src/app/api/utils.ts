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
 * This function is used to get the new status of a registration based on the new status of the checkout and the current status of the registration.
 *
 * The rules are (from top to bottom, first match wins):
 * - If the current registration status (`currRegistrationStatus`) is ``invalid``, it should remain ``invalid`` no matter the checkout status change
 * - If the checkout (`newCheckoutStatus`) is ``deleted`` or ``refunded``, its registrations should become ``invalid``
 * - If the checkout (`newCheckoutStatus`) is ``completed``, its registrations should become ``ok``, unless the current registration status is ``cancelled``
 * - If the checkout (`newCheckoutStatus`) is ``pending`` but has commitment payment (``isCommitmentCheckout``), its registrations should become ``ok``, unless the current registration status is ``cancelled``, in which case it should remain ``cancelled``
 * - If the checkout (`newCheckoutStatus`) is ``pending`` and has regular payment, its registrations should become ``pending``, unless the current registration status is ``cancelled``, in which case it should remain ``cancelled``
 *
 * @param newCheckoutStatus - The new status of the checkout
 * @param currRegistrationStatus - The current status of the registration
 * @returns The new status of the registration
 */
export function getRegistrationStatusFromCheckoutStatusChange(
  newCheckoutStatus: CheckoutStatus,
  currRegistrationStatus: RegistrationStatus,
  isCommitmentCheckout = false,
): RegistrationStatus {
  if (currRegistrationStatus === "invalid") return "invalid";
  if (newCheckoutStatus === "deleted" || newCheckoutStatus === "refunded") return "invalid";
  if (newCheckoutStatus === "completed") return currRegistrationStatus === "cancelled" ? "cancelled" : "ok";
  if (newCheckoutStatus === "pending" && isCommitmentCheckout) return currRegistrationStatus === "cancelled" ? "cancelled" : "ok";
  if (newCheckoutStatus === "pending" && !isCommitmentCheckout) return currRegistrationStatus === "cancelled" ? "cancelled" : "pending";
  return "invalid";
}
