"use client";

import { useState, useEffect } from "react";
import { useFirebase } from "../hooks/firebase";
import { isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { User } from "firebase/auth";
import { EventData } from "../types/events";
import { CheckoutProvider } from "../contexts/CheckoutContext";
import CheckoutFlow from "./checkout-steps/CheckoutFlow";
import EmailLinkLogin from "./EmailLinkLogin";
import EmailPasswordLogin from "./EmailPasswordLogin";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  AlertTitle,
  CircularProgress,
  Container,
  Stack,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { CheckCircle, Error } from "@mui/icons-material";

interface CheckoutsProps {
  eventId: string;
}

type LoginMethod = "email-link" | "email-password";

export default function Checkouts({ eventId }: CheckoutsProps) {
  const { auth, firestore } = useFirebase();
  const [user, setUser] = useState<User | null>(null);
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginMethod, setLoginMethod] = useState<LoginMethod>("email-password");
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

  const handleLoginMethodChange = (
    _event: React.MouseEvent<HTMLElement>,
    newMethod: LoginMethod | null
  ) => {
    if (newMethod !== null) {
      setLoginMethod(newMethod);
      setMessage("");
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

            <Box display="flex" justifyContent="center">
              <ToggleButtonGroup
                value={loginMethod}
                exclusive
                onChange={handleLoginMethodChange}
                aria-label="método de login"
                size="small"
              >
                <ToggleButton value="email-link" aria-label="login por email link">
                  Link por Email
                </ToggleButton>
                <ToggleButton value="email-password" aria-label="login por email e senha">
                  Email e Senha
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {loginMethod === "email-link" ? (
              <EmailLinkLogin
                auth={auth}
                onSuccess={() => {
                  setMessage("");
                }}
                onError={(error) => {
                  setMessage(error);
                }}
              />
            ) : (
              <EmailPasswordLogin
                auth={auth}
                onSuccess={() => {
                  setMessage("");
                }}
              />
            )}

            {loginMethod === "email-link" && message && (
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
