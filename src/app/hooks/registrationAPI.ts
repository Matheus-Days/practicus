import { useCallback } from 'react';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useFirebase } from './firebase';
import { RegistrationData, Registration } from '../types/checkout';

export type RegistrationMinimal = Pick<Registration, 'id' | 'fullName' | 'email' | 'status'> & {
  isMyRegistration: boolean;
};

// Função utilitária para gerar ID único da registration
const generateRegistrationId = (userId: string, eventId: string): string => {
  return `${eventId}_${userId}`;
};

export const useRegistrationAPI = () => {
  const { firestore } = useFirebase();

  // CREATE - Criar nova inscrição
  const createRegistration = useCallback(async (
    eventId: string,
    userId: string,
    registrationData: RegistrationData,
    checkoutId: string,
  ): Promise<string> => {
    try {
      const registrationId = generateRegistrationId(userId, eventId);
      const registrationRef = doc(firestore, 'registrations', registrationId);
      
      const newRegistration = {
        eventId,
        userId,
        createdAt: new Date(),
        status: 'ok',
        checkoutId,
        ...registrationData
      };

      await setDoc(registrationRef, newRegistration);
      return registrationId;
    } catch (error) {
      console.error('Erro ao criar inscrição:', error);
      throw error;
    }
  }, [firestore]);

  // READ - Buscar inscrição por userId e eventId
  const getRegistration = useCallback(async (
    userId: string,
    eventId: string
  ): Promise<Registration | null> => {
    try {
      const registrationId = generateRegistrationId(userId, eventId);
      const registrationRef = doc(firestore, 'registrations', registrationId);
      const registrationDoc = await getDoc(registrationRef);
      
      if (registrationDoc.exists()) {
        return {
          id: registrationDoc.id,
          ...registrationDoc.data()
        } as Registration;
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao buscar inscrição:', error);
      throw error;
    }
  }, [firestore]);

  // READ - Buscar todas as inscrições de um evento
  const getEventRegistrations = useCallback(async (
    eventId: string
  ): Promise<Registration[]> => {
    try {
      const registrationsRef = collection(firestore, 'registrations');
      const q = query(registrationsRef, where('eventId', '==', eventId));
      
      const querySnapshot = await getDocs(q);
      const registrations: Registration[] = [];
      
      querySnapshot.forEach((doc) => {
        registrations.push({
          id: doc.id,
          ...doc.data()
        } as Registration);
      });
      
      return registrations;
    } catch (error) {
      console.error('Erro ao buscar inscrições do evento:', error);
      throw error;
    }
  }, [firestore]);

  // READ - Buscar inscrições de um checkout com campos limitados
  const getCheckoutRegistrations = useCallback(async (
    checkoutId: string
  ): Promise<Array<RegistrationMinimal>> => {
    try {
      const registrationsRef = collection(firestore, 'registrations');
      const q = query(registrationsRef, where('checkoutId', '==', checkoutId));
      
      const querySnapshot = await getDocs(q);
      const registrations: Array<RegistrationMinimal> = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        registrations.push({
          id: doc.id,
          fullName: data.fullName,
          email: data.email,
          status: data.status,
          isMyRegistration: doc.id === checkoutId,
        });
      });
      
      return registrations;
    } catch (error) {
      console.error('Erro ao buscar inscrições do checkout:', error);
      throw error;
    }
  }, [firestore]);

  // UPDATE - Atualizar inscrição
  const updateRegistration = useCallback(async (
    userId: string,
    eventId: string,
    updateData: Partial<RegistrationData>
  ): Promise<void> => {
    try {
      const registrationId = generateRegistrationId(userId, eventId);
      const registrationRef = doc(firestore, 'registrations', registrationId);
      
      await updateDoc(registrationRef, {
        ...updateData,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Erro ao atualizar inscrição:', error);
      throw error;
    }
  }, [firestore]);

  // UPDATE - Atualizar status da inscrição
  const updateRegistrationStatus = useCallback(async (
    registrationId: string,
    status: 'ok' | 'cancelled' | 'invalid'
  ): Promise<void> => {
    try {
      const registrationRef = doc(firestore, 'registrations', registrationId);
      
      await updateDoc(registrationRef, {
        status,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Erro ao atualizar status da inscrição:', error);
      throw error;
    }
  }, [firestore]);

  // DELETE - Deletar inscrição
  const deleteRegistration = useCallback(async (
    userId: string,
    eventId: string
  ): Promise<void> => {
    try {
      const registrationId = generateRegistrationId(userId, eventId);
      const registrationRef = doc(firestore, 'registrations', registrationId);
      
      await deleteDoc(registrationRef);
    } catch (error) {
      console.error('Erro ao deletar inscrição:', error);
      throw error;
    }
  }, [firestore]);

  return {
    createRegistration,
    getRegistration,
    getEventRegistrations,
    getCheckoutRegistrations,
    updateRegistration,
    updateRegistrationStatus,
    deleteRegistration,
  };
};
