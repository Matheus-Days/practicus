import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, collection, addDoc, query, where, getDocs, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { useMemo, useCallback } from 'react';
import { EventData } from '../types/events';
import { RegistrationData } from '../types/checkout';

type FirebaseConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

const credentialsJson = process.env.NEXT_PUBLIC_FB_SDK_CREDENTIALS;

if (!credentialsJson) {
  throw new Error('NEXT_PUBLIC_FB_SDK_CREDENTIALS not found in environment variables');
}

const firebaseConfig: FirebaseConfig = JSON.parse(credentialsJson);

// Initialize Firebase only once
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Interface for user data
export interface UserData {
  uid: string;
  admin?: boolean;
  email?: string;
  displayName?: string;
  [key: string]: any;
}

// Função utilitária para gerar ID único do checkout
const generateCheckoutId = (userId: string, eventId: string): string => {
  return `${userId}_${eventId}`;
};

// Função utilitária para gerar ID único da registration
const generateRegistrationId = (userId: string, eventId: string): string => {
  return `${userId}_${eventId}`;
};

export const useFirebase = () => {
  const auth = useMemo(() => getAuth(app), []);
  const firestore = useMemo(() => getFirestore(app), []);

  const getUserData = useCallback(async (uid: string): Promise<UserData | null> => {
    try {
      const userDocRef = doc(firestore, 'users', uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        return {
          uid,
          ...userDoc.data()
        } as UserData;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting user data:', error);
      throw error;
    }
  }, [firestore]);

  const getEventData = useCallback(async (eventId: string): Promise<EventData | null> => {
    try {
      const eventDocRef = doc(firestore, 'events', eventId);
      const eventDoc = await getDoc(eventDocRef);
      
      if (eventDoc.exists()) {
        return {
          id: eventDoc.id,
          ...eventDoc.data()
        } as EventData;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting event data:', error);
      throw error;
    }
  }, [firestore]);

  // Função para buscar checkout do usuário
  const findUserCheckout = useCallback(async (userId: string, eventId: string): Promise<{id: string, data: any} | null> => {
    try {
      const checkoutId = generateCheckoutId(userId, eventId);
      const checkoutRef = doc(firestore, 'checkouts', checkoutId);
      const checkoutDoc = await getDoc(checkoutRef);
      
      if (checkoutDoc.exists()) {
        return {
          id: checkoutDoc.id,
          data: checkoutDoc.data()
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error finding checkout:', error);
      throw error;
    }
  }, [firestore]);

  // Função para criar novo checkout
  const createCheckout = useCallback(async (eventId: string, userId: string): Promise<string> => {
    try {
      const checkoutId = generateCheckoutId(userId, eventId);
      const checkoutRef = doc(firestore, 'checkouts', checkoutId);
      
      const newCheckout = {
        eventId,
        userId,
        createdAt: new Date(),
        status: 'pending' as const
      };

      await setDoc(checkoutRef, newCheckout);
      return checkoutId;
    } catch (error) {
      console.error('Error creating checkout:', error);
      throw error;
    }
  }, [firestore]);

  // Função para atualizar checkout
  const updateCheckout = useCallback(async (checkoutId: string, updateData: Partial<any>): Promise<void> => {
    try {
      const checkoutRef = doc(firestore, 'checkouts', checkoutId);
      
      await updateDoc(checkoutRef, {
        ...updateData,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating checkout:', error);
      throw error;
    }
  }, [firestore]);

  // Função para buscar registration do usuário
  const findUserRegistration = useCallback(async (userId: string, eventId: string): Promise<{id: string, data: any} | null> => {
    try {
      const registrationId = generateRegistrationId(userId, eventId);
      const registrationRef = doc(firestore, 'registrations', registrationId);
      const registrationDoc = await getDoc(registrationRef);
      
      if (registrationDoc.exists()) {
        return {
          id: registrationDoc.id,
          data: registrationDoc.data()
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error finding registration:', error);
      throw error;
    }
  }, [firestore]);

  // Função para criar nova registration
  const createRegistration = useCallback(async (eventId: string, userId: string, registrationData: RegistrationData, voucherId?: string): Promise<string> => {
    try {
      const registrationId = generateRegistrationId(userId, eventId);
      const registrationRef = doc(firestore, 'registrations', registrationId);
      
      const newRegistration = {
        eventId,
        userId,
        createdAt: new Date(),
        status: 'pending' as const,
        voucherId,
        ...registrationData
      };

      await setDoc(registrationRef, newRegistration);
      return registrationId;
    } catch (error) {
      console.error('Error creating registration:', error);
      throw error;
    }
  }, [firestore]);

  // Função para atualizar registration
  const updateRegistration = useCallback(async (registrationId: string, updateData: Partial<any>): Promise<void> => {
    try {
      const registrationRef = doc(firestore, 'registrations', registrationId);
      
      await updateDoc(registrationRef, {
        ...updateData,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating registration:', error);
      throw error;
    }
  }, [firestore]);

  // Função para buscar registration por voucher
  const findRegistrationByVoucher = useCallback(async (voucherId: string, eventId: string): Promise<{id: string, data: any} | null> => {
    try {
      const registrationsRef = collection(firestore, 'registrations');
      const q = query(
        registrationsRef,
        where('voucherId', '==', voucherId),
        where('eventId', '==', eventId)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return {
          id: doc.id,
          data: doc.data()
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error finding registration by voucher:', error);
      throw error;
    }
  }, [firestore]);

  // Função para obter token de ID do usuário autenticado
  const getIdToken = useCallback(async (): Promise<string | null> => {
    try {
      const user = auth.currentUser;
      if (!user) {
        return null;
      }
      return await user.getIdToken();
    } catch (error) {
      console.error('Error getting ID token:', error);
      return null;
    }
  }, [auth]);

  return {
    auth,
    firestore,
    getIdToken,
    getUserData,
    getEventData,
    findUserCheckout,
    createCheckout,
    updateCheckout,
    findUserRegistration,
    createRegistration,
    updateRegistration,
    findRegistrationByVoucher,
  };
};

// Export useful types
export type { Auth, Firestore };