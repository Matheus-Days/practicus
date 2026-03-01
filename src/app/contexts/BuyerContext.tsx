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
import { EventData } from "../types/events";

/**
 * BuyerContext é o contexto do fluxo de COMPRA (checkout).
 * Neste primeiro passo ele mantém compatibilidade com o antigo CheckoutContext.
 * (Será evoluído quando migrarmos o modelo de registrations.)
 */
const BuyerContext = createContext<CheckoutContextType | undefined>(undefined);

interface BuyerProviderProps {
  children: ReactNode;
  user: User | null;
  eventId: string;
}

export function BuyerProvider({ children, user, eventId }: BuyerProviderProps) {
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
  const { createVoucherCheckout: createVoucherCheckoutAPI, changeVoucherActiveStatus } =
    useVoucherAPI();

  const listenersRef = useRef<{
    checkout?: Unsubscribe;
    registration?: Unsubscribe;
    checkoutRegistrations?: Unsubscribe;
    event?: Unsubscribe;
    voucher?: Unsubscribe;
  }>({});

  const [checkout, setCheckout] = useState<CheckoutData | null>(null);
  const [registration, setRegistration] = useState<RegistrationData | null>(null);
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
  const [event, setEvent] = useState<EventData | null>(null);

  const fillBuyerContext = useCallback((checkoutId: string, checkoutDoc: CheckoutDocument) => {
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

    setCurrentStep("overview");
  }, []);

  const cleanupListeners = useCallback(() => {
    Object.values(listenersRef.current).forEach((unsubscribe) => {
      if (unsubscribe) unsubscribe();
    });
    listenersRef.current = {};
  }, []);

  const setupCheckoutListener = useCallback(() => {
    if (!user || !eventId) return;

    const checkoutId = createCheckoutDocumentId(eventId, user.uid);
    const checkoutRef = doc(firestore, "checkouts", checkoutId);

    if (listenersRef.current.checkout) listenersRef.current.checkout();

    listenersRef.current.checkout = onSnapshot(
      checkoutRef,
      (docSnap) => {
        if (!docSnap.exists()) return setCheckout(null);
        const checkoutDoc = docSnap.data() as CheckoutDocument;
        fillBuyerContext(docSnap.id, checkoutDoc);
      },
      (error) => {
        console.error("Erro no listener do checkout:", error);
      }
    );
  }, [user, eventId, firestore, fillBuyerContext]);

  const setupRegistrationListener = useCallback(() => {
    if (!user || !eventId) return;

    // V2: IDs não são determinísticos; escutamos por query eventId+attendeeUserId.
    const registrationsRef = collection(firestore, "registrations");
    const q = query(
      registrationsRef,
      where("eventId", "==", eventId),
      where("attendeeUserId", "==", user.uid)
    );

    if (listenersRef.current.registration) listenersRef.current.registration();

    listenersRef.current.registration = onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          setRegistration(null);
          return;
        }

        const docSnap = snapshot.docs[0];
        const registrationData = { id: docSnap.id, ...docSnap.data() } as RegistrationData;
        setRegistration(registrationData);

        setFormData({
          fullName: registrationData.fullName,
          email: registrationData.email,
          phone: registrationData.phone,
          cpf: registrationData.cpf,
          isPhoneWhatsapp: registrationData.isPhoneWhatsapp,
          credentialName: registrationData.credentialName,
          occupation: registrationData.occupation,
          useImage: registrationData.useImage,
          howDidYouHearAboutUs: registrationData.howDidYouHearAboutUs,
          howDidYouHearAboutUsOther: registrationData.howDidYouHearAboutUsOther,
        });
      },
      (error) => {
        console.error("Erro no listener da registration:", error);
      }
    );
  }, [user, eventId, firestore]);

  const setupCheckoutRegistrationsListener = useCallback(() => {
    if (!checkout?.id) return;

    const registrationsRef = collection(firestore, "registrations");
    const q = query(registrationsRef, where("checkoutId", "==", checkout.id));

    if (listenersRef.current.checkoutRegistrations) {
      listenersRef.current.checkoutRegistrations();
    }

    listenersRef.current.checkoutRegistrations = onSnapshot(
      q,
      (snapshot) => {
        const registrations = snapshot.docs
          .filter((docSnap) => docSnap.data().status !== "invalid")
          .map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
            isMyRegistration: docSnap.data().attendeeUserId === checkout.userId,
          })) as Array<RegistrationMinimal>;
        setCheckoutRegistrations(registrations);
      },
      (error) => {
        console.error("Erro no listener das inscrições do checkout:", error);
      }
    );
  }, [checkout?.id, checkout?.userId, firestore]);

  const setupEventListener = useCallback(() => {
    if (!eventId) return;

    const eventRef = doc(firestore, "events", eventId);
    if (listenersRef.current.event) listenersRef.current.event();

    listenersRef.current.event = onSnapshot(
      eventRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const eventData = { id: docSnap.id, ...docSnap.data() } as EventData;
          setEvent(eventData);
        } else {
          setEvent(null);
        }
      },
      (error) => {
        console.error("Erro no listener do evento:", error);
        setEvent(null);
      }
    );
  }, [eventId, firestore]);

  const setupVoucherDataListener = useCallback(() => {
    if (!voucher || checkout?.status === "refunded") {
      setVoucherData(null);
      setVoucherLoading(false);
      return () => {};
    }

    const voucherRef = doc(firestore, "vouchers", voucher);
    setVoucherLoading(true);

    const unsubscribe = onSnapshot(
      voucherRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const voucherData = { id: docSnap.id, ...docSnap.data() } as VoucherData;
          setVoucherData(voucherData);
        } else {
          setVoucherData(null);
        }
        setVoucherLoading(false);
      },
      (error) => {
        console.error("Erro no listener do voucher:", error);
        setVoucherData(null);
        setVoucherLoading(false);
      }
    );

    return unsubscribe;
  }, [checkout, voucher, firestore]);

  const toggleVoucherActiveStatus = useCallback(
    async (active: boolean) => {
      if (!voucherData?.id) {
        throw new Error("Voucher não encontrado");
      }
      try {
        setVoucherLoading(true);
        await changeVoucherActiveStatus(voucherData.id, active);
      } finally {
        setVoucherLoading(false);
      }
    },
    [voucherData?.id, changeVoucherActiveStatus]
  );

  const createCheckout = async () => {
    if (!user || !eventId || !checkoutType || !billingDetails || registrationsAmount <= 0) {
      throw new Error("Informações obrigatórias para criação de checkout faltando.");
    }

    const processedBillingDetails = billingDetails
      ? legalEntity === "pf"
        ? { ...(billingDetails as BillingDetailsPF), fullName: (billingDetails as BillingDetailsPF).fullName?.toUpperCase() || "" }
        : {
            ...(billingDetails as BillingDetailsPJ),
            orgName: (billingDetails as BillingDetailsPJ).orgName?.toUpperCase() || "",
            orgDepartment: (billingDetails as BillingDetailsPJ).orgDepartment?.toUpperCase() || "",
            orgAddress: (billingDetails as BillingDetailsPJ).orgAddress?.toUpperCase() || "",
            responsibleName: (billingDetails as BillingDetailsPJ).responsibleName?.toUpperCase() || "",
          }
      : null;

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
      fillBuyerContext(res.documentId, res.document);
      setCurrentStep("overview");
    } catch (error) {
      setError("Erro ao criar checkout");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const createRegistration = async (registrationData: RegistrationFormData) => {
    if (!user || !eventId || !checkout?.id) {
      throw new Error("Usuário ou evento não encontrado");
    }
    if (!registrationData.fullName || !registrationData.phone || !registrationData.cpf) {
      throw new Error("Campos obrigatórios não preenchidos");
    }

    try {
      setLoading(true);

      const processedRegistrationData = {
        ...registrationData,
        fullName: registrationData.fullName?.toUpperCase() || "",
        credentialName: registrationData.credentialName?.toUpperCase() || "",
        occupation: registrationData.occupation?.toUpperCase() || "",
        howDidYouHearAboutUs: registrationData.howDidYouHearAboutUs?.toUpperCase() || "",
        howDidYouHearAboutUsOther: registrationData.howDidYouHearAboutUsOther?.toUpperCase() || "",
      };

      const result = await createRegistrationAPI({
        eventId,
        checkoutId: checkout.id,
        attendeeUserId: user.uid,
        ...processedRegistrationData,
      });

      setRegistration({ id: result.documentId, ...result.document });
      setCurrentStep("overview");
    } catch (error) {
      setError("Erro ao criar inscrição");
      console.error(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const createCheckoutRegistration = async (
    registrationData: RegistrationFormData
  ) => {
    if (!user || !eventId || !checkout?.id) {
      throw new Error("Usuário ou evento não encontrado");
    }
    if (!registrationData.fullName || !registrationData.phone || !registrationData.cpf) {
      throw new Error("Campos obrigatórios não preenchidos");
    }

    try {
      setLoading(true);

      const processedRegistrationData = {
        ...registrationData,
        fullName: registrationData.fullName?.toUpperCase() || "",
        credentialName: registrationData.credentialName?.toUpperCase() || "",
        occupation: registrationData.occupation?.toUpperCase() || "",
        howDidYouHearAboutUs: registrationData.howDidYouHearAboutUs?.toUpperCase() || "",
        howDidYouHearAboutUsOther: registrationData.howDidYouHearAboutUsOther?.toUpperCase() || "",
      };

      await createRegistrationAPI({
        eventId,
        checkoutId: checkout.id,
        ...processedRegistrationData,
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

  const createVoucherCheckout = async (voucherCode: string, registrationData: RegistrationFormData) => {
    // IMPORTANTE:
    // O fluxo de voucher foi movido para o fluxo de attendee (`/evento/[eventId]/inscricao`).
    // O endpoint de voucher não cria mais checkout "voucher", apenas a registration V2.
    // Então manter este método no BuyerContext geraria inconsistência (buyer-flow depende de checkout).
    throw new Error(
      "Inscrição por voucher: acesse a rota de inscrição do evento (/evento/[id]/inscricao)."
    );
  };

  const updateCheckoutData = async (updateData: UpdateCheckoutRequest) => {
    if (!checkout?.id) {
      throw new Error("Checkout não encontrado para atualização");
    }

    const processedUpdateData = { ...updateData };
    if (updateData.billingDetails) {
      if (updateData.legalEntity === "pf") {
        const pfDetails = updateData.billingDetails as BillingDetailsPF;
        processedUpdateData.billingDetails = { ...pfDetails, fullName: pfDetails.fullName?.toUpperCase() || "" };
      } else if (updateData.legalEntity === "pj") {
        const pjDetails = updateData.billingDetails as BillingDetailsPJ;
        processedUpdateData.billingDetails = {
          ...pjDetails,
          orgName: pjDetails.orgName?.toUpperCase() || "",
          orgDepartment: pjDetails.orgDepartment?.toUpperCase() || "",
          orgAddress: pjDetails.orgAddress?.toUpperCase() || "",
          responsibleName: pjDetails.responsibleName?.toUpperCase() || "",
        };
      }
    }

    try {
      setLoading(true);
      const result = await updateCheckoutDocument(checkout.id, processedUpdateData);
      fillBuyerContext(result.documentId, result.document);
    } catch (error) {
      setError("Erro ao atualizar checkout");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

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

  const updateRegistrationData = async (updateData: Partial<RegistrationFormData>) => {
    if (!user || !eventId) {
      throw new Error("Usuário ou evento não encontrado");
    }
    if (!registration) {
      throw new Error("Nenhuma inscrição encontrada para atualizar");
    }

    try {
      setLoading(true);
      const result = await updateRegistrationAPI(user.uid, eventId, updateData);
      setRegistration({ id: result.documentId, ...result.document });
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

  const setCurrentStepHandler = (step: CheckoutStep) => setCurrentStep(step);
  const updateFormDataHandler = (data: Partial<RegistrationFormData>) =>
    setFormData((prev) => ({ ...prev, ...data }));

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

  useEffect(() => {
    if (eventId) setupEventListener();
    if (user && eventId) {
      setupCheckoutListener();
      setupRegistrationListener();
    }
    return () => cleanupListeners();
  }, [user, eventId, setupEventListener, setupCheckoutListener, setupRegistrationListener, cleanupListeners]);

  useEffect(() => {
    setupCheckoutRegistrationsListener();
  }, [setupCheckoutRegistrationsListener]);

  useEffect(() => {
    const unsubscribe = setupVoucherDataListener();
    return unsubscribe;
  }, [setupVoucherDataListener]);

  const isEventClosed = event?.status === "closed";

  const value: CheckoutContextType = {
    user,
    eventId,
    event,
    isEventClosed,
    checkout,
    registration,
    checkoutRegistrations,
    loading,
    error,
    currentStep,
    checkoutType,
    billingDetails,
    registrationsAmount,
    registrateMyself,
    legalEntity,
    voucher,
    voucherData,
    voucherLoading,
    formData,
    setBillingDetails,
    setRegistrationsAmount,
    setRegistrateMyself,
    setLegalEntity,
    setVoucher,
    setCheckoutType,
    createCheckout,
    createVoucherCheckout,
    updateCheckout: updateCheckoutData,
    deleteCheckout: deleteCheckoutData,
    createRegistration,
    createCheckoutRegistration,
    updateRegistration: updateRegistrationData,
    updateRegistrationStatus: updateRegistrationStatusAPI,
    setCurrentStep: setCurrentStepHandler,
    updateFormData: updateFormDataHandler,
    resetCheckout,
    toggleVoucherActiveStatus,
  };

  return <BuyerContext.Provider value={value}>{children}</BuyerContext.Provider>;
}

export function useBuyer() {
  const context = useContext(BuyerContext);
  if (context === undefined) {
    throw new Error("useBuyer must be used within a BuyerProvider");
  }
  return context;
}

