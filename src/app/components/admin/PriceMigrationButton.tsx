"use client";

import React, { useState } from "react";
import { Button } from "@mui/material";
import { Refresh as RefreshIcon } from "@mui/icons-material";
import { useFirebase } from "../../hooks/firebase";
import { useAdminContext } from "../../contexts/AdminContext";

export default function PriceMigrationButton() {
  const { getIdToken } = useFirebase();
  const { selectedEvent, showNotification } = useAdminContext();
  const [migrating, setMigrating] = useState(false);

  const handleMigrateTotalValue = async () => {
    if (!selectedEvent) {
      showNotification("Nenhum evento selecionado", "warning");
      return;
    }

    try {
      setMigrating(true);
      const idToken = await getIdToken();

      if (!idToken) {
        throw new Error("Usuário não autenticado");
      }

      const response = await fetch("/api/checkouts/migrate-total-value", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ eventId: selectedEvent.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao executar migração");
      }

      showNotification(
        data.message ||
          `Migração concluída! ${data.updated} checkouts atualizados.`,
        "success"
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erro desconhecido ao executar migração";
      showNotification(errorMessage, "error");
      console.error("Error migrating total value:", error);
    } finally {
      setMigrating(false);
    }
  };

  if (!selectedEvent) {
    return null;
  }

  return (
    <Button
      color="inherit"
      startIcon={<RefreshIcon />}
      onClick={handleMigrateTotalValue}
      disabled={migrating}
      sx={{ textTransform: "none" }}
    >
      {migrating ? "Migrando..." : "Migrar totalValue"}
    </Button>
  );
}
