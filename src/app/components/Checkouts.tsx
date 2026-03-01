"use client";

import { useState, useEffect } from "react";
import { useFirebase } from "../hooks/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { User } from "firebase/auth";
import { EventData } from "../types/events";
import { BuyerProvider } from "../contexts/BuyerContext";
import CheckoutFlow from "./checkout-steps/CheckoutFlow";
import AuthCard from "./AuthCard";
import {
  Box,
  Typography,
  Button,
  Alert,
  AlertTitle,
  CircularProgress,
  Stack,
  Divider,
} from "@mui/material";
import { CheckCircle, Error, Info } from "@mui/icons-material";

interface CheckoutsProps {
  eventId: string;
}

export default function Checkouts({ eventId }: CheckoutsProps) {
  const { auth, firestore } = useFirebase();
  const [user, setUser] = useState<User | null>(null);
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user);
      setLoading(false);
    });

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
          
          if (event.status === "canceled") {
            setError("Este evento foi cancelado");
          } else {
            setError(null);
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

  if (error && (!eventData || eventData.status === "canceled")) {
    return (
      <Alert severity="error" icon={<Error />}>
        <AlertTitle>Erro</AlertTitle>
        {error}
      </Alert>
    );
  }

  if (!eventData) {
    return null;
  }

  if (eventData.status === "canceled") {
    return (
      <Alert severity="error" icon={<Error />}>
        <AlertTitle>Erro</AlertTitle>
        Este evento foi cancelado
      </Alert>
    );
  }

  if (user) {
    return (
      <BuyerProvider user={user} eventId={eventId}>
        <Stack sx={{ maxWidth: "100%" }} spacing={2}>
          <Alert severity="success" icon={<CheckCircle />}>
            <Typography variant="body2">
              Autenticado como: <strong>{user.email}</strong>
            </Typography>
          </Alert>

          {eventData?.status === "closed" && (
            <Alert severity="info" icon={<Info />}>
              <AlertTitle>Inscrições encerradas</AlertTitle>
              <Typography variant="body2">
                As inscrições para este evento estão encerradas. Você não pode mais realizar novas compras ou inscrições. 
                No entanto, inscrições e aquisições já realizadas ainda podem ser acessadas e editadas.
              </Typography>
            </Alert>
          )}

          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Não quer adquirir inscrições com este usuário?{" "}
              <Button
                variant="text"
                size="small"
                onClick={async () => {
                  try {
                    await auth.signOut();
                  } catch (error) {
                    console.error("Error signing out:", error);
                  }
                }}
                sx={{ textTransform: "none", p: 0, minWidth: "auto" }}
              >
                Clique aqui para usar outro usuário
              </Button>
            </Typography>
          </Box>

          <Divider />

          <Box>
            <CheckoutFlow />
          </Box>
        </Stack>
      </BuyerProvider>
    );
  }

  return (
    <AuthCard
      auth={auth}
      title="Minha inscrição"
      description="Faça login para verificar ou realizar sua inscrição"
      footer={
        eventData?.status === "closed" ? (
          <Alert severity="info" icon={<Info />}>
            <AlertTitle>Inscrições encerradas</AlertTitle>
            <Typography variant="body2">
              As inscrições para este evento estão encerradas. Você não pode mais realizar novas compras ou inscrições.
              No entanto, inscrições e aquisições já realizadas ainda podem ser acessadas e editadas.
            </Typography>
          </Alert>
        ) : null
      }
    />
  );
}
