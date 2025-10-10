import { useCallback } from "react";
import { useFirebase } from "./firebase";
import {
  CheckoutDocument,
  CommitmentPayment,
  DeleteCommitmentAttachmentRequest,
  UpdateCommitmentStatusRequest,
} from "../api/checkouts/checkout.types";
import { CheckoutData } from "../types/checkout";

export const useCommitmentAPI = () => {
  const { getIdToken } = useFirebase();

  const makeAuthenticatedRequest = useCallback(
    async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
      const idToken = await getIdToken();
      // Se o body for FormData, não defina o Content-Type manualmente
      const isFormData = options.body instanceof FormData;
      return fetch(endpoint, {
        ...options,
        headers: {
          ...(isFormData
            ? { Authorization: `Bearer ${idToken}` }
            : {
                "Content-Type": "application/json",
                Authorization: `Bearer ${idToken}`,
              }),
          ...options.headers,
        },
      });
    },
    [getIdToken]
  );

  const deleteCommitmentAttachment = useCallback(
    async (checkoutId: string, params: DeleteCommitmentAttachmentRequest): Promise<void> => {
      const { ...bodyParams } = params;
      await makeAuthenticatedRequest(
        `/api/checkouts/${checkoutId}/commitment`,
        { method: "DELETE", body: JSON.stringify(bodyParams) }
      );
    },
    [makeAuthenticatedRequest]
  );

  const sendCommitmentReceipt = useCallback(
    async ({
      checkout,
      file,
    }: {
      checkout: CheckoutData;
      file: File;
    }): Promise<void> => {
      const formData = new FormData();
      formData.append("file", file);

      await makeAuthenticatedRequest(
        `/api/checkouts/${checkout.id}/commitment`,
        {
          method: "POST",
          body: formData,
        }
      );
    },
    [makeAuthenticatedRequest]
  );

  const sendPaymentReceipt = useCallback(
    async ({
      checkout,
      file,
    }: {
      checkout: CheckoutData;
      file: File;
    }): Promise<void> => {
      const formData = new FormData();
      formData.append("file", file);

      await makeAuthenticatedRequest(
        `/api/checkouts/${checkout.id}/commitment`,
        {
          method: "PATCH",
          body: formData,
        }
      );
    },
    [makeAuthenticatedRequest]
  );

  const updateCommitmentStatus = useCallback(
    async (checkoutId: string, params: UpdateCommitmentStatusRequest): Promise<void> => {
      await makeAuthenticatedRequest(
        `/api/checkouts/${checkoutId}/commitment/status`,
        { method: "PUT", body: JSON.stringify(params) }
      );
    },
    [makeAuthenticatedRequest]
  );

  return {
    deleteCommitmentAttachment,
    sendCommitmentReceipt,
    sendPaymentReceipt,
    updateCommitmentStatus,
  };
};
