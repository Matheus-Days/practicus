'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User } from 'firebase/auth';
import { useFirebase } from '../hooks/firebase';
import { CheckoutContextType, CheckoutDocument } from '../types/checkout';

const CheckoutContext = createContext<CheckoutContextType | undefined>(undefined);

interface CheckoutProviderProps {
  children: ReactNode;
  user: User | null;
  eventId: string;
}

export function CheckoutProvider({ children, user, eventId }: CheckoutProviderProps) {
  const { findUserCheckout, createCheckout: createCheckoutFirebase, updateCheckout } = useFirebase();
  const [checkout, setCheckout] = useState<CheckoutDocument | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Função para buscar checkout do usuário
  const fetchUserCheckout = useCallback(async () => {
    if (!user || !eventId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await findUserCheckout(user.uid, eventId);
      
      if (result) {
        const checkoutData = {
          id: result.id,
          ...result.data
        } as CheckoutDocument;
        setCheckout(checkoutData);
      } else {
        setCheckout(null);
      }
    } catch (err) {
      console.error('Error fetching checkout:', err);
      setError('Erro ao carregar dados de checkout');
    } finally {
      setLoading(false);
    }
  }, [user, eventId, findUserCheckout]);

  // Função para criar novo checkout
  const createCheckout = async (eventId: string) => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const checkoutId = await createCheckoutFirebase(eventId, user.uid);
      
      const createdCheckout: CheckoutDocument = {
        id: checkoutId,
        eventId,
        userId: user.uid,
        createdAt: new Date(),
        status: 'pending'
      };
      
      setCheckout(createdCheckout);
    } catch (err) {
      console.error('Error creating checkout:', err);
      setError('Erro ao criar checkout');
    } finally {
      setLoading(false);
    }
  };

  // Função para atualizar checkout
  const updateCheckoutData = async (updateData: Partial<CheckoutDocument>) => {
    if (!checkout) return;

    setLoading(true);
    setError(null);

    try {
      await updateCheckout(checkout.id, updateData);
      
      // Atualizar o estado local
      setCheckout(prev => prev ? { ...prev, ...updateData, updatedAt: new Date() } : null);
    } catch (err) {
      console.error('Error updating checkout:', err);
      setError('Erro ao atualizar checkout');
    } finally {
      setLoading(false);
    }
  };

  // Função para atualizar checkout
  const refreshCheckout = async () => {
    await fetchUserCheckout();
  };

  // Buscar checkout quando user ou eventId mudar
  useEffect(() => {
    fetchUserCheckout();
  }, [fetchUserCheckout]);

  const value: CheckoutContextType = {
    checkout,
    loading,
    error,
    createCheckout,
    refreshCheckout,
    updateCheckout: updateCheckoutData
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
    throw new Error('useCheckout must be used within a CheckoutProvider');
  }
  return context;
} 