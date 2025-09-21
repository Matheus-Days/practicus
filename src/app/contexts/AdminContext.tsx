"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { User } from "firebase/auth";
import {
  onSnapshot,
  collection,
  query,
  where,
  Unsubscribe,
} from "firebase/firestore";
import { useFirebase } from "../hooks/firebase";
import { useCheckoutAPI } from "../hooks/checkoutAPI";
import { useRegistrationAPI } from "../hooks/registrationAPI";
import { EventData } from "../types/events";
import { CheckoutData } from "../types/checkout";
import { RegistrationData } from "../hooks/registrationAPI";
import { CheckoutStatus } from "../api/checkouts/checkout.types";
import { RegistrationStatus } from "../api/registrations/registration.types";

export type AdminView = "events-list" | "event-details";

export interface EventDashboardData {
  totalSlots: number;
  pendingCheckouts: number;
  completedCheckouts: number;
  totalRegistrations: number;
  totalAmountInCheckouts: number;
  registrationPercentage: number;
  acquiredSlots: number;
}

interface AdminContextType {
  // Estado de navegação
  currentView: AdminView;
  selectedEvent: EventData | null;

  // Dados
  events: EventData[];
  eventCheckouts: CheckoutData[];
  eventRegistrations: RegistrationData[];
  eventDashboardData: EventDashboardData | null;

  // Estados de loading
  loadingEvents: boolean;
  loadingCheckouts: boolean;
  loadingRegistrations: boolean;
  loadingDashboard: boolean;

  // Estados de erro
  error: string | null;

  // Funções de navegação
  navigateToEventsList: () => void;
  navigateToEventDetails: (event: EventData) => void;

  // Funções de checkout
  updateCheckoutStatus: (
    checkoutId: string,
    status: CheckoutStatus
  ) => Promise<void>;
  getCheckoutById: (checkoutId: string) => Promise<CheckoutData>;

  // Funções de registration
  updateRegistrationStatus: (
    registrationId: string,
    status: RegistrationStatus
  ) => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const useAdminContext = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error(
      "useAdminContext deve ser usado dentro de um AdminProvider"
    );
  }
  return context;
};

interface AdminProviderProps {
  children: React.ReactNode;
  user: User;
}

export const AdminProvider: React.FC<AdminProviderProps> = ({ children, user }) => {
  const { firestore } = useFirebase();
  const { changeCheckoutStatus, getCheckoutById } = useCheckoutAPI();
  const { updateRegistrationStatus } = useRegistrationAPI();

  const listenersRef = useRef<{
    events?: Unsubscribe;
    checkouts?: Unsubscribe;
    registrations?: Unsubscribe;
  }>({});

  // Estados de navegação
  const [currentView, setCurrentView] = useState<AdminView>("events-list");
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);

  // Estados de dados
  const [events, setEvents] = useState<EventData[]>([]);
  const [eventCheckouts, setEventCheckouts] = useState<CheckoutData[]>([]);
  const [eventRegistrations, setEventRegistrations] = useState<
    RegistrationData[]
  >([]);
  const [eventDashboardData, setEventDashboardData] =
    useState<EventDashboardData | null>(null);

  // Estados de loading
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingCheckouts, setLoadingCheckouts] = useState(false);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);
  const [loadingDashboard, setLoadingDashboard] = useState(false);

  // Estado de erro
  const [error, setError] = useState<string | null>(null);

  // Função para limpar todos os listeners
  const cleanupListeners = useCallback(() => {
    Object.values(listenersRef.current).forEach(unsubscribe => {
      if (unsubscribe) unsubscribe();
    });
    listenersRef.current = {};
  }, []);

  const setupEventsListener = useCallback(() => {
    if (!user) return;

    const eventsRef = collection(firestore, "events");
    
    if (listenersRef.current.events) {
      listenersRef.current.events();
    }

    listenersRef.current.events = onSnapshot(eventsRef, (snapshot) => {
      const eventsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        registrationsCount: 0, // Valor padrão - pode ser calculado depois se necessário
      })) as EventData[];
      setEvents(eventsData);
      setLoadingEvents(false);
    }, (error) => {
      console.error("Erro no listener de eventos:", error);
      setError("Erro ao carregar eventos");
      setLoadingEvents(false);
    });
  }, [user, firestore]);

  const setupCheckoutsListener = useCallback((eventId: string) => {
    if (!eventId) return;

    const checkoutsRef = collection(firestore, "checkouts");
    const q = query(checkoutsRef, where("eventId", "==", eventId), where("checkoutType", "==", "acquire"));

    if (listenersRef.current.checkouts) {
      listenersRef.current.checkouts();
    }

    listenersRef.current.checkouts = onSnapshot(q, (snapshot) => {
      const checkoutsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CheckoutData[];
      setEventCheckouts(checkoutsData);
      setLoadingCheckouts(false);
    }, (error) => {
      console.error("Erro no listener de checkouts:", error);
      setError("Erro ao carregar checkouts");
      setLoadingCheckouts(false);
    });
  }, [firestore]);

  const setupRegistrationsListener = useCallback((eventId: string) => {
    if (!eventId) return;

    const registrationsRef = collection(firestore, "registrations");
    const q = query(registrationsRef, where("eventId", "==", eventId));

    if (listenersRef.current.registrations) {
      listenersRef.current.registrations();
    }

    listenersRef.current.registrations = onSnapshot(q, (snapshot) => {
      const registrationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as RegistrationData[];
      setEventRegistrations(registrationsData);
      setLoadingRegistrations(false);
    }, (error) => {
      console.error("Erro no listener de registrations:", error);
      setError("Erro ao carregar registrations");
      setLoadingRegistrations(false);
    });
  }, [firestore]);

  // Calcular dados do dashboard
  const calculateDashboardData = useCallback(() => {
    if (!selectedEvent) return;

    const totalSlots = selectedEvent.maxParticipants || 0;
    const pendingCheckouts = eventCheckouts.filter(
      (c) => c.status === "pending"
    ).length;
    const completedCheckouts = eventCheckouts.filter(
      (c) => c.status === "completed"
    ).length;
    const totalAmountInCheckouts = eventCheckouts
      .filter((c) => c.status === "pending" || c.status === "completed")
      .reduce((sum, checkout) => sum + (checkout.amount || 0), 0);
    const totalRegistrations = eventRegistrations.filter(
      (r) => r.status === "ok" || r.status === "pending"
    ).length;
    const registrationPercentage =
      totalSlots > 0 ? (totalRegistrations / totalSlots) * 100 : 0;

    // Calcular vagas adquiridas (soma dos amounts dos checkouts concluídos)
    const acquiredSlots = eventCheckouts
      .filter((c) => c.status === "completed" && c.amount)
      .reduce((sum, checkout) => sum + (checkout.amount || 0), 0);

    setEventDashboardData({
      totalSlots,
      pendingCheckouts,
      completedCheckouts,
      totalAmountInCheckouts,
      totalRegistrations,
      registrationPercentage,
      acquiredSlots,
    });
  }, [selectedEvent, eventCheckouts, eventRegistrations]);

  // Funções de navegação
  const navigateToEventsList = useCallback(() => {
    setCurrentView("events-list");
    setSelectedEvent(null);
    setEventCheckouts([]);
    setEventRegistrations([]);
    setEventDashboardData(null);

    if (listenersRef.current.checkouts) {
      listenersRef.current.checkouts();
      listenersRef.current.checkouts = undefined;
    }
    if (listenersRef.current.registrations) {
      listenersRef.current.registrations();
      listenersRef.current.registrations = undefined;
    }
  }, []);

  const navigateToEventDetails = useCallback((event: EventData) => {
    setSelectedEvent(event);
    setCurrentView("event-details");
    setupCheckoutsListener(event.id);
    setupRegistrationsListener(event.id);
  }, [setupCheckoutsListener, setupRegistrationsListener]);


  // Funções de atualização
  const handleUpdateCheckoutStatus = useCallback(
    async (checkoutId: string, status: CheckoutStatus) => {
      try {
        await changeCheckoutStatus(checkoutId, status);
        // Dados serão atualizados automaticamente via listener
      } catch (err) {
        setError("Erro ao atualizar status do checkout");
        console.error("Error updating checkout status:", err);
      }
    },
    [changeCheckoutStatus]
  );

  const handleUpdateRegistrationStatus = useCallback(
    async (registrationId: string, status: RegistrationStatus) => {
      try {
        await updateRegistrationStatus(registrationId, status);
        // Dados serão atualizados automaticamente via listener
      } catch (err) {
        setError("Erro ao atualizar status da inscrição");
        console.error("Error updating registration status:", err);
      }
    },
    [updateRegistrationStatus]
  );

  // Efeitos
  useEffect(() => {
    setupEventsListener();
    
    return () => {
      cleanupListeners();
    };
  }, [setupEventsListener, cleanupListeners]);

  useEffect(() => {
    if (
      selectedEvent &&
      eventCheckouts.length >= 0 &&
      eventRegistrations.length >= 0
    ) {
      calculateDashboardData();
    }
  }, [
    selectedEvent,
    eventCheckouts,
    eventRegistrations,
    calculateDashboardData,
  ]);

  const contextValue: AdminContextType = {
    currentView,
    selectedEvent,
    events,
    eventCheckouts,
    eventRegistrations,
    eventDashboardData,
    loadingEvents,
    loadingCheckouts,
    loadingRegistrations,
    loadingDashboard,
    error,
    navigateToEventsList,
    navigateToEventDetails,
    updateCheckoutStatus: handleUpdateCheckoutStatus,
    getCheckoutById,
    updateRegistrationStatus: handleUpdateRegistrationStatus,
  };

  return (
    <AdminContext.Provider value={contextValue}>
      {children}
    </AdminContext.Provider>
  );
};
