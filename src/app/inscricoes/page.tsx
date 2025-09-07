'use client';

import { useState, useEffect } from 'react';
import { useFirebase } from '../hooks/firebase';
import { sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { User } from 'firebase/auth';
import AdminPanel from '../components/AdminPanel';
import HeadingBadge from '@/app/components/HeadingBadge';
import BoundedMain from '@/app/components/BoundedMain';

export default function Page() {
  const { auth, getUserData } = useFirebase();
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleEmailSignIn = async () => {
      if (isSignInWithEmailLink(auth, window.location.href)) {
        try {
          const email = window.localStorage.getItem('emailForSignIn');
          
          if (!email) {
            setMessage('Email não encontrado. Por favor, solicite um novo link de autenticação.');
            return;
          }

          await signInWithEmailLink(auth, email, window.location.href);
          window.localStorage.removeItem('emailForSignIn');
          setMessage('Autenticação realizada com sucesso!');
        } catch (error: any) {
          console.error('Error signing in with email link:', error);
          setMessage(`Erro na autenticação: ${error.message}`);
        }
      }
    };

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user);
      
      if (user) {
        try {
          const data = await getUserData(user.uid);
          setUserData(data);
        } catch (error) {
          console.error('Error getting user data:', error);
          setUserData(null);
        }
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });

    // Handle email sign-in if URL contains sign-in link
    handleEmailSignIn();

    return () => unsubscribe();
  }, [auth, getUserData]);

  const handleSendSignInLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setMessage('');

    try {
      const actionCodeSettings = {
        url: window.location.href,
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
      <BoundedMain>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando...</p>
          </div>
        </div>
      </BoundedMain>
    );
  }

  if (!user) {
    return (
      <BoundedMain>
        <HeadingBadge as="h1" className="mb-6">Administração de inscrições</HeadingBadge>
        
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <p className="text-gray-600">Faça login para acessar o painel de administração</p>
          </div>

          <form onSubmit={handleSendSignInLink} className="space-y-6">
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
              {authLoading ? 'Enviando...' : 'Enviar link de login'}
            </button>
          </form>

          {message && (
            <div className={`mt-4 p-3 rounded-md text-sm ${
              message.includes('Erro') 
                ? 'bg-red-50 text-red-700 border border-red-200' 
                : 'bg-green-50 text-green-700 border border-green-200'
            }`}>
              {message}
            </div>
          )}
        </div>
      </BoundedMain>
    );
  }

  if (!userData?.admin) {
    return (
      <BoundedMain>
        <HeadingBadge as="h1" className="mb-6">Acesso negado</HeadingBadge>
        
        <div className="max-w-md mx-auto text-center">
          <div className="text-red-600 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-gray-600 mb-6">
            Este recurso está indisponível por falta de autorização. Entre em contato com o desenvolvedor do sistema para solicitar acesso administrativo.
          </p>
          <button
            onClick={() => auth.signOut()}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Sair
          </button>
        </div>
      </BoundedMain>
    );
  }

  return <AdminPanel user={user} userData={userData} />;
}

