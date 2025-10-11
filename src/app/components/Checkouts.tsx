"use client";

import { useState, useEffect } from "react";
import { useFirebase } from "../hooks/firebase";
import { sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { User } from "firebase/auth";
import { EventData } from "../types/events";
import { CheckoutProvider } from "../contexts/CheckoutContext";
import CheckoutFlow from "./checkout-steps/CheckoutFlow";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  AlertTitle,
  CircularProgress,
  Container,
  Stack,
  Divider,
} from "@mui/material";
import { CheckCircle, Error, Email } from "@mui/icons-material";

interface CheckoutsProps {
  eventId: string;
}

export default function Checkouts({ eventId }: CheckoutsProps) {
  const { auth, firestore } = useFirebase();
  const [user, setUser] = useState<User | null>(null);
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleEmailSignIn = async () => {
      if (isSignInWithEmailLink(auth, window.location.href)) {
        try {
          const email = window.localStorage.getItem("emailForSignIn");
          
          if (!email) {
            setMessage("Email não encontrado. Por favor, solicite um novo link de autenticação.");
            return;
          }

          await signInWithEmailLink(auth, email, window.location.href);
          window.localStorage.removeItem("emailForSignIn");
          setMessage("Autenticação realizada com sucesso!");
        } catch (error: any) {
          console.error("Error signing in with email link:", error);
          setMessage(`Erro na autenticação: ${error.message}`);
        }
      }
    };

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user);
      setLoading(false);
    });

    // Handle email sign-in if URL contains sign-in link
    handleEmailSignIn();

    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    if (!eventId) return;

    const eventRef = doc(firestore, "events", eventId);
    
    const unsubscribe = onSnapshot(eventRef, 
      (doc) => {
        if (doc.exists()) {
          const event = {
            id: doc.id,
            ...doc.data(),
          } as EventData;
          setEventData(event);
          
          if (event.status === "closed") {
            setError("As inscrições para este evento estão encerradas");
          } else if (event.status === "canceled") {
            setError("Este evento foi cancelado");
          }
        } else {
          setError("Não encontramos nenhum processo de inscrição aberto para este evento");
        }
      },
      (error) => {
        console.error("Error fetching event data:", error);
        setError("Erro ao carregar dados do evento");
      }
    );

    return () => unsubscribe();
  }, [eventId, firestore]);

  const handleSendSignInLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setMessage("");

    try {
      const actionCodeSettings = {
        url: window.location.href,
        handleCodeInApp: true,
      };

      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem("emailForSignIn", email);
      setMessage(
        "Link de autenticação enviado para seu email! Verifique sua caixa de spams caso não encontre em sua caixa de entrada."
      );
    } catch (error: any) {
      console.error("Error sending sign-in link:", error);
      setMessage(`Erro ao enviar link de autenticação.`);
    } finally {
      setAuthLoading(false);
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        minHeight="200px"
      >
        <Stack spacing={2} alignItems="center">
          <CircularProgress />
          <Typography variant="body2" color="text.secondary">
            Carregando...
          </Typography>
        </Stack>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" icon={<Error />}>
        <AlertTitle>Erro</AlertTitle>
        {error}
      </Alert>
    );
  }

  if (
    !eventData ||
    eventData.status === "closed" ||
    eventData.status === "canceled"
  ) {
    return null;
  }

  if (user) {
    return (
      <CheckoutProvider user={user} eventId={eventId}>
        <Stack sx={{ maxWidth: "100%" }} spacing={2}>
          <Alert severity="success" icon={<CheckCircle />}>
            <Typography variant="body2">
              Autenticado como: <strong>{user.email}</strong>
            </Typography>
          </Alert>

          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Não quer adquirir inscrições com este e-mail?{" "}
              <Button
                variant="text"
                size="small"
                onClick={async () => {
                  try {
                    await auth.signOut();
                    setEmail("");
                    setMessage("");
                  } catch (error) {
                    console.error("Error signing out:", error);
                  }
                }}
                sx={{ textTransform: "none", p: 0, minWidth: "auto" }}
              >
                Clique aqui para usar outro e-mail
              </Button>
            </Typography>
          </Box>

          <Divider />

          <Box>
            <CheckoutFlow />
          </Box>
        </Stack>
      </CheckoutProvider>
    );
  }

  return (
    <Container maxWidth="md">
      <Card variant="outlined">
        <CardContent sx={{ p: 4 }}>
          <Stack spacing={3}>
            <Box textAlign="center">
              <Typography variant="h5" component="h3" gutterBottom>
                Minha inscrição
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Faça login para verificar ou realizar sua inscrição
              </Typography>
            </Box>

            <Box component="form" onSubmit={handleSendSignInLink}>
              <Stack spacing={3}>
                <TextField
                  id="email"
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  fullWidth
                  placeholder="seu@email.com"
                  InputProps={{
                    startAdornment: (
                      <Email sx={{ mr: 1, color: "text.secondary" }} />
                    ),
                  }}
                />

                <Button
                  type="submit"
                  variant="contained"
                  disabled={authLoading}
                  fullWidth
                  size="large"
                >
                  {authLoading ? "Enviando..." : "Enviar link de login"}
                </Button>
              </Stack>
            </Box>

            {message && (
              <Alert
                severity={message.includes("Erro") ? "error" : "success"}
                icon={message.includes("Erro") ? <Error /> : <CheckCircle />}
              >
                {message}
              </Alert>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}
