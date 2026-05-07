"use client";

import { useEffect, useState } from "react";
import { User } from "firebase/auth";
import { Alert, AlertTitle, Box, CircularProgress, Stack, Typography } from "@mui/material";
import { useFirebase } from "@/app/hooks/firebase";
import AuthCard from "@/app/components/AuthCard";
import UserSessionBanner from "@/app/components/UserSessionBanner";
import { BuyerProvider, useBuyer } from "@/app/contexts/BuyerContext";
import CheckoutFlow from "@/app/components/checkout-steps/CheckoutFlow";
import { LegalEntity } from "@/app/api/checkouts/checkout.types";
import { useRouter } from "next/navigation";

function BuyerFlowInner() {
  const { event } = useBuyer();
  const { auth } = useFirebase();

  if (!event) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <Stack spacing={2} alignItems="center">
          <CircularProgress />
          <Typography variant="body2" color="text.secondary">
            Carregando dados do evento...
          </Typography>
        </Stack>
      </Box>
    );
  }

  if (event.status === "canceled") {
    return (
      <Stack spacing={2}>
        <Alert severity="error">
          <AlertTitle>Evento cancelado</AlertTitle>
          <Typography variant="body2">
            Este evento foi cancelado. Você ainda pode entrar para acessar compras já realizadas.
          </Typography>
        </Alert>
        <AuthCard
          auth={auth}
          title="Acessar minha compra"
          description="Entre para visualizar compras já realizadas."
        />
      </Stack>
    );
  }

  if (event.status === "closed") {
    return (
      <Stack spacing={2}>
        <Alert severity="info">
          <AlertTitle>Inscrições encerradas</AlertTitle>
          <Typography variant="body2">
            As inscrições para este evento estão encerradas. Você ainda pode entrar para acessar compras já realizadas.
          </Typography>
        </Alert>
        <AuthCard
          auth={auth}
          title="Acessar minha compra"
          description="Entre para visualizar compras já realizadas."
        />
      </Stack>
    );
  }

  // event.status === "open"
  return (
    <Stack spacing={2}>
      <AuthCard
        auth={auth}
        title="Comprar ingressos"
        description="Faça login/crie sua conta para prosseguir com a compra."
      />
      {/* Depois do login o BuyerProvider preencherá os dados e o CheckoutFlow aparece (abaixo, no wrapper). */}
    </Stack>
  );
}

function RouteCheckoutRedirect({
  eventId,
  routeLegalEntity,
}: {
  eventId: string;
  routeLegalEntity?: LegalEntity;
}) {
  const router = useRouter();
  const { checkout } = useBuyer();

  useEffect(() => {
    if (!routeLegalEntity) return;
    if (!checkout) return;

    // Safeguard: only admin checkouts don't have legalEntity, but to be sure we assume 'ph' when null
    const effectiveCheckoutLegalEntity: LegalEntity = checkout.legalEntity ?? "pj";

    if (effectiveCheckoutLegalEntity === routeLegalEntity) return;

    const target =
      effectiveCheckoutLegalEntity === "pf"
        ? `/evento/${eventId}/compra-pf`
        : `/evento/${eventId}/compra`;

    router.replace(target);
  }, [checkout, eventId, routeLegalEntity, router]);

  return null;
}

function BuyerFlowWithAuth({
  eventId,
  routeLegalEntity,
}: {
  eventId: string;
  routeLegalEntity?: LegalEntity;
}) {
  const { auth } = useFirebase();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsub();
  }, [auth]);

  if (authLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <Stack spacing={2} alignItems="center">
          <CircularProgress />
          <Typography variant="body2" color="text.secondary">
            Carregando autenticação...
          </Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <BuyerProvider user={user} eventId={eventId} routeLegalEntity={routeLegalEntity}>
      {/* Se autenticado, mostra o fluxo inteiro; senão, mostra o gate apropriado */}
      {user ? (
        <Stack spacing={2}>
          <UserSessionBanner auth={auth} user={user} label="Comprador" />
          <RouteCheckoutRedirect eventId={eventId} routeLegalEntity={routeLegalEntity} />
          <CheckoutFlow />
        </Stack>
      ) : (
        <BuyerFlowInner />
      )}
    </BuyerProvider>
  );
}

export default function BuyerFlow({
  eventId,
  routeLegalEntity,
}: {
  eventId: string;
  routeLegalEntity?: LegalEntity;
}) {
  return <BuyerFlowWithAuth eventId={eventId} routeLegalEntity={routeLegalEntity} />;
}

