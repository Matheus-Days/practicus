import { NextRequest } from "next/server";
import { firestore } from "@/lib/firebase-admin";
import { validateAuth } from "@/lib/auth-utils";
import { DecodedIdToken } from "firebase-admin/auth";
import {
  createErrorResponse,
  createSuccessResponse,
  isUserAdmin,
} from "../../utils";
import { CheckoutDocument } from "../checkout.types";
import { EventDocument } from "../../../types/events";

// CAUTION: Admin / operação manual. Não expor ao público.
// POST /api/checkouts/migrate-price-breakpoints
// Preenche priceBreakpointsAtCheckout a partir do evento atual quando ausente.
// Melhor esforço: se o preço do evento já mudou desde a compra, o snapshot não reflete a política histórica.
export async function POST(request: NextRequest) {
  try {
    let authenticatedUser: DecodedIdToken;

    try {
      authenticatedUser = await validateAuth(request);
    } catch {
      return createErrorResponse(
        "Não autorizado. Token de autenticação inválido ou expirado.",
        401
      );
    }

    const isAdmin = await isUserAdmin(authenticatedUser, firestore);
    if (!isAdmin) {
      return createErrorResponse(
        "Acesso negado. Apenas administradores podem executar migrações.",
        403
      );
    }

    const body = await request.json().catch(() => ({}));
    const { eventId } = body as { eventId?: string };

    if (!eventId || typeof eventId !== "string" || eventId.trim() === "") {
      return createErrorResponse(
        "eventId é obrigatório e deve ser uma string não vazia",
        400
      );
    }

    const eventDoc = await firestore.collection("events").doc(eventId).get();
    if (!eventDoc.exists) {
      return createErrorResponse(`Evento ${eventId} não encontrado`, 404);
    }

    const event = eventDoc.data() as EventDocument;

    if (!event.priceBreakpoints || event.priceBreakpoints.length === 0) {
      return createErrorResponse(
        `Evento ${eventId} não possui priceBreakpoints configurados`,
        400
      );
    }

    const snapshotFromEvent = [...event.priceBreakpoints]
      .sort((a, b) => a.minQuantity - b.minQuantity)
      .map((bp) => ({ ...bp }));

    const checkoutsQuery = firestore
      .collection("checkouts")
      .where("checkoutType", "==", "acquire")
      .where("eventId", "==", eventId);

    const checkoutsSnapshot = await checkoutsQuery.get();

    if (checkoutsSnapshot.empty) {
      return createSuccessResponse({
        message: `Nenhum checkout encontrado para o evento ${eventId}`,
        eventId,
        updated: 0,
        skipped: checkoutsSnapshot.size,
        errors: [],
      });
    }

    const checkoutsToMigrate: Array<{ id: string }> = [];

    checkoutsSnapshot.docs.forEach((doc) => {
      const data = doc.data() as CheckoutDocument;
      if (!data.priceBreakpointsAtCheckout?.length) {
        checkoutsToMigrate.push({ id: doc.id });
      }
    });

    if (checkoutsToMigrate.length === 0) {
      return createSuccessResponse({
        message: `Todos os checkouts do evento ${eventId} já possuem snapshot de preços`,
        eventId,
        updated: 0,
        skipped: checkoutsSnapshot.size,
        errors: [],
      });
    }

    const BATCH_SIZE = 500;
    const errors: Array<{ checkoutId: string; error: string }> = [];
    let updated = 0;
    let skipped = 0;

    for (let i = 0; i < checkoutsToMigrate.length; i += BATCH_SIZE) {
      const batch = firestore.batch();
      const batchCheckouts = checkoutsToMigrate.slice(i, i + BATCH_SIZE);

      for (const { id } of batchCheckouts) {
        const checkoutRef = firestore.collection("checkouts").doc(id);
        batch.update(checkoutRef, {
          priceBreakpointsAtCheckout: snapshotFromEvent.map((bp) => ({ ...bp })),
          updatedAt: new Date(),
        } as Partial<CheckoutDocument>);
        updated++;
      }

      try {
        await batch.commit();
      } catch (batchError) {
        console.error("Erro ao commitar batch:", batchError);
        batchCheckouts.forEach(({ id }) => {
          errors.push({
            checkoutId: id,
            error: "Erro ao commitar batch",
          });
        });
        skipped += batchCheckouts.length;
        updated -= batchCheckouts.length;
      }
    }

    return createSuccessResponse({
      message: `Migração de snapshot de preços concluída para o evento ${eventId}. ${updated} checkouts atualizados, ${skipped} pulados com erro.`,
      eventId,
      updated,
      skipped,
      totalCheckouts: checkoutsSnapshot.size,
      errors: errors.slice(0, 100),
      totalErrors: errors.length,
    });
  } catch (error) {
    console.error("Erro ao executar migração de preços:", error);
    return createErrorResponse(
      "Erro interno do servidor ao executar migração",
      500
    );
  }
}
