"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { User } from "firebase/auth";
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

  // Funções de dados
  refreshEvents: () => Promise<void>;
  refreshEventData: () => Promise<void>;
  refreshDashboardData: () => Promise<void>;

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

export const AdminProvider: React.FC<AdminProviderProps> = ({ children }) => {
  const { firestore } = useFirebase();
  const { listCheckoutsByEvent, changeCheckoutStatus, getCheckoutById } =
    useCheckoutAPI();
  const { listRegistrationsByEvent, updateRegistrationStatus } =
    useRegistrationAPI();

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

  // Buscar eventos - versão simplificada que funciona
  const fetchEvents = useCallback(async () => {
    try {
      setLoadingEvents(true);
      setError(null);

      // Buscar eventos do Firebase de forma simples
      const { collection, getDocs } = await import("firebase/firestore");
      const eventsRef = collection(firestore, "events");
      const querySnapshot = await getDocs(eventsRef);

      const eventsData: EventData[] = querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
            registrationsCount: 0, // Valor padrão - pode ser calculado depois se necessário
          }) as EventData
      );

      setEvents(eventsData);
    } catch (err) {
      setError("Erro ao carregar eventos");
      console.error("Error fetching events:", err);
    } finally {
      setLoadingEvents(false);
    }
  }, [firestore]);

  // Buscar dados do evento selecionado
  const fetchEventData = useCallback(async () => {
    if (!selectedEvent) return;

    try {
      setLoadingCheckouts(true);
      setLoadingRegistrations(true);
      setError(null);

      // Buscar checkouts e registrations em paralelo
      const [checkouts, registrations] = await Promise.all([
        listCheckoutsByEvent(selectedEvent.id),
        listRegistrationsByEvent(selectedEvent.id),
      ]);

      setEventCheckouts(checkouts);
      setEventRegistrations(registrations);
    } catch (err) {
      setError("Erro ao carregar dados do evento");
      console.error("Error fetching event data:", err);
    } finally {
      setLoadingCheckouts(false);
      setLoadingRegistrations(false);
    }
  }, [selectedEvent, listCheckoutsByEvent, listRegistrationsByEvent]);

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
  }, []);

  const navigateToEventDetails = useCallback((event: EventData) => {
    setSelectedEvent(event);
    setCurrentView("event-details");
  }, []);

  // Funções de refresh
  const refreshEvents = useCallback(async () => {
    await fetchEvents();
  }, [fetchEvents]);

  const refreshEventData = useCallback(async () => {
    await fetchEventData();
  }, [fetchEventData]);

  const refreshDashboardData = useCallback(async () => {
    await fetchEventData();
  }, [fetchEventData]);

  // Funções de atualização
  const handleUpdateCheckoutStatus = useCallback(
    async (checkoutId: string, status: CheckoutStatus) => {
      try {
        await changeCheckoutStatus(checkoutId, status);
        await refreshEventData();
      } catch (err) {
        setError("Erro ao atualizar status do checkout");
        console.error("Error updating checkout status:", err);
      }
    },
    [changeCheckoutStatus, refreshEventData]
  );

  const handleUpdateRegistrationStatus = useCallback(
    async (registrationId: string, status: RegistrationStatus) => {
      await updateRegistrationStatus(registrationId, status);
      await refreshEventData();
    },
    [updateRegistrationStatus, refreshEventData]
  );

  // Efeitos
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    if (selectedEvent) {
      fetchEventData();
    }
  }, [selectedEvent, fetchEventData]);

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
    refreshEvents,
    refreshEventData,
    refreshDashboardData,
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
