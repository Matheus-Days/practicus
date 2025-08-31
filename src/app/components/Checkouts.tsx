"use client";

import { useState, useEffect } from "react";
import { useFirebase } from "../hooks/firebase";
import { sendSignInLinkToEmail } from "firebase/auth";
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
  const { auth, getEventData } = useFirebase();
  const [user, setUser] = useState<User | null>(null);
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
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
          setError(
            "Não encontramos nenhum processo de inscrição aberto para este evento"
          );
        } else if (event.status === "closed") {
          setError("As inscrições para este evento estão encerradas");
        } else if (event.status === "canceled") {
          setError("Este evento foi cancelado");
        }
      } catch (error) {
        console.error("Error fetching event data:", error);
        setError("Erro ao carregar dados do evento");
      }
    };

    if (eventId) {
      fetchEventData();
    }
  }, [eventId, getEventData]);

  const handleSendSignInLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setMessage("");

    try {
      const actionCodeSettings = {
        url: `${window.location.origin}/auth-confirmation`,
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
        <Stack spacing={2}>
          <Alert severity="info" icon={<CheckCircle />}>
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
                Minha Inscrição
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
                  {authLoading ? "Enviando..." : "Enviar Link de Login"}
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
