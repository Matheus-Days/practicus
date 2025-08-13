import { useCallback } from "react";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { useFirebase } from "./firebase";
import {
  CreateRegistrationRequest,
  RegistrationDocument,
  RegistrationResponse,
  UpdateRegistrationRequest,
} from "../api/registrations/registration.types";
import { generateRegistrationDocumentId } from "../api/registrations/utils";

export type RegistrationData = RegistrationDocument & {
  id: string;
};

export type RegistrationMinimal = Pick<
  RegistrationData,
  "id" | "fullName" | "email" | "status"
> & {
  isMyRegistration: boolean;
};

export const useRegistrationAPI = () => {
  const { getIdToken, firestore } = useFirebase();

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

  // CREATE - Criar nova inscrição
  const createRegistration = useCallback(
    async (
      registrationData: CreateRegistrationRequest
    ): Promise<RegistrationResponse> => {
      try {
        const response = await makeAuthenticatedRequest("/api/registrations", {
          method: "POST",
          body: JSON.stringify(registrationData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Erro ao criar inscrição");
        }

        return await response.json();
      } catch (error) {
        throw error;
      }
    },
    [makeAuthenticatedRequest]
  );

  // READ - Buscar inscrição por eventId e userUid
  const getRegistration = useCallback(
    async (eventId: string, userUid: string): Promise<RegistrationData | null> => {
      try {
        const registrationId = generateRegistrationDocumentId(eventId, userUid);
        const registrationRef = doc(firestore, "registrations", registrationId);
        const registrationDoc = await getDoc(registrationRef);

        if (registrationDoc.exists()) {
          return {
            id: registrationDoc.id,
            ...registrationDoc.data(),
          } as RegistrationData;
        }

        return null;
      } catch (error) {
        console.error("Erro ao buscar inscrição:", error);
        throw error;
      }
    },
    [firestore]
  );

  // READ - Buscar todas as inscrições de um evento
  const getEventRegistrations = useCallback(
    async (eventId: string): Promise<RegistrationData[]> => {
      try {
        const registrationsRef = collection(firestore, "registrations");
        const q = query(registrationsRef, where("eventId", "==", eventId));

        const querySnapshot = await getDocs(q);
        const registrations: RegistrationData[] = [];

        querySnapshot.forEach((doc) => {
          registrations.push({
            id: doc.id,
            ...doc.data(),
          } as RegistrationData);
        });

        return registrations;
      } catch (error) {
        console.error("Erro ao buscar inscrições do evento:", error);
        throw error;
      }
    },
    [firestore]
  );

  // READ - Buscar inscrições de um checkout com campos limitados
  const getCheckoutRegistrations = useCallback(
    async (checkoutId: string): Promise<Array<RegistrationMinimal>> => {
      try {
        const registrationsRef = collection(firestore, "registrations");
        const q = query(
          registrationsRef,
          where("checkoutId", "==", checkoutId)
        );

        const querySnapshot = await getDocs(q);
        const registrations: Array<RegistrationMinimal> = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          registrations.push({
            id: doc.id,
            fullName: data.fullName,
            email: data.email,
            status: data.status,
            isMyRegistration: doc.id === checkoutId,
          });
        });

        return registrations;
      } catch (error) {
        console.error("Erro ao buscar inscrições do checkout:", error);
        throw error;
      }
    },
    [firestore]
  );

  // UPDATE - Atualizar inscrição
  const updateRegistration = useCallback(
    async (
      userId: string,
      eventId: string,
      updateData: UpdateRegistrationRequest
    ): Promise<RegistrationResponse> => {
      try {
        const registrationId = generateRegistrationDocumentId(eventId, userId);

        const response = await makeAuthenticatedRequest(
          `/api/registrations/${registrationId}`,
          {
            method: "PUT",
            body: JSON.stringify(updateData),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Erro ao atualizar inscrição");
        }

        return await response.json();
      } catch (error) {
        console.error("Erro ao atualizar inscrição:", error);
        throw error;
      }
    },
    [makeAuthenticatedRequest]
  );

  // UPDATE - Atualizar status da inscrição
  const updateRegistrationStatus = useCallback(
    async (
      registrationId: string,
      status: "ok" | "cancelled" | "invalid"
    ): Promise<RegistrationResponse> => {
      try {
        const response = await makeAuthenticatedRequest(
          `/api/registrations/${registrationId}/status`,
          {
            method: "PUT",
            body: JSON.stringify({ status }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Erro ao atualizar status da inscrição");
        }

        return await response.json();
      } catch (error) {
        console.error("Erro ao atualizar status da inscrição:", error);
        throw error;
      }
    },
    [makeAuthenticatedRequest]
  );

  return {
    createRegistration,
    getRegistration,
    getEventRegistrations,
    getCheckoutRegistrations,
    updateRegistration,
    updateRegistrationStatus,
  };
};
