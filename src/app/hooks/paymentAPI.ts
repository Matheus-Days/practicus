import { useCallback } from "react";
import { useFirebase } from "./firebase";
import {
  DeleteCommitmentAttachmentRequest,
  UpdateCheckoutStatusRequest,
} from "../api/checkouts/checkout.types";
import { CheckoutData } from "../types/checkout";

export const usePaymentAPI = () => {
  const { getIdToken } = useFirebase();

  const makeAuthenticatedRequest = useCallback(
    async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
      const idToken = await getIdToken();
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

  const deletePaymentAttachment = useCallback(
    async (
      checkoutId: string,
      params: DeleteCommitmentAttachmentRequest
    ): Promise<void> => {
      const { ...bodyParams } = params;
      await makeAuthenticatedRequest(`/api/checkouts/${checkoutId}/payment`, {
        method: "DELETE",
        body: JSON.stringify(bodyParams),
      });
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

      await makeAuthenticatedRequest(`/api/checkouts/${checkout.id}/payment`, {
        method: "POST",
        body: formData,
      });
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

      await makeAuthenticatedRequest(`/api/checkouts/${checkout.id}/payment`, {
        method: "PATCH",
        body: formData,
      });
    },
    [makeAuthenticatedRequest]
  );

  const sendInvoiceReceipt = useCallback(
    async ({
      checkout,
      file,
    }: {
      checkout: CheckoutData;
      file: File;
    }): Promise<void> => {
      const formData = new FormData();
      formData.append("file", file);

      await makeAuthenticatedRequest(`/api/checkouts/${checkout.id}/payment`, {
        method: "PUT",
        body: formData,
      });
    },
    [makeAuthenticatedRequest]
  );

  const updatePaymentStatus = useCallback(
    async (checkoutId: string, params: UpdateCheckoutStatusRequest): Promise<void> => {
      await makeAuthenticatedRequest(`/api/checkouts/${checkoutId}/status`, {
        method: "PATCH",
        body: JSON.stringify(params),
      });
    },
    [makeAuthenticatedRequest]
  );

  return {
    deletePaymentAttachment,
    sendCommitmentReceipt,
    sendPaymentReceipt,
    sendInvoiceReceipt,
    updatePaymentStatus,
  };
};
