'use client';

import { useState, useEffect } from 'react';
import { useFirebase } from '../hooks/firebase';
import { isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import HeadingBadge from '@/app/components/HeadingBadge';
import BoundedMain from '@/app/components/BoundedMain';

export default function AuthConfirmationPage() {
  const { auth } = useFirebase();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'already-authenticated'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleEmailSignIn = async () => {
      // Check if user is already authenticated
      if (auth.currentUser) {
        setStatus('already-authenticated');
        setMessage('Você já está autenticado no sistema.');
        return;
      }

      if (isSignInWithEmailLink(auth, window.location.href)) {
        try {
          const email = window.localStorage.getItem('emailForSignIn');
          
          if (!email) {
            setStatus('error');
            setMessage('Email não encontrado. Por favor, solicite um novo link de autenticação.');
            return;
          }

          await signInWithEmailLink(auth, email, window.location.href);
          window.localStorage.removeItem('emailForSignIn');
          setStatus('success');
          setMessage('Autenticação realizada com sucesso!');
        } catch (error: any) {
          console.error('Error signing in with email link:', error);
          setStatus('error');
          setMessage(`Erro na autenticação: ${error.message}`);
        }
      } else {
        setStatus('error');
        setMessage('Link de autenticação inválido ou expirado.');
      }
    };

    handleEmailSignIn();
  }, [auth]);

  const handleClose = () => {
    window.close();
    // Fallback: redirect to /inscricoes if window.close() doesn't work
    window.location.href = '/inscricoes';
  };

  if (status === 'loading') {
    return (
      <BoundedMain>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Processando autenticação...</p>
          </div>
        </div>
      </BoundedMain>
    );
  }

  return (
    <BoundedMain>
      <div className="max-w-md mx-auto text-center">
        <div className="mb-6">
          {status === 'success' ? (
            <div className="text-green-600 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          ) : status === 'already-authenticated' ? (
            <div className="text-blue-600 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          ) : (
            <div className="text-red-600 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          )}
        </div>

        <HeadingBadge as="h1" className="mb-4">
          {status === 'success' && 'Autenticação Bem-sucedida'}
          {status === 'already-authenticated' && 'Já Autenticado'}
          {status === 'error' && 'Erro na Autenticação'}
        </HeadingBadge>

        <p className="text-gray-600 mb-8">
          {message}
        </p>

        <div className="space-y-4">
          <button
            onClick={handleClose}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              status === 'success'
                ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                : status === 'already-authenticated'
                ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                : 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500'
            }`}
          >
            {status === 'success' && 'Fechar e Voltar'}
            {status === 'already-authenticated' && 'Fechar e Continuar'}
            {status === 'error' && 'Fechar'}
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-6">
          Esta janela pode ser fechada com segurança.
        </p>
      </div>
    </BoundedMain>
  );
} 