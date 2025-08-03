import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, collection, addDoc, query, where, getDocs, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { useMemo, useCallback } from 'react';
import { EventData } from '../types/events';

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

// Interface for registration data
export interface RegistrationData {
  eventId: string;
  userId: string;
  tipoInscricao: 'participante' | 'juridico';
  // Fields for individual participant
  nomeParaCertificado?: string;
  nomeParaCracha?: string;
  cpf?: string;
  telefone?: string;
  telefoneIsWhatsapp?: boolean;
  ocupacao?: string;
  empregador?: string;
  municipio?: string;
  comoConheceu?: string;
  outroComoConheceu?: string;
  formaPagamento: string;
  voucherId?: string | null;
  usoDeImagem?: boolean;
  // Fields for legal entity
  nomeResponsavel?: string;
  telefoneResponsavel?: string;
  cpfResponsavel?: string;
  nomeJuridico?: string;
  cnpj?: string;
  numeroDeParticipantes?: string;
  mensagemAosOrganizadores?: string;
}

// Interface for the document saved in Firestore
export interface RegistrationDocument extends RegistrationData {
  paymentStatus: 'pending' | 'payed';
  createdAt: Date;
}

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

export const useFirebase = () => {
  const auth = useMemo(() => getAuth(app), []);
  const firestore = useMemo(() => getFirestore(app), []);

  const createRegistration = useCallback(async (registrationData: RegistrationData): Promise<string> => {
    try {
      const docRef = await addDoc(collection(firestore, 'registrations'), {
        ...registrationData,
        paymentStatus: 'pending' as const,
        createdAt: new Date(),
      } as RegistrationDocument);
      return docRef.id;
    } catch (error) {
      console.error('Error creating registration:', error);
      throw error;
    }
  }, [firestore]);

  const findUserRegistration = useCallback(async (userId: string, eventId: string): Promise<{id: string, data: RegistrationDocument} | null> => {
    try {
      const registrationsRef = collection(firestore, 'registrations');
      const q = query(
        registrationsRef, 
        where('userId', '==', userId),
        where('eventId', '==', eventId)
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }
      
      // Returns the first record found (should be unique)
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        data: doc.data() as RegistrationDocument
      };
    } catch (error) {
      console.error('Error finding registration:', error);
      throw error;
    }
  }, [firestore]);

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

  return {
    auth,
    firestore,
    createRegistration,
    findUserRegistration,
    getUserData,
    getEventData,
    findUserCheckout,
    createCheckout,
    updateCheckout,
  };
};

// Export useful types
export type { Auth, Firestore };