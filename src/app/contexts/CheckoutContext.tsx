"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useRef,
} from "react";
import { User } from "firebase/auth";
import {
  doc,
  onSnapshot,
  collection,
  query,
  where,
  Unsubscribe,
} from "firebase/firestore";
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
import { useFirebase } from "../hooks/firebase";
import { createCheckoutDocumentId } from "../api/checkouts/utils";
import { generateRegistrationDocumentId } from "../api/registrations/utils";

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
  const { firestore } = useFirebase();
  const {
    createCheckout: createCheckoutDocument,
    updateCheckout: updateCheckoutDocument,
    deleteCheckout,
  } = useCheckoutAPI();
  const {
    createRegistration: createRegistrationAPI,
    updateRegistration: updateRegistrationAPI,
    updateRegistrationStatus: updateRegistrationStatusAPI,
  } = useRegistrationAPI();
  const {
    createVoucherCheckout: createVoucherCheckoutAPI,
    changeVoucherActiveStatus,
  } = useVoucherAPI();

  // Refs para armazenar os listeners
  const listenersRef = useRef<{
    checkout?: Unsubscribe;
    registration?: Unsubscribe;
    checkoutRegistrations?: Unsubscribe;
  }>({});

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

  const fillCheckoutContext = useCallback((
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
  }, []);

  // Função para limpar todos os listeners
  const cleanupListeners = useCallback(() => {
    Object.values(listenersRef.current).forEach(unsubscribe => {
      if (unsubscribe) unsubscribe();
    });
    listenersRef.current = {};
  }, []);

  // Função para configurar listener do checkout do usuário
  const setupCheckoutListener = useCallback(() => {
    if (!user || !eventId) return;

    const checkoutId = createCheckoutDocumentId(eventId, user.uid);
    const checkoutRef = doc(firestore, "checkouts", checkoutId);

    // Limpar listener anterior se existir
    if (listenersRef.current.checkout) {
      listenersRef.current.checkout();
    }

    listenersRef.current.checkout = onSnapshot(checkoutRef, (doc) => {
      if (!doc.exists()) return setCheckout(null);
      const checkoutDoc = doc.data() as CheckoutDocument;
      if (checkoutDoc.status === "deleted") return setCheckout(null);
      fillCheckoutContext(doc.id, checkoutDoc);
    }, (error) => {
      console.error("Erro no listener do checkout:", error);
    });
  }, [user, eventId, firestore, fillCheckoutContext]);

  // Função para configurar listener da registration do usuário
  const setupRegistrationListener = useCallback(() => {
    if (!user || !eventId) return;

    const registrationId = generateRegistrationDocumentId(eventId, user.uid);
    const registrationRef = doc(firestore, "registrations", registrationId);

    // Limpar listener anterior se existir
    if (listenersRef.current.registration) {
      listenersRef.current.registration();
    }

    listenersRef.current.registration = onSnapshot(registrationRef, (doc) => {
      if (doc.exists()) {
        const registrationData = { id: doc.id, ...doc.data() } as RegistrationData;
        setRegistration(registrationData);
        
        // Preencher formData com os dados da registration existente
        setFormData({
          fullName: registrationData.fullName,
          email: registrationData.email,
          phone: registrationData.phone,
          cpf: registrationData.cpf,
          isPhoneWhatsapp: registrationData.isPhoneWhatsapp,
          credentialName: registrationData.credentialName,
          occupation: registrationData.occupation,
          employer: registrationData.employer,
          city: registrationData.city,
          useImage: registrationData.useImage,
          howDidYouHearAboutUs: registrationData.howDidYouHearAboutUs,
        });
      } else {
        setRegistration(null);
      }
    }, (error) => {
      console.error("Erro no listener da registration:", error);
    });
  }, [user, eventId, firestore]);

  // Função para configurar listener das inscrições do checkout
  const setupCheckoutRegistrationsListener = useCallback(() => {
    if (!checkout?.id) return;

    const registrationsRef = collection(firestore, "registrations");
    const q = query(
      registrationsRef,
      where("checkoutId", "==", checkout.id)
    );

    // Limpar listener anterior se existir
    if (listenersRef.current.checkoutRegistrations) {
      listenersRef.current.checkoutRegistrations();
    }

    listenersRef.current.checkoutRegistrations = onSnapshot(q, (snapshot) => {
      const registrations = snapshot.docs.filter(doc => doc.data().status !== "invalid").map(doc => ({
        id: doc.id,
        ...doc.data(),
        isMyRegistration: doc.id === checkout.id
      })) as Array<RegistrationMinimal>;
      setCheckoutRegistrations(registrations);
    }, (error) => {
      console.error("Erro no listener das inscrições do checkout:", error);
    });
  }, [checkout?.id, firestore]);


  // Função para configurar listener dos dados do voucher
  const setupVoucherDataListener = useCallback(() => {
    if (
      !voucher ||
      checkout?.checkoutType === "voucher" ||
      checkout?.status === "deleted"
    ) {
      setVoucherData(null);
      return;
    }

    const voucherRef = doc(firestore, "vouchers", voucher);
    
    setVoucherLoading(true);
    
    const unsubscribe = onSnapshot(voucherRef, (doc) => {
      if (doc.exists()) {
        const voucherData = { id: doc.id, ...doc.data() } as VoucherData;
        setVoucherData(voucherData);
      } else {
        setVoucherData(null);
      }
      setVoucherLoading(false);
    }, (error) => {
      console.error("Erro no listener do voucher:", error);
      setVoucherData(null);
      setVoucherLoading(false);
    });

    return unsubscribe;
  }, [checkout, voucher, firestore]);

  // Função para alterar o status ativo do voucher
  const toggleVoucherActiveStatus = useCallback(
    async (active: boolean) => {
      if (!voucherData?.id) {
        throw new Error("Voucher não encontrado");
      }

      try {
        setVoucherLoading(true);
        await changeVoucherActiveStatus(voucherData.id, active);
      } catch (error) {
        console.error("Erro ao alterar status do voucher:", error);
        throw error;
      } finally {
        setVoucherLoading(false);
      }
    },
    [voucherData?.id, changeVoucherActiveStatus]
  );

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

    const processedBillingDetails = billingDetails ? (
      legalEntity === "pf" 
        ? {
            ...billingDetails as BillingDetailsPF,
            fullName: (billingDetails as BillingDetailsPF).fullName?.toUpperCase() || "",
          }
        : {
            ...billingDetails as BillingDetailsPJ,
            orgName: (billingDetails as BillingDetailsPJ).orgName?.toUpperCase() || "",
            orgAddress: (billingDetails as BillingDetailsPJ).orgAddress?.toUpperCase() || "",
            responsibleName: (billingDetails as BillingDetailsPJ).responsibleName?.toUpperCase() || "",
          }
    ) : null;

    const checkoutData: CreateCheckoutRequest = {
      checkoutType,
      eventId,
      userId: user.uid,
      amount: registrationsAmount,
    };

    if (legalEntity) checkoutData.legalEntity = legalEntity;
    if (processedBillingDetails) checkoutData.billingDetails = processedBillingDetails;
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

      const processedRegistrationData = {
        ...registrationData,
        fullName: registrationData.fullName?.toUpperCase() || "",
        credentialName: registrationData.credentialName?.toUpperCase() || "",
        occupation: registrationData.occupation?.toUpperCase() || "",
        employer: registrationData.employer?.toUpperCase() || "",
        city: registrationData.city?.toUpperCase() || "",
        howDidYouHearAboutUs: registrationData.howDidYouHearAboutUs?.toUpperCase() || "",
      };

      const result = await createRegistrationAPI({
        eventId,
        userId: user.uid,
        checkoutId: checkout.id,
        ...processedRegistrationData,
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
          fullName: registrationData.fullName?.toUpperCase() || "",
          email: registrationData.email || "",
          phone: registrationData.phone,
          cpf: registrationData.cpf,
          isPhoneWhatsapp: registrationData.isPhoneWhatsapp || false,
          credentialName:
            (registrationData.credentialName || registrationData.fullName)?.toUpperCase() || "",
          occupation: registrationData.occupation?.toUpperCase() || "",
          employer: registrationData.employer?.toUpperCase() || "",
          city: registrationData.city?.toUpperCase() || "",
          useImage: registrationData.useImage || false,
          howDidYouHearAboutUs: registrationData.howDidYouHearAboutUs?.toUpperCase() || "",
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

    const processedUpdateData = { ...updateData };
    if (updateData.billingDetails) {
      if (updateData.legalEntity === "pf") {
        const pfDetails = updateData.billingDetails as BillingDetailsPF;
        processedUpdateData.billingDetails = {
          ...pfDetails,
          fullName: pfDetails.fullName?.toUpperCase() || "",
        };
      } else if (updateData.legalEntity === "pj") {
        const pjDetails = updateData.billingDetails as BillingDetailsPJ;
        processedUpdateData.billingDetails = {
          ...pjDetails,
          orgName: pjDetails.orgName?.toUpperCase() || "",
          orgAddress: pjDetails.orgAddress?.toUpperCase() || "",
          responsibleName: pjDetails.responsibleName?.toUpperCase() || "",
        };
      }
    }

    try {
      setLoading(true);
      const result = await updateCheckoutDocument(checkout.id, processedUpdateData);

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

  // Configurar listeners quando user ou eventId mudar
  useEffect(() => {
    if (user && eventId) {
      setupCheckoutListener();
      setupRegistrationListener();
    }
    
    return () => {
      cleanupListeners();
    };
  }, [user, eventId, setupCheckoutListener, setupRegistrationListener, cleanupListeners]);

  // Configurar listener das inscrições do checkout quando o checkout mudar
  useEffect(() => {
    setupCheckoutRegistrationsListener();
  }, [setupCheckoutRegistrationsListener]);


  // Configurar listener dos dados do voucher quando o voucher mudar
  useEffect(() => {
    const unsubscribe = setupVoucherDataListener();
    return unsubscribe;
  }, [setupVoucherDataListener]);

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
    updateCheckout: updateCheckoutData,
    deleteCheckout: deleteCheckoutData,
    createRegistration,
    updateRegistration: updateRegistrationData,
    updateRegistrationStatus: updateRegistrationStatusAPI,
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
