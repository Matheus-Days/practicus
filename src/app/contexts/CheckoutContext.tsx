"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { User } from "firebase/auth";
import {
  CheckoutContextType,
  CheckoutData,
  CheckoutStep,
} from "../types/checkout";
import {
  BillingDetailsPF,
  BillingDetailsPJ,
  CheckoutDocument,
  CheckoutType,
  CreateCheckoutRequest,
  UpdateCheckoutRequest,
  LegalEntity,
} from "../api/checkouts/checkout.types";
import { useCheckoutAPI } from "../hooks/checkoutAPI";
import {
  RegistrationData,
  RegistrationMinimal,
  useRegistrationAPI,
} from "../hooks/registrationAPI";
import { RegistrationFormData } from "../api/registrations/registration.types";
import { useVoucherAPI, VoucherData } from "../hooks/voucherAPI";

const CheckoutContext = createContext<CheckoutContextType | undefined>(
  undefined
);

interface CheckoutProviderProps {
  children: ReactNode;
  user: User | null;
  eventId: string;
}

export function CheckoutProvider({
  children,
  user,
  eventId,
}: CheckoutProviderProps) {
  const {
    createCheckout: createCheckoutDocument,
    updateCheckout: updateCheckoutDocument,
    deleteCheckout,
    getCheckout,
  } = useCheckoutAPI();
  const {
    createRegistration: createRegistrationAPI,
    getRegistration: getRegistrationAPI,
    updateRegistration: updateRegistrationAPI,
    getCheckoutRegistrations,
    updateRegistrationStatus: updateRegistrationStatusAPI,
  } = useRegistrationAPI();
  const {
    createVoucherCheckout: createVoucherCheckoutAPI,
    getVoucher,
    changeVoucherActiveStatus,
  } = useVoucherAPI();

  const [checkout, setCheckout] = useState<CheckoutData | null>(null);
  const [registration, setRegistration] = useState<RegistrationData | null>(
    null
  );
  const [checkoutRegistrations, setCheckoutRegistrations] = useState<
    Array<RegistrationMinimal>
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<CheckoutStep>("select-type");

  const [checkoutType, setCheckoutType] = useState<CheckoutType | null>(null);
  const [voucher, setVoucher] = useState<string | null>(null);
  const [voucherData, setVoucherData] = useState<VoucherData | null>(null);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [billingDetails, setBillingDetails] = useState<
    BillingDetailsPF | BillingDetailsPJ | null
  >(null);
  const [registrationsAmount, setRegistrationsAmount] = useState<number>(1);
  const [registrateMyself, setRegistrateMyself] = useState<boolean>(false);
  const [legalEntity, setLegalEntity] = useState<LegalEntity | null>(null);
  const [formData, setFormData] = useState<Partial<RegistrationFormData>>({});

  // Função para buscar dados do voucher
  const fetchVoucherData = useCallback(async () => {
    if (
      !voucher ||
      checkout?.checkoutType === "voucher" ||
      checkout?.status === "deleted"
    ) {
      setVoucherData(null);
      return;
    }

    try {
      setVoucherLoading(true);
      const voucherInfo = await getVoucher(voucher);
      setVoucherData(voucherInfo);
    } catch (error) {
      console.error("Erro ao carregar dados do voucher:", error);
      setVoucherData(null);
    } finally {
      setVoucherLoading(false);
    }
  }, [checkout, voucher, getVoucher]);

  // Função para alterar o status ativo do voucher
  const toggleVoucherActiveStatus = useCallback(
    async (active: boolean) => {
      if (!voucherData?.id) {
        throw new Error("Voucher não encontrado");
      }

      try {
        setVoucherLoading(true);
        await changeVoucherActiveStatus(voucherData.id, active);

        // Atualizar o estado local do voucher
        setVoucherData((prev) => (prev ? { ...prev, active } : null));
      } catch (error) {
        console.error("Erro ao alterar status do voucher:", error);
        throw error;
      } finally {
        setVoucherLoading(false);
      }
    },
    [voucherData?.id, changeVoucherActiveStatus]
  );

  // Função para buscar inscrições do checkout
  const fetchCheckoutRegistrations = useCallback(async () => {
    if (!checkout?.id) return;

    try {
      const registrations = await getCheckoutRegistrations(checkout.id);
      setCheckoutRegistrations(registrations);
    } catch (error) {
      console.error("Erro ao carregar inscrições do checkout:", error);
    }
  }, [checkout?.id, getCheckoutRegistrations]);

  // Função para buscar checkout do usuário
  const fetchUserCheckout = useCallback(async () => {
    if (!user || !eventId) throw new Error("Usuário ou evento não encontrado");
    const checkoutRes = await getCheckout(eventId, user.uid);
    if (checkoutRes) {
      fillCheckoutContext(checkoutRes.documentId, checkoutRes.document);
    }
  }, [user, eventId, getCheckout]);

  const fillCheckoutContext = (
    checkoutId: string,
    checkoutDoc: CheckoutDocument
  ) => {
    setCheckout({
      id: checkoutId,
      ...checkoutDoc,
    });
    setBillingDetails(checkoutDoc.billingDetails || null);
    setRegistrationsAmount(checkoutDoc.amount || 1);
    setRegistrateMyself(checkoutDoc.registrateMyself || false);
    setLegalEntity(checkoutDoc.legalEntity || null);
    setVoucher(checkoutDoc.voucher || null);
    setCheckoutType(checkoutDoc.checkoutType || null);

    // Se o checkout não está deletado, direcionar para o Dashboard
    if (checkoutDoc.status !== "deleted") {
      setCurrentStep("overview");
    }
  };

  // Função para buscar registration do usuário
  const fetchUserRegistration = useCallback(async () => {
    if (!user || !eventId) return;

    try {
      const registration = await getRegistrationAPI(eventId, user.uid);
      if (registration) {
        setRegistration(registration);
        // Preencher formData com os dados da registration existente
        setFormData({
          fullName: registration.fullName,
          email: registration.email,
          phone: registration.phone,
          cpf: registration.cpf,
          isPhoneWhatsapp: registration.isPhoneWhatsapp,
          credentialName: registration.credentialName,
          occupation: registration.occupation,
          employer: registration.employer,
          city: registration.city,
          useImage: registration.useImage,
          howDidYouHearAboutUs: registration.howDidYouHearAboutUs,
        });
      }
    } catch (error) {
      console.error("Erro ao buscar registration:", error);
    }
  }, [user, eventId, getRegistrationAPI]);

  // Função para criar novo checkout
  const createCheckout = async () => {
    if (
      !user ||
      !eventId ||
      !checkoutType ||
      !billingDetails ||
      registrationsAmount <= 0
    ) {
      throw new Error(
        "Informações obrigatórias para criação de checkout faltando."
      );
    }

    const checkoutData: CreateCheckoutRequest = {
      checkoutType,
      eventId,
      userId: user.uid,
      amount: registrationsAmount,
    };

    if (legalEntity) checkoutData.legalEntity = legalEntity;
    if (billingDetails) checkoutData.billingDetails = billingDetails;
    if (registrateMyself) checkoutData.registrateMyself = registrateMyself;

    try {
      setLoading(true);
      const res = await createCheckoutDocument(checkoutData);

      // Atualizar o checkout e todos os estados relacionados
      fillCheckoutContext(res.documentId, res.document);
      setCurrentStep("overview");
    } catch (error) {
      setError("Erro ao criar checkout");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Função para criar nova registration
  const createRegistration = async (registrationData: RegistrationFormData) => {
    if (!user || !eventId || !checkout?.id) {
      throw new Error("Usuário ou evento não encontrado");
    }

    // Garantir que campos obrigatórios estejam presentes
    if (
      !registrationData.fullName ||
      !registrationData.phone ||
      !registrationData.cpf
    ) {
      throw new Error("Campos obrigatórios não preenchidos");
    }

    try {
      setLoading(true);

      const result = await createRegistrationAPI({
        eventId,
        userId: user.uid,
        checkoutId: checkout.id,
        ...registrationData,
      });

      setRegistration({
        id: result.documentId,
        ...result.document,
      });

      setCurrentStep("overview");
    } catch (error) {
      setError("Erro ao criar inscrição");
      console.error(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Função para criar checkout com voucher
  const createVoucherCheckout = async (
    voucherCode: string,
    registrationData: RegistrationFormData
  ) => {
    if (!user || !eventId || !voucherCode.trim()) {
      throw new Error("Usuário, evento ou voucher não encontrado");
    }

    // Garantir que campos obrigatórios estejam presentes
    if (
      !registrationData.fullName ||
      !registrationData.phone ||
      !registrationData.cpf
    ) {
      throw new Error("Campos obrigatórios não preenchidos");
    }

    try {
      setLoading(true);

      const checkoutData = {
        voucher: voucherCode.trim(),
        eventId,
        userId: user.uid,
        registration: {
          fullName: registrationData.fullName,
          email: registrationData.email || "",
          phone: registrationData.phone,
          cpf: registrationData.cpf,
          isPhoneWhatsapp: registrationData.isPhoneWhatsapp || false,
          credentialName:
            registrationData.credentialName || registrationData.fullName,
          occupation: registrationData.occupation || "",
          employer: registrationData.employer || "",
          city: registrationData.city || "",
          useImage: registrationData.useImage || false,
          howDidYouHearAboutUs: registrationData.howDidYouHearAboutUs || "",
        },
      };

      const result = await createVoucherCheckoutAPI(
        voucherCode.trim(),
        checkoutData
      );

      // Atualizar os estados com os dados retornados
      setCheckout({
        id: result.checkoutId,
        ...result.checkout,
      });

      setRegistration({
        id: result.registrationId,
        ...result.registration,
      });

      // Atualizar outros estados relacionados
      setVoucher(voucherCode.trim());
      setCheckoutType("voucher");
      setFormData(registrationData);

      setCurrentStep("overview");
    } catch (error) {
      setError((error as Error).message);
      console.error(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Função para atualizar checkout
  const updateCheckoutData = async (updateData: UpdateCheckoutRequest) => {
    if (!checkout?.id) {
      throw new Error("Checkout não encontrado para atualização");
    }

    try {
      setLoading(true);
      const result = await updateCheckoutDocument(checkout.id, updateData);

      // Atualizar o checkout e todos os estados relacionados
      fillCheckoutContext(result.documentId, result.document);
    } catch (error) {
      setError("Erro ao atualizar checkout");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Função para deletar checkout
  const deleteCheckoutData = async () => {
    if (!checkout?.id) {
      throw new Error("Checkout não encontrado para exclusão");
    }

    try {
      setLoading(true);
      await deleteCheckout(checkout.id);

      resetCheckout();
      setCurrentStep("select-type");
    } catch (error) {
      setError("Erro ao deletar checkout");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Função para atualizar registration
  const updateRegistrationData = async (
    updateData: Partial<RegistrationFormData>
  ) => {
    if (!user || !eventId) {
      throw new Error("Usuário ou evento não encontrado");
    }

    if (!registration) {
      throw new Error("Nenhuma inscrição encontrada para atualizar");
    }

    try {
      setLoading(true);

      // Atualizar registration no Firestore
      const result = await updateRegistrationAPI(user.uid, eventId, updateData);

      // Buscar a registration atualizada para atualizar o estado
      setRegistration({
        id: result.documentId,
        ...result.document,
      });
      // Atualizar também o formData
      setFormData((prev) => ({ ...prev, ...updateData }));

      setCurrentStep("overview");
    } catch (error) {
      setError("Erro ao atualizar inscrição");
      console.error(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Função para atualizar checkout
  const refreshCheckout = async () => {
    await fetchUserCheckout();
  };

  // Função para atualizar registration
  const refreshRegistration = async () => {
    await fetchUserRegistration();
  };

  // Função para definir etapa atual
  const setCurrentStepHandler = (step: CheckoutStep) => {
    setCurrentStep(step);
  };

  // Função para atualizar dados do formulário de inscrição (registration)
  const updateFormDataHandler = (data: Partial<RegistrationFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  // Função para resetar checkout
  const resetCheckout = () => {
    setCheckout(null);
    setRegistration(null);
    setCurrentStep("select-type");
    setCheckoutType(null);
    setBillingDetails(null);
    setRegistrationsAmount(1);
    setRegistrateMyself(false);
    setVoucher(null);
    setVoucherData(null);
  };

  // Buscar checkout e registration quando user ou eventId mudar
  useEffect(() => {
    fetchUserCheckout();
    fetchUserRegistration();
  }, [fetchUserCheckout, fetchUserRegistration]);

  // Buscar inscrições do checkout quando o checkout mudar
  useEffect(() => {
    fetchCheckoutRegistrations();
  }, [fetchCheckoutRegistrations]);

  // Buscar dados do voucher quando o voucher mudar
  useEffect(() => {
    fetchVoucherData();
  }, [voucher, fetchVoucherData]);

  const value: CheckoutContextType = {
    user,
    eventId,
    checkout,
    registration,
    checkoutRegistrations,
    loading,
    error,
    currentStep,
    // Informações do checkout esmiuçadas
    checkoutType,
    billingDetails,
    registrationsAmount,
    registrateMyself,
    legalEntity,
    voucher,
    voucherData,
    voucherLoading,
    formData,
    // Funções de preenchimento do checkout
    setBillingDetails,
    setRegistrationsAmount,
    setRegistrateMyself,
    setLegalEntity,
    setVoucher,
    setCheckoutType,
    // Funções de checkout
    createCheckout,
    createVoucherCheckout,
    refreshCheckout,
    updateCheckout: updateCheckoutData,
    deleteCheckout: deleteCheckoutData,
    createRegistration,
    updateRegistration: updateRegistrationData,
    updateRegistrationStatus: updateRegistrationStatusAPI,
    refreshRegistration,
    refreshCheckoutRegistrations: fetchCheckoutRegistrations,
    setCurrentStep: setCurrentStepHandler,
    updateFormData: updateFormDataHandler,
    resetCheckout,
    toggleVoucherActiveStatus,
  };

  return (
    <CheckoutContext.Provider value={value}>
      {children}
    </CheckoutContext.Provider>
  );
}

export function useCheckout() {
  const context = useContext(CheckoutContext);
  if (context === undefined) {
    throw new Error("useCheckout must be used within a CheckoutProvider");
  }
  return context;
}
