'use client';

import { useState, useEffect } from 'react';
import { useFirebase } from '../hooks/firebase';
import { sendSignInLinkToEmail } from 'firebase/auth';
import { User } from 'firebase/auth';
import { EventData } from '../types/events';
import { CheckoutProvider } from '../contexts/CheckoutContext';
import CheckoutFlow from './checkout-steps/CheckoutFlow';

interface CheckoutsProps {
  eventId: string;
}

export default function Checkouts({ eventId }: CheckoutsProps) {
  const { auth, getEventData } = useFirebase();
  const [user, setUser] = useState<User | null>(null);
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const event = await getEventData(eventId);
        setEventData(event);
        
        if (!event) {
          setError('Não encontramos nenhum processo de inscrição aberto para este evento');
        } else if (event.status === 'closed') {
          setError('As inscrições para este evento estão encerradas');
        } else if (event.status === 'canceled') {
          setError('Este evento foi cancelado');
        }
      } catch (error) {
        console.error('Error fetching event data:', error);
        setError('Erro ao carregar dados do evento');
      }
    };

    if (eventId) {
      fetchEventData();
    }
  }, [eventId, getEventData]);

  const handleSendSignInLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setMessage('');

    try {
      const actionCodeSettings = {
        url: `${window.location.origin}/auth-confirmation`,
        handleCodeInApp: true,
      };

      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', email);
      setMessage('Link de autenticação enviado para seu email! Verifique sua caixa de entrada.');
    } catch (error: any) {
      console.error('Error sending sign-in link:', error);
      setMessage(`Erro ao enviar link: ${error.message}`);
    } finally {
      setAuthLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!eventData || eventData.status === 'closed' || eventData.status === 'canceled') {
    return null;
  }

  if (user) {
    return (
      <CheckoutProvider user={user} eventId={eventId}>
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-800">
                Autenticado como: <span className="font-medium">{user.email}</span>
              </p>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-sm text-gray-600">
              Não quer adquirir inscrições com este e-mail?{' '}
              <button
                type="button"
                onClick={async () => {
                  try {
                    await auth.signOut();
                    setEmail('');
                    setMessage('');
                  } catch (error) {
                    console.error('Error signing out:', error);
                  }
                }}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Clique aqui para usar outro e-mail
              </button>
            </p>
          </div>
        </div>

        <div className="mt-4">
          <CheckoutFlow />
        </div>
      </CheckoutProvider>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-md p-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Minha Inscrição</h3>
        <p className="text-gray-600">Faça login para verificar ou realizar sua inscrição</p>
      </div>

      <form onSubmit={handleSendSignInLink} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="seu@email.com"
          />
        </div>

        <button
          type="submit"
          disabled={authLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {authLoading ? 'Enviando...' : 'Enviar Link de Login'}
        </button>
      </form>

      {message && (
        <div className={`mt-4 p-3 rounded-md text-sm ${
          message.includes('Erro') 
            ? 'bg-red-50 text-red-800 border border-red-200' 
            : 'bg-green-50 text-green-800 border border-green-200'
        }`}>
          {message}
        </div>
      )}
    </div>
  );
} 