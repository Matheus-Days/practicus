import { NextRequest, NextResponse } from "next/server";
import { firestore } from "@/lib/firebase-admin";
import { validateAuth } from "@/lib/auth-utils";
import {
  createErrorResponse,
  createSuccessResponse,
  isUserAdmin,
} from "@/app/api/utils";
import { CheckoutDocument } from "@/app/api/checkouts/checkout.types";
import {
  RegistrationDocument,
  RegistrationStatus,
} from "@/app/api/registrations/registration.types";
type MigrationResult = {
  processed: number;
  migrated: number;
  skippedAlreadyV2: number;
  errors: number;
};

function computeRegistrationStatusFromCheckout(
  checkout: CheckoutDocument
): RegistrationStatus {
  if (checkout.status === "approved" || checkout.status === "paid") return "ok";
  if (checkout.status === "pending") return "pending";
  return "invalid";
}

// POST /api/admin/migrations/registrations-v2
export async function POST(request: NextRequest) {
  let authenticatedUser;
  try {
    authenticatedUser = await validateAuth(request);
  } catch {
    return createErrorResponse(
      "Não autorizado. Token de autenticação inválido ou expirado.",
      401
    );
  }

  const admin = await isUserAdmin(authenticatedUser, firestore);
  if (!admin) {
    return createErrorResponse(
      "Usuário não tem permissão para executar migrações",
      403
    );
  }

  const result: MigrationResult = {
    processed: 0,
    migrated: 0,
    skippedAlreadyV2: 0,
    errors: 0,
  };

  try {
    const snapshot = await firestore.collection("registrations").get();

    for (const docSnap of snapshot.docs) {
      result.processed += 1;

      const data = docSnap.data() as any;
      if (data?.schemaVersion === 2) {
        result.skippedAlreadyV2 += 1;
        continue;
      }

      const legacyRegistration = data as any;
      const legacyUserId = legacyRegistration.userId as string | undefined;
      const legacyCheckoutId = legacyRegistration.checkoutId as
        | string
        | undefined;
      const legacyEventId = legacyRegistration.eventId as string | undefined;

      if (!legacyUserId || !legacyEventId) {
        result.errors += 1;
        continue;
      }

      // No modelo legado sempre existia checkoutId, mas garantimos compatibilidade.
      let checkout: CheckoutDocument | null = null;
      if (legacyCheckoutId) {
        const checkoutDoc = await firestore
          .collection("checkouts")
          .doc(legacyCheckoutId)
          .get();
        if (checkoutDoc.exists)
          checkout = checkoutDoc.data() as CheckoutDocument;
      }

      // Inferência de criador:
      // - se existe checkout e o userId da inscrição == checkout.userId, assumimos que foi criada pelo buyer (self-registration)
      // - caso contrário, assumimos attendee (via voucher)
      const createdByRole =
        checkout && checkout.userId === legacyUserId
          ? ("buyer" as const)
          : ("attendee" as const);
      const createdByUserId =
        createdByRole === "buyer" && checkout ? checkout.userId : legacyUserId;

      const newDocId = crypto.randomUUID();
      const newRegistration: RegistrationDocument = {
        schemaVersion: 2,
        eventId: legacyEventId,
        checkoutId: legacyCheckoutId,
        attendeeUserId: legacyUserId,
        createdByUserId,
        createdByRole,
        createdAt: legacyRegistration.createdAt?.toDate?.()
          ? legacyRegistration.createdAt.toDate()
          : legacyRegistration.createdAt
            ? new Date(legacyRegistration.createdAt)
            : new Date(),
        updatedAt: legacyRegistration.updatedAt?.toDate?.()
          ? legacyRegistration.updatedAt.toDate()
          : legacyRegistration.updatedAt
            ? new Date(legacyRegistration.updatedAt)
            : undefined,
        status: checkout
          ? computeRegistrationStatusFromCheckout(checkout)
          : legacyRegistration.status,
        // form fields
        cpf: legacyRegistration.cpf,
        credentialName: legacyRegistration.credentialName,
        email: legacyRegistration.email,
        fullName: legacyRegistration.fullName,
        howDidYouHearAboutUs: legacyRegistration.howDidYouHearAboutUs,
        howDidYouHearAboutUsOther: legacyRegistration.howDidYouHearAboutUsOther,
        isPhoneWhatsapp: legacyRegistration.isPhoneWhatsapp ?? false,
        occupation: legacyRegistration.occupation,
        phone: legacyRegistration.phone,
        useImage: legacyRegistration.useImage ?? false,
      };

      // Escreve novo doc V2 e marca o legado como migrado (mantemos para rastreio).
      const batch = firestore.batch();
      batch.set(
        firestore.collection("registrations").doc(newDocId),
        newRegistration
      );
      batch.update(docSnap.ref, {
        migratedToV2: true,
        migratedToV2At: new Date(),
        legacyId: docSnap.id,
      });
      await batch.commit();

      result.migrated += 1;
    }

    return createSuccessResponse(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json(result, { status: 500 });
  }
}
