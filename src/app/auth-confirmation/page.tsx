'use client';

import { useState, useEffect } from 'react';
import { useFirebase } from '../hooks/firebase';
import { isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import BoundedMain from '@/app/components/BoundedMain';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Container,
  Stack,
  Alert,
  AlertTitle
} from '@mui/material';
import { CheckCircle, Info, Error, Close } from '@mui/icons-material';

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
        } catch (error: any) {
          console.error('Error signing in with email link:', error);
          setStatus('error');
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
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          minHeight="50vh"
        >
          <Stack spacing={3} alignItems="center">
            <CircularProgress size={48} />
            <Typography variant="body1" color="text.secondary">
              Processando autenticação...
            </Typography>
          </Stack>
        </Box>
      </BoundedMain>
    );
  }

  const getStatusConfig = () => {
    switch (status) {
      case 'success':
        return {
          icon: <CheckCircle sx={{ fontSize: 48, color: 'success.main' }} />,
          severity: 'success' as const,
          title: 'Autenticação bem-sucedida',
          buttonText: 'Fechar e Voltar',
          buttonColor: 'success' as const
        };
      case 'already-authenticated':
        return {
          icon: <Info sx={{ fontSize: 48, color: 'info.main' }} />,
          severity: 'info' as const,
          title: 'Já Autenticado',
          buttonText: 'Fechar e Continuar',
          buttonColor: 'primary' as const
        };
      case 'error':
        return {
          icon: <Error sx={{ fontSize: 48, color: 'error.main' }} />,
          severity: 'error' as const,
          title: 'Erro na Autenticação',
          buttonText: 'Fechar',
          buttonColor: 'error' as const
        };
      default:
        return {
          icon: <Error sx={{ fontSize: 48, color: 'error.main' }} />,
          severity: 'error' as const,
          title: 'Erro',
          buttonText: 'Fechar',
          buttonColor: 'error' as const
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <BoundedMain>
      <Container maxWidth="sm">
        <Card variant="outlined">
          <CardContent sx={{ p: 4 }}>
            <Stack spacing={3} alignItems="center" textAlign="center">
              <Box>
                {statusConfig.icon}
              </Box>

              <Alert severity={statusConfig.severity} sx={{ width: '100%' }}>
                <AlertTitle>{statusConfig.title}</AlertTitle>
                {message}
              </Alert>

              <Button
                variant="contained"
                color={statusConfig.buttonColor}
                size="large"
                fullWidth
                onClick={handleClose}
                startIcon={<Close />}
              >
                {statusConfig.buttonText}
              </Button>

              <Typography variant="caption" color="text.secondary">
                Esta janela já pode ser fechada.
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </BoundedMain>
  );
} 