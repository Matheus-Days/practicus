import { useCallback } from "react";
import { useFirebase } from "./firebase";
import {
  CreateVoucherCheckoutRequest,
  CreateVoucherCheckoutResponse,
  ValidateVoucherResponse,
  VoucherActivateRequest,
  VoucherDocument,
} from "../api/voucher/voucher.types";
import { doc, getDoc } from "firebase/firestore";

export type VoucherData = VoucherDocument & {
  id: string;
}

export const useVoucherAPI = () => {
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

  const changeVoucherActiveStatus = useCallback(
    async (voucherId: string, active: boolean): Promise<void> => {
      const response = await makeAuthenticatedRequest(`/api/voucher/${voucherId}/activate`, {
        method: "PATCH",
        body: JSON.stringify({ active } as VoucherActivateRequest),
      });

      if (!response.ok) {
        throw new Error((await response.json()).error);
      }
    }, [makeAuthenticatedRequest]
  );

  const createVoucherCheckout = useCallback(
    async (
      voucherId: string,
      checkoutData: CreateVoucherCheckoutRequest
    ): Promise<CreateVoucherCheckoutResponse> => {
      const response = await makeAuthenticatedRequest(
        `/api/voucher/${voucherId}/registrate`,
        {
          method: "POST",
          body: JSON.stringify(checkoutData),
        }
      );

      if (!response.ok) {
        throw new Error((await response.json()).error);
      }

      return await response.json();
    },
    [makeAuthenticatedRequest]
  );

  const getVoucher = useCallback(
    async (voucherId: string): Promise<VoucherData> => {
      const voucherRef = doc(firestore, "vouchers", voucherId);
      const voucherDoc = await getDoc(voucherRef);

      if (!voucherDoc.exists()) {
        throw new Error("Voucher não encontrado.");
      }

      return {
        id: voucherDoc.id,
        ...voucherDoc.data() as VoucherDocument,
      };
    }, [firestore]
  );

  const validateVoucher = useCallback(
    async (voucherId: string): Promise<ValidateVoucherResponse> => {
      const response = await fetch(`/api/voucher/${voucherId}/validate`, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error((await response.json()).message);
      }

      return await response.json();
    }, []
  );

  return {
    changeVoucherActiveStatus,
    createVoucherCheckout,
    getVoucher,
    validateVoucher,
  }
}