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
  Registration,
  RegistrationData,
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
import { RegistrationMinimal, useRegistrationAPI } from "../hooks/registrationAPI";

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
  const { createCheckout: createCheckoutDocument, updateCheckout: updateCheckoutDocument, deleteCheckout, getCheckout } = useCheckoutAPI();
  const { createRegistration: createRegistrationAPI, getRegistration: getRegistrationAPI, updateRegistration: updateRegistrationAPI, deleteRegistration: deleteRegistrationAPI, getCheckoutRegistrations, updateRegistrationStatus: updateRegistrationStatusAPI } = useRegistrationAPI();

  const [checkout, setCheckout] = useState<CheckoutData | null>(null);
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [checkoutRegistrations, setCheckoutRegistrations] = useState<Array<RegistrationMinimal>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<CheckoutStep>("select-type");

  const [checkoutType, setCheckoutType] = useState<CheckoutType | null>(
    null
  );
  const [voucher, setVoucher] = useState<string | null>(null);
  const [billingDetails, setBillingDetails] = useState<
    BillingDetailsPF | BillingDetailsPJ | null
  >(null);
  const [registrationsAmount, setRegistrationsAmount] = useState<number>(1);
  const [registrateMyself, setRegistrateMyself] = useState<boolean>(false);
  const [legalEntity, setLegalEntity] = useState<LegalEntity | null>(
    null
  );
  const [formData, setFormData] = useState<Partial<RegistrationData>>({});

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

  const fillCheckoutContext = (checkoutId: string, checkoutDoc: CheckoutDocument) => {
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
  };

  // Função para buscar registration do usuário
  const fetchUserRegistration = useCallback(async () => {
    if (!user || !eventId) return;
    
    try {
      const registration = await getRegistrationAPI(user.uid, eventId);
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
    console.log("createCheckout", user, eventId, checkoutType, billingDetails, registrationsAmount, legalEntity, voucher, registrateMyself);
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
    if (voucher) checkoutData.voucher = voucher;
    if (registrateMyself) checkoutData.registrateMyself = registrateMyself;

    try {
      setLoading(true);
      const res = await createCheckoutDocument(checkoutData);
      
      setCheckout({
        id: res.documentId,
        ...res.document,
      });
      setCurrentStep("overview");
    } catch (error) {
      setError("Erro ao criar checkout");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Função para criar nova registration
  const createRegistration = async (
    registrationData: Partial<RegistrationData>,
  ) => {
    if (!user || !eventId || !checkout?.id) {
      throw new Error("Usuário ou evento não encontrado");
    }

    // Garantir que campos obrigatórios estejam presentes
    if (!registrationData.fullName || !registrationData.phone || !registrationData.cpf) {
      throw new Error("Campos obrigatórios não preenchidos");
    }

    try {
      setLoading(true);
      
      // Verificar se já existe uma registration para este usuário/evento
      const existingRegistration = await getRegistrationAPI(user.uid, eventId);
      if (existingRegistration) {
        throw new Error("Já existe uma inscrição para este usuário neste evento");
      }

      // Criar registration no Firestore
      const registrationId = await createRegistrationAPI(
        eventId,
        user.uid,
        registrationData as RegistrationData,
        checkout.id, // Passar checkoutId se disponível
      );

      // Buscar a registration criada para atualizar o estado
      const newRegistration = await getRegistrationAPI(user.uid, eventId);
      if (newRegistration) {
        setRegistration(newRegistration);
      }
      
      setCurrentStep("overview");
    } catch (error) {
      setError("Erro ao criar inscrição");
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
      const res = await updateCheckoutDocument(checkout.id, updateData);
      
      setCheckout({
        id: res.documentId,
        ...res.document,
      });
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
      
      setCheckout(null);
      setCurrentStep("select-type");
    } catch (error) {
      setError("Erro ao deletar checkout");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Função para atualizar registration
  const updateRegistrationData = async (updateData: Partial<RegistrationData>) => {
    if (!user || !eventId) {
      throw new Error("Usuário ou evento não encontrado");
    }

    if (!registration) {
      throw new Error("Nenhuma inscrição encontrada para atualizar");
    }

    try {
      setLoading(true);
      
      // Atualizar registration no Firestore
      await updateRegistrationAPI(user.uid, eventId, updateData);

      // Buscar a registration atualizada para atualizar o estado
      const updatedRegistration = await getRegistrationAPI(user.uid, eventId);
      if (updatedRegistration) {
        setRegistration(updatedRegistration);
        // Atualizar também o formData
        setFormData(prev => ({ ...prev, ...updateData }));
      }
      
      setCurrentStep("overview");
    } catch (error) {
      setError("Erro ao atualizar inscrição");
      console.error(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Função para deletar registration
  const deleteRegistrationData = async () => {
    if (!user || !eventId) {
      throw new Error("Usuário ou evento não encontrado");
    }

    if (!registration) {
      throw new Error("Nenhuma inscrição encontrada para deletar");
    }

    try {
      setLoading(true);
      
      // Deletar registration no Firestore
      await deleteRegistrationAPI(user.uid, eventId);

      // Limpar estados
      setRegistration(null);
      setFormData({});
      
      setCurrentStep("overview");
    } catch (error) {
      setError("Erro ao deletar inscrição");
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

  // Função para definir tipo de checkout
  const setCheckoutTypeHandler = (type: CheckoutType) => {
    // implement
  };

  // Função para definir etapa atual
  const setCurrentStepHandler = (step: CheckoutStep) => {
    setCurrentStep(step);
  };

  // Função para atualizar dados do formulário de inscrição (registration)
  const updateFormDataHandler = (data: Partial<RegistrationData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  // Função para ir para próxima etapa
  const goToNextStep = () => {
    // implement
  };

  // Função para ir para etapa anterior
  const goToPreviousStep = () => {
    // implement
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

  const value: CheckoutContextType = {
    user,
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
    refreshCheckout,
    updateCheckout: updateCheckoutData,
    deleteCheckout: deleteCheckoutData,
    createRegistration,
    updateRegistration: updateRegistrationData,
    deleteRegistration: deleteRegistrationData,
    updateRegistrationStatus: updateRegistrationStatusAPI,
    refreshRegistration,
    refreshCheckoutRegistrations: fetchCheckoutRegistrations,
    setCurrentStep: setCurrentStepHandler,
    updateFormData: updateFormDataHandler,
    goToNextStep,
    goToPreviousStep,
    resetCheckout,
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
