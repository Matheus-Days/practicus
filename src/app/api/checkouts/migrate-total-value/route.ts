import { NextRequest } from "next/server";
import { firestore } from "@/lib/firebase-admin";
import { validateAuth } from "@/lib/auth-utils";
import { DecodedIdToken } from "firebase-admin/auth";
import { createErrorResponse, createSuccessResponse, isUserAdmin } from "../../utils";
import { CheckoutDocument } from "../checkout.types";
import { EventDocument } from "../../../types/events";
import { calculateTotalPurchasePrice } from "../../../../lib/checkout-utils";

// CAUTION: This route is only for developers use only. It is not meant to be used by the public.
// POST /api/checkouts/migrate-total-value - Migrar totalValue para checkouts que não têm
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

    // Verificar se o usuário é admin
    const isAdmin = await isUserAdmin(authenticatedUser, firestore);
    if (!isAdmin) {
      return createErrorResponse(
        "Acesso negado. Apenas administradores podem executar migrações.",
        403
      );
    }

    const body = await request.json().catch(() => ({}));
    const { eventId } = body as { eventId?: string };

    // Validar que eventId é obrigatório
    if (!eventId || typeof eventId !== "string" || eventId.trim() === "") {
      return createErrorResponse(
        "eventId é obrigatório e deve ser uma string não vazia",
        400
      );
    }

    // Verificar se o evento existe
    const eventDoc = await firestore.collection("events").doc(eventId).get();
    if (!eventDoc.exists) {
      return createErrorResponse(
        `Evento ${eventId} não encontrado`,
        404
      );
    }

    const event = eventDoc.data() as EventDocument;

    // Verificar se o evento tem priceBreakpoints
    if (!event.priceBreakpoints || event.priceBreakpoints.length === 0) {
      return createErrorResponse(
        `Evento ${eventId} não possui priceBreakpoints configurados`,
        400
      );
    }

    // Buscar checkouts do evento que precisam de migração
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
        skipped: 0,
        errors: [],
      });
    }

    // Filtrar checkouts que precisam de migração (não tem totalValue ou totalValue é 0)
    const checkoutsToMigrate: Array<{ id: string; data: CheckoutDocument }> = [];
    
    checkoutsSnapshot.docs.forEach((doc) => {
      const checkoutData = doc.data() as CheckoutDocument;
      
      if (!checkoutData.totalValue || checkoutData.totalValue === 0) {
        checkoutsToMigrate.push({
          id: doc.id,
          data: checkoutData,
        });
      }
    });

    if (checkoutsToMigrate.length === 0) {
      return createSuccessResponse({
        message: `Todos os checkouts do evento ${eventId} já possuem totalValue`,
        eventId,
        updated: 0,
        skipped: checkoutsSnapshot.size,
        errors: [],
      });
    }

    // Processar migração em batches
    const BATCH_SIZE = 500; // Limite do Firestore
    const errors: Array<{ checkoutId: string; error: string }> = [];
    let updated = 0;
    let skipped = 0;

    // Processar checkouts em batches
    for (let i = 0; i < checkoutsToMigrate.length; i += BATCH_SIZE) {
      const batch = firestore.batch();
      const batchCheckouts = checkoutsToMigrate.slice(i, i + BATCH_SIZE);

      for (const { id, data: checkoutData } of batchCheckouts) {
        try {
          // Calcular totalValue
          const totalValue = calculateTotalPurchasePrice(event, checkoutData);

          // Atualizar checkout
          const checkoutRef = firestore.collection("checkouts").doc(id);
          batch.update(checkoutRef, {
            totalValue,
            updatedAt: new Date(),
          } as Partial<CheckoutDocument>);

          updated++;
        } catch (error) {
          errors.push({
            checkoutId: id,
            error: error instanceof Error ? error.message : "Erro desconhecido",
          });
          skipped++;
        }
      }

      // Commit do batch
      try {
        await batch.commit();
      } catch (batchError) {
        console.error("Erro ao commitar batch:", batchError);
        // Se o batch falhar, adicionar todos os checkouts do batch aos erros
        batchCheckouts.forEach(({ id }) => {
          errors.push({
            checkoutId: id,
            error: "Erro ao commitar batch",
          });
        });
        skipped += batchCheckouts.length;
        updated -= batchCheckouts.length; // Remover da contagem de atualizados
      }
    }

    return createSuccessResponse({
      message: `Migração concluída para o evento ${eventId}. ${updated} checkouts atualizados, ${skipped} pulados, ${errors.length} erros.`,
      eventId,
      updated,
      skipped,
      totalCheckouts: checkoutsSnapshot.size,
      errors: errors.slice(0, 100), // Limitar a 100 erros na resposta
      totalErrors: errors.length,
    });
  } catch (error) {
    console.error("Erro ao executar migração:", error);
    return createErrorResponse(
      "Erro interno do servidor ao executar migração",
      500
    );
  }
}