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
 * - **If the current registration is cancelled, it should remain cancelled no matter the checkout status change**
 * - If the checkout is completed, its registrations should become ok
 * - If the checkout is pending, its registrations should become pending
 * - If the checkout is deleted, its registrations should become invalid
 *
 * @param newCheckoutStatus - The new status of the checkout
 * @param currRegistrationStatus - The current status of the registration
 * @returns The new status of the registration
 */
export function getRegistrationStatusFromCheckoutStatusChange(
  newCheckoutStatus: CheckoutStatus,
  currRegistrationStatus: RegistrationStatus
): RegistrationStatus {
  if (currRegistrationStatus === "invalid") return "invalid";
  if (newCheckoutStatus === "completed") {
    switch (currRegistrationStatus) {
      case "cancelled":
        return "cancelled";
      default:
        return "ok";
    }
  } else if (newCheckoutStatus === "pending") {
    switch (currRegistrationStatus) {
      case "cancelled":
        return "cancelled";
      default:
        return "pending";
    }
  } else {
    return "invalid";
  }
}
