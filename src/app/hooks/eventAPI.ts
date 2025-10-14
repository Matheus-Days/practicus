import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
  getCountFromServer,
  writeBatch,
} from "firebase/firestore";
import { useFirebase } from "./firebase";
import { EventData, EventDocument, EventStatus } from "../types/events";
import { createCheckoutDocumentId } from "../api/checkouts/utils";
import { CheckoutDocument } from "../api/checkouts/checkout.types";

export const useEventAPI = () => {
  const { firestore, auth } = useFirebase();

  const getEvent = async (eventId: string): Promise<EventData> => {
    const eventRef = doc(firestore, "events", eventId);
    const eventDoc = await getDoc(eventRef);

    if (!eventDoc.exists()) {
      throw new Error("Evento não encontrado.");
    }

    const registrationsQuery = query(
      collection(firestore, "registrations"),
      where("eventId", "==", eventId),
      where("status", "==", "ok")
    );
    const countSnapshot = await getCountFromServer(registrationsQuery);

    return {
      id: eventDoc.id,
      ...(eventDoc.data() as EventDocument),
      registrationsCount: countSnapshot.data().count,
    };
  };

  const getEvents = async (
    status: EventStatus | undefined = "open"
  ): Promise<EventData[]> => {
    let eventsQuery;

    if (status) {
      eventsQuery = query(
        collection(firestore, "events"),
        where("status", "==", status)
      );
    } else {
      eventsQuery = collection(firestore, "events");
    }

    const eventsDoc = await getDocs(eventsQuery);
    const events = eventsDoc.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as EventDocument),
    }));

    const eventsWithRegistrationCount = await Promise.all(
      events.map(async (event) => {
        const registrationsQuery = query(
          collection(firestore, "registrations"),
          where("eventId", "==", event.id),
          where("status", "==", "ok")
        );

        const countSnapshot = await getCountFromServer(registrationsQuery);

        return {
          ...event,
          registrationsCount: countSnapshot.data().count,
        };
      })
    );

    return eventsWithRegistrationCount;
  };

  const updateEvent = async (
    eventId: string,
    event: Partial<EventDocument>
  ) => {
    const eventRef = doc(firestore, "events", eventId);
    const eventDoc = await getDoc(eventRef);

    if (!eventDoc.exists()) {
      throw new Error("Evento não encontrado.");
    }

    try {
      await updateDoc(eventRef, filterEmpty(event));
    } catch (error) {
      throw new Error("Erro ao atualizar informações do evento.");
    }
  };

  const createEvent = async (eventId: string, event: EventDocument) => {
    const batch = writeBatch(firestore);
    const eventRef = doc(firestore, "events", eventId);

    batch.set(eventRef, {
      ...event,
      createdAt: new Date(),
    });

    if (!auth?.currentUser) {
      throw new Error("Usuário não autenticado.");
    }

    const adminCheckoutRef = doc(
      firestore,
      "checkouts",
      createCheckoutDocumentId(eventId, auth.currentUser.uid)
    );

    batch.set(adminCheckoutRef, {
      checkoutType: "admin",
      eventId,
      userId: auth.currentUser.uid,
      status: "completed",
    } as CheckoutDocument);

    try {
      await batch.commit();
    } catch (error) {
      throw new Error("Erro ao criar evento.");
    }
  };

  return {
    getEvent,
    getEvents,
    updateEvent,
    createEvent,
  };
};

export function filterEmpty<T extends object>(obj: T): Partial<T> {
  const filtered: Partial<T> = {};
  Object.entries(obj).forEach(([key, value]) => {
    if (value !== undefined) {
      // @ts-ignore
      filtered[key] = value;
    }
  });
  return filtered;
}
