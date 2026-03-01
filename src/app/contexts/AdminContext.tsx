"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { User } from "firebase/auth";
import {
  onSnapshot,
  collection,
  query,
  where,
  doc,
  updateDoc,
  getDocs,
} from "firebase/firestore";
import {
  Snackbar,
  Alert,
  IconButton,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
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
  totalComplimentaryTickets: number;
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
  loadingComplimentaryUpdate: boolean;
  loadingTotalValueUpdate: boolean;
  loadingCheckoutStatusUpdate: boolean;
  loadingCheckoutDelete: boolean;
  loadingRegistrationStatusUpdate: boolean;

  // Estados de erro
  error: string | null;

  // Estados de notificação
  snackbarOpen: boolean;
  snackbarMessage: string;
  snackbarSeverity: 'success' | 'error' | 'warning' | 'info';

  user: User;

  // Funções de navegação
  navigateToEventsList: () => void;
  navigateToEventDetails: (event: EventData) => void;

  // Funções de checkout
  updateCheckoutStatus: (
    checkoutId: string,
    status: CheckoutStatus
  ) => Promise<void>;
  deleteCheckout: (checkoutId: string) => Promise<void>;
  getCheckoutById: (checkoutId: string) => Promise<CheckoutData>;

  // Funções de registration
  updateRegistrationStatus: (
    registrationId: string,
    status: RegistrationStatus
  ) => Promise<void>;

  // Funções de complimentary tickets
  updateComplimentaryTickets: (
    checkout: CheckoutData,
    val: number
  ) => Promise<void>;

  // Funções de total value
  updateTotalValue: (
    checkout: CheckoutData,
    val: number
  ) => Promise<void>;

  // Funções de notificação
  showNotification: (message: string, severity: 'success' | 'error' | 'warning' | 'info') => void;
  hideNotification: () => void;
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

export const AdminProvider: React.FC<AdminProviderProps> = ({
  children,
  user,
}) => {
  const { firestore } = useFirebase();
  const { changeCheckoutStatus, deleteCheckout, getCheckoutById } = useCheckoutAPI();
  const { updateRegistrationStatus } = useRegistrationAPI();

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
  const [loadingDashboard] = useState(false);
  const [loadingComplimentaryUpdate, setLoadingComplimentaryUpdate] =
    useState(false);
  const [loadingTotalValueUpdate, setLoadingTotalValueUpdate] =
    useState(false);
  const [loadingCheckoutStatusUpdate, setLoadingCheckoutStatusUpdate] =
    useState(false);
  const [loadingCheckoutDelete, setLoadingCheckoutDelete] = useState(false);
  const [loadingRegistrationStatusUpdate, setLoadingRegistrationStatusUpdate] =
    useState(false);

  // Estado de erro
  const [error, setError] = useState<string | null>(null);

  // Estados de notificação
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'warning' | 'info'>('info');


  // Calcular dados do dashboard
  const calculateDashboardData = useCallback(() => {
    if (!selectedEvent) return;

    const totalSlots = selectedEvent.maxParticipants || 0;
    const pendingCheckouts = eventCheckouts.filter(
      (c) => c.status === "pending"
    ).length;
    const completedCheckouts = eventCheckouts.filter(
      (c) => c.status === "paid" || c.status === "approved"
    ).length;
    const totalAmountInCheckouts = eventCheckouts
      .filter(
        (c) =>
          c.status === "pending" || c.status === "paid" || c.status === "approved"
      )
      .reduce((sum, checkout) => sum + (checkout.amount || 0), 0);
    const totalComplimentaryTickets = eventCheckouts
      .filter(
        (c) =>
          (c.status === "paid" || c.status === "approved") && c.complimentary
      )
      .reduce((sum, checkout) => sum + (checkout.complimentary || 0), 0);
    const totalRegistrations = eventRegistrations.filter(
      (r) => r.status === "ok" || r.status === "pending"
    ).length;
    const registrationPercentage =
      totalSlots > 0 ? (totalRegistrations / totalSlots) * 100 : 0;

    // Calcular vagas adquiridas (soma dos amounts dos checkouts concluídos)
    const acquiredSlots = eventCheckouts
      .filter(
        (c) =>
          (c.status === "paid" || c.status === "approved") && c.amount
      )
      .reduce((sum, checkout) => sum + (checkout.amount || 0), 0);

    setEventDashboardData({
      totalSlots,
      pendingCheckouts,
      completedCheckouts,
      totalAmountInCheckouts,
      totalComplimentaryTickets,
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

  // Funções de notificação
  const showNotification = useCallback((message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  }, []);

  const hideNotification = useCallback(() => {
    setSnackbarOpen(false);
  }, []);

  // Funções de atualização
  const handleUpdateCheckoutStatus = useCallback(
    async (checkoutId: string, status: CheckoutStatus) => {
      try {
        setLoadingCheckoutStatusUpdate(true);
        await changeCheckoutStatus(checkoutId, status);
        showNotification("Status do checkout atualizado com sucesso!", "success");
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Erro ao atualizar status do checkout";
        showNotification(errorMessage, "error");
        console.error("Error updating checkout status:", err);
      } finally {
        setLoadingCheckoutStatusUpdate(false);
      }
    },
    [changeCheckoutStatus, showNotification]
  );

  const handleDeleteCheckout = useCallback(
    async (checkoutId: string) => {
      try {
        setLoadingCheckoutDelete(true);
        await deleteCheckout(checkoutId);
        showNotification("Compra cancelada com sucesso.", "success");
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Erro ao cancelar compra";
        showNotification(errorMessage, "error");
        console.error("Error deleting checkout:", err);
      } finally {
        setLoadingCheckoutDelete(false);
      }
    },
    [deleteCheckout, showNotification]
  );

  const handleUpdateRegistrationStatus = useCallback(
    async (registrationId: string, status: RegistrationStatus) => {
      try {
        setLoadingRegistrationStatusUpdate(true);
        await updateRegistrationStatus(registrationId, status);
        showNotification("Situação da inscrição atualizada com sucesso!", "success");
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Erro ao atualizar situação da inscrição";
        showNotification(errorMessage, "error");
        console.error("Error updating registration status:", err);
      } finally {
        setLoadingRegistrationStatusUpdate(false);
      }
    },
    [updateRegistrationStatus, showNotification]
  );

  const handleUpdateComplimentaryTickets = useCallback(
    async (checkout: CheckoutData, newVal: number) => {
      try {
        setLoadingComplimentaryUpdate(true);

        if (newVal < (checkout.complimentary || 0)) {
          const registrations = query(
            collection(firestore, "registrations"),
            where("checkoutId", "==", checkout.id),
            where("status", "in", ["ok", "pending"])
          );
          const registrationsSnapshot = await getDocs(registrations);
          if (registrationsSnapshot.size >= newVal) {
            throw new Error(
              "Quantidade de cortesias não pode ser menor que o número de inscrições já preenchidas."
            );
          }
        }

        const checkoutRef = doc(firestore, "checkouts", checkout.id);
        await updateDoc(checkoutRef, {
          complimentary: newVal,
          updatedAt: new Date(),
        });

        showNotification("Cortesias atualizadas com sucesso!", "success");
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Erro ao atualizar cortesias";
        showNotification(errorMessage, "error");
        console.error("Error updating complimentary tickets:", err);
        throw err;
      } finally {
        setLoadingComplimentaryUpdate(false);
      }
    },
    [firestore, showNotification]
  );

  const handleUpdateTotalValue = useCallback(
    async (checkout: CheckoutData, newVal: number) => {
      try {
        setLoadingTotalValueUpdate(true);

        const checkoutRef = doc(firestore, "checkouts", checkout.id);
        await updateDoc(checkoutRef, {
          totalValue: newVal,
          updatedAt: new Date(),
        });

        showNotification("Valor final faturado atualizado com sucesso!", "success");
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Erro ao atualizar valor final faturado";
        showNotification(errorMessage, "error");
        console.error("Error updating total value:", err);
        throw err;
      } finally {
        setLoadingTotalValueUpdate(false);
      }
    },
    [firestore, showNotification]
  );

  // Efeitos
  useEffect(() => {
    if (!user?.uid) {
      setEvents([]);
      setLoadingEvents(false);
      return;
    }
    setLoadingEvents(true);
    const eventsRef = collection(firestore, "events");
    const unsubscribe = onSnapshot(
      eventsRef,
      (snapshot) => {
        const eventsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          registrationsCount: 0,
        })) as EventData[];
        setEvents(eventsData);
        setLoadingEvents(false);
      },
      (listenerError) => {
        console.error("Erro no listener de eventos:", listenerError);
        setError("Erro ao carregar eventos");
        setLoadingEvents(false);
      }
    );
    return () => {
      unsubscribe();
    };
  }, [user?.uid, firestore]);

  useEffect(() => {
    const selectedEventId = selectedEvent?.id;
    if (!selectedEventId) {
      setEventCheckouts([]);
      setEventRegistrations([]);
      setLoadingCheckouts(false);
      setLoadingRegistrations(false);
      return;
    }

    setLoadingCheckouts(true);
    setLoadingRegistrations(true);

    const checkoutsRef = collection(firestore, "checkouts");
    const checkoutsQuery = query(
      checkoutsRef,
      where("eventId", "==", selectedEventId),
      where("checkoutType", "in", ["acquire", "admin"])
    );

    const registrationsRef = collection(firestore, "registrations");
    const registrationsQuery = query(
      registrationsRef,
      where("eventId", "==", selectedEventId)
    );

    const unsubscribeCheckouts = onSnapshot(
      checkoutsQuery,
      (snapshot) => {
        const checkoutsData = snapshot.docs.map((checkoutDoc) => ({
          id: checkoutDoc.id,
          ...checkoutDoc.data(),
        })) as CheckoutData[];
        setEventCheckouts(checkoutsData);
        setLoadingCheckouts(false);
      },
      (listenerError) => {
        console.error("Erro no listener de checkouts:", listenerError);
        setError("Erro ao carregar checkouts");
        setLoadingCheckouts(false);
      }
    );

    const unsubscribeRegistrations = onSnapshot(
      registrationsQuery,
      (snapshot) => {
        const registrationsData = snapshot.docs.map((registrationDoc) => ({
          id: registrationDoc.id,
          ...registrationDoc.data(),
        })) as RegistrationData[];
        setEventRegistrations(registrationsData);
        setLoadingRegistrations(false);
      },
      (listenerError) => {
        console.error("Erro no listener de registrations:", listenerError);
        setError("Erro ao carregar registrations");
        setLoadingRegistrations(false);
      }
    );

    return () => {
      unsubscribeCheckouts();
      unsubscribeRegistrations();
    };
  }, [selectedEvent?.id, firestore]);

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
    loadingComplimentaryUpdate,
    loadingTotalValueUpdate,
    loadingCheckoutStatusUpdate,
    loadingCheckoutDelete,
    loadingRegistrationStatusUpdate,
    error,
    snackbarOpen,
    snackbarMessage,
    snackbarSeverity,
    user,
    navigateToEventsList,
    navigateToEventDetails,
    updateCheckoutStatus: handleUpdateCheckoutStatus,
    deleteCheckout: handleDeleteCheckout,
    getCheckoutById,
    updateRegistrationStatus: handleUpdateRegistrationStatus,
    updateComplimentaryTickets: handleUpdateComplimentaryTickets,
    updateTotalValue: handleUpdateTotalValue,
    showNotification,
    hideNotification,
  };

  return (
    <AdminContext.Provider value={contextValue}>
      {children}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={hideNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={hideNotification}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={hideNotification}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </AdminContext.Provider>
  );
};
