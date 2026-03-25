"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useMemo,
  type ReactNode,
} from "react";
import { User } from "firebase/auth";
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import { useFirebase } from "../hooks/firebase";
import { EventData } from "../types/events";
import { RegistrationData } from "../hooks/registrationAPI";

export type AttendeeStep = "landing" | "voucher" | "registration-form" | "summary";

export type AttendeeContextType = {
  user: User | null;
  eventId: string;
  event: EventData | null;
  isEventClosed: boolean;
  registration: RegistrationData | null;
  loading: boolean;
  error: string | null;
  currentStep: AttendeeStep;
  setCurrentStep: (step: AttendeeStep) => void;
};

const AttendeeContext = createContext<AttendeeContextType | undefined>(undefined);

type Props = {
  children: ReactNode;
  user: User | null;
  eventId: string;
};

/**
 * AttendeeContext é o contexto do fluxo de INSCRIÇÃO (attendee).
 * Nesta fase ele somente mantém listeners de evento + inscrição do usuário autenticado.
 * (O fluxo completo será implementado no todo `attendee-flow`.)
 */
export function AttendeeProvider({ children, user, eventId }: Props) {
  const { firestore } = useFirebase();

  const listenersRef = useRef<{
    event?: Unsubscribe;
    registration?: Unsubscribe;
  }>({});

  const [event, setEvent] = useState<EventData | null>(null);
  const [registration, setRegistration] = useState<RegistrationData | null>(null);
  const [eventLoading, setEventLoading] = useState(true);
  const [registrationLoading, setRegistrationLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<AttendeeStep>("landing");
  const loading = useMemo(
    () => eventLoading || registrationLoading,
    [eventLoading, registrationLoading]
  );

  const setupEventListener = useCallback(() => {
    if (!eventId) {
      setEvent(null);
      setEventLoading(false);
      return;
    }
    const eventRef = doc(firestore, "events", eventId);
    if (listenersRef.current.event) listenersRef.current.event();
    setEventLoading(true);
    listenersRef.current.event = onSnapshot(
      eventRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setEvent({ id: docSnap.id, ...docSnap.data() } as EventData);
        } else {
          setEvent(null);
        }
        setEventLoading(false);
      },
      (err) => {
        console.error("Erro no listener do evento (attendee):", err);
        setEvent(null);
        setError("Erro ao carregar evento");
        setEventLoading(false);
      }
    );
  }, [eventId, firestore]);

  const setupRegistrationListener = useCallback(() => {
    if (!eventId) {
      setRegistration(null);
      setRegistrationLoading(false);
      return;
    }
    if (!user) {
      if (listenersRef.current.registration) listenersRef.current.registration();
      listenersRef.current.registration = undefined;
      setRegistration(null);
      setRegistrationLoading(false);
      return;
    }

    // V2: IDs não são determinísticos; escutamos por query eventId+attendeeUserId.
    const registrationsRef = collection(firestore, "registrations");
    const q = query(
      registrationsRef,
      where("eventId", "==", eventId),
      where("attendeeUserId", "==", user.uid)
    );

    if (listenersRef.current.registration) listenersRef.current.registration();
    setRegistrationLoading(true);
    listenersRef.current.registration = onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          setRegistration(null);
          setRegistrationLoading(false);
          return;
        }
        const docSnap = snapshot.docs[0];
        setRegistration({ id: docSnap.id, ...docSnap.data() } as RegistrationData);
        setRegistrationLoading(false);
      },
      (err) => {
        console.error("Erro no listener da inscrição (attendee):", err);
        setRegistration(null);
        setError("Erro ao carregar inscrição");
        setRegistrationLoading(false);
      }
    );
  }, [user, eventId, firestore]);

  useEffect(() => {
    setupEventListener();
    const listeners = listenersRef.current;
    const eventUnsubscribe = listeners.event;
    return () => {
      if (eventUnsubscribe) {
        eventUnsubscribe();
      }
      if (listeners.event === eventUnsubscribe) {
        listeners.event = undefined;
      }
    };
  }, [setupEventListener]);

  useEffect(() => {
    setupRegistrationListener();
    const listeners = listenersRef.current;
    const registrationUnsubscribe = listeners.registration;
    return () => {
      if (registrationUnsubscribe) {
        registrationUnsubscribe();
      }
      if (listeners.registration === registrationUnsubscribe) {
        listeners.registration = undefined;
      }
    };
  }, [setupRegistrationListener]);

  const isEventClosed = event?.status === "closed";

  const value: AttendeeContextType = {
    user,
    eventId,
    event,
    isEventClosed,
    registration,
    loading,
    error,
    currentStep,
    setCurrentStep,
  };

  return <AttendeeContext.Provider value={value}>{children}</AttendeeContext.Provider>;
}

export function useAttendee() {
  const ctx = useContext(AttendeeContext);
  if (!ctx) throw new Error("useAttendee must be used within an AttendeeProvider");
  return ctx;
}

