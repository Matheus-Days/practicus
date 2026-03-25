'use client';

import { useState, useEffect } from 'react';
import { useFirebase } from '../hooks/firebase';
import { useUserAPI } from '../hooks/userAPI';
import { User } from 'firebase/auth';
import AdminPanel from '../components/AdminPanel';
import HeadingBadge from '@/app/components/HeadingBadge';
import BoundedMain from '@/app/components/BoundedMain';
import AuthCard from '../components/AuthCard';

export default function Page() {
  const { auth } = useFirebase();
  const { getUserData } = useUserAPI();
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
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

    return () => unsubscribe();
  }, [auth, getUserData]);

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

        <AuthCard
          auth={auth}
          title="Entrar"
          description="Faça login para acessar o painel de administração"
          onAuthSuccess={() => setMessage("")}
          footer={
            message ? (
              <div className="text-center text-sm text-gray-600">{message}</div>
            ) : null
          }
        />
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

