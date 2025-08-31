import { useCallback } from "react";
import { useFirebase } from "./firebase";
import {
  CheckoutDocument,
  CheckoutResponse,
  CheckoutStatus,
  CreateCheckoutRequest,
  UpdateCheckoutRequest,
} from "../api/checkouts/checkout.types";
import { createCheckoutDocumentId } from "../api/checkouts/utils";
import { collection, doc, getDoc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { CheckoutData } from "../types/checkout";

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
      const response = await makeAuthenticatedRequest("/api/checkouts", {
        method: "POST",
        body: JSON.stringify(checkoutData),
      });

      if (!response.ok) {
        throw new Error((await response.json()).error);
      }

      return await response.json();
    },
    [makeAuthenticatedRequest]
  );

  // Atualizar checkout existente
  const updateCheckout = useCallback(
    async (
      checkoutId: string,
      updateData: UpdateCheckoutRequest
    ): Promise<CheckoutResponse> => {
      const response = await makeAuthenticatedRequest(
        `/api/checkouts/${checkoutId}`,
        {
          method: "PUT",
          body: JSON.stringify(updateData),
        }
      );

      if (!response.ok) {
        throw new Error((await response.json()).error);
      }

      return await response.json();
    },
    [makeAuthenticatedRequest]
  );

  // "Deletar" checkout (marcar como deletado)
  const deleteCheckout = useCallback(
    async (checkoutId: string): Promise<any> => {
      const response = await makeAuthenticatedRequest(
        `/api/checkouts/${checkoutId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error((await response.json()).error);
      }

      return await response.json();
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

  // Only for admin
  const changeCheckoutStatus = useCallback(
    async (checkoutId: string, status: CheckoutStatus): Promise<CheckoutResponse> => {
      const response = await makeAuthenticatedRequest(
        `/api/checkouts/${checkoutId}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ status }),
        }
      );

      if (!response.ok) {
        throw new Error((await response.json()).error);
      }

      return await response.json();
    },
    [makeAuthenticatedRequest]
  );

  // Only for admin
  const listCheckoutsByEvent = useCallback(
    async (eventId: string): Promise<CheckoutData[]> => {
      const checkoutsQuery = query(
        collection(firestore, "checkouts"),
        where("eventId", "==", eventId),
        where("checkoutType", "==", "acquire")
      );
      const checkoutsDoc = await getDocs(checkoutsQuery);
      return checkoutsDoc.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as CheckoutDocument),
      }));
    },
    [firestore]
  );

  // Buscar checkout por ID (para admin)
  const getCheckoutById = useCallback(
    async (checkoutId: string): Promise<CheckoutData> => {
      try {
        const checkoutRef = doc(firestore, "checkouts", checkoutId);
        const checkoutDoc = await getDoc(checkoutRef);

        if (!checkoutDoc.exists()) {
          throw new Error("Checkout não encontrado");
        }

        return {
          id: checkoutDoc.id,
          ...(checkoutDoc.data() as CheckoutDocument),
        };
      } catch (error) {
        console.error("Error fetching checkout document:", error);
        throw error;
      }
    },
    [firestore]
  );

  return {
    changeCheckoutStatus,
    createCheckout,
    deleteCheckout,
    getCheckout,
    getCheckoutById,
    listCheckoutsByEvent,
    updateCheckout,
  };
};
