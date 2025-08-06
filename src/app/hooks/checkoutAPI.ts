import { useCallback } from "react";
import { useFirebase } from "./firebase";
import {
  CheckoutDocument,
  CheckoutResponse,
  CreateCheckoutRequest,
  UpdateCheckoutRequest,
} from "../api/checkouts/checkout.types";
import { createCheckoutDocumentId } from "../api/checkouts/utils";
import { doc, getDoc } from "firebase/firestore";

export interface CheckoutAPIError {
  message: string;
  status?: number;
}

export const useCheckoutAPI = () => {
  const { getIdToken, firestore } = useFirebase();

  // Função utilitária para fazer requisições autenticadas
  const makeAuthenticatedRequest = useCallback(
    async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
      const idToken = await getIdToken();

      if (!idToken) {
        throw new Error("Usuário não autenticado");
      }

      return fetch(endpoint, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
          ...options.headers,
        },
      });
    },
    [getIdToken]
  );

  // Criar novo checkout
  const createCheckout = useCallback(
    async (checkoutData: CreateCheckoutRequest): Promise<CheckoutResponse> => {
      try {
        const response = await makeAuthenticatedRequest("/api/checkouts", {
          method: "POST",
          body: JSON.stringify(checkoutData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Erro ao criar checkout");
        }

        return await response.json();
      } catch (error) {
        console.error("Error creating checkout:", error);
        throw error;
      }
    },
    [makeAuthenticatedRequest]
  );

  // Atualizar checkout existente
  const updateCheckout = useCallback(
    async (
      checkoutId: string,
      updateData: UpdateCheckoutRequest
    ): Promise<CheckoutResponse> => {
      try {
        const response = await makeAuthenticatedRequest(
          `/api/checkouts/${checkoutId}`,
          {
            method: "PUT",
            body: JSON.stringify(updateData),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Erro ao atualizar checkout");
        }

        return await response.json();
      } catch (error) {
        console.error("Error updating checkout:", error);
        throw error;
      }
    },
    [makeAuthenticatedRequest]
  );

  // "Deletar" checkout (marcar como deletado)
  const deleteCheckout = useCallback(
    async (checkoutId: string): Promise<any> => {
      try {
        const response = await makeAuthenticatedRequest(
          `/api/checkouts/${checkoutId}`,
          {
            method: "DELETE",
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Erro ao deletar checkout");
        }

        return await response.json();
      } catch (error) {
        console.error("Error deleting checkout:", error);
        throw error;
      }
    },
    [makeAuthenticatedRequest]
  );

  // Buscar checkout por ID
  const getCheckout = useCallback(
    async (
      eventId: string,
      userUid: string
    ): Promise<{ documentId: string; document: CheckoutDocument } | null> => {
      try {
        const checkoutId = createCheckoutDocumentId(eventId, userUid);
        const checkoutRef = doc(firestore, "checkouts", checkoutId);
        const checkoutDoc = await getDoc(checkoutRef);

        if (checkoutDoc.exists()) {
          return {
            documentId: checkoutDoc.id,
            document: checkoutDoc.data() as CheckoutDocument,
          };
        }

        return null;
      } catch (error) {
        console.error("Error fetching checkout document:", error);
        throw error;
      }
    },
    [firestore]
  );

  // Listar checkouts do usuário
  const listUserCheckouts = useCallback(async (): Promise<any[]> => {
    try {
      const response = await makeAuthenticatedRequest("/api/checkouts", {
        method: "GET",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao listar checkouts");
      }

      return await response.json();
    } catch (error) {
      console.error("Error listing checkouts:", error);
      throw error;
    }
  }, [makeAuthenticatedRequest]);

  return {
    createCheckout,
    updateCheckout,
    deleteCheckout,
    getCheckout,
    listUserCheckouts,
  };
};
