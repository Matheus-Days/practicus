"use client";

import { Box, Card, CardContent, Typography } from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
} from "@mui/icons-material";
import { CheckoutStatus as CheckoutStatusType } from "../../api/checkouts/checkout.types";

interface CheckoutStatusProps {
  status: CheckoutStatusType;
}

export default function CheckoutStatus({ status }: CheckoutStatusProps) {
  // Traduzir status do checkout
  const getStatusInfo = (status: CheckoutStatusType) => {
    switch (status) {
      case "pending":
        return {
          label: "Pagamento Pendente",
          color: "warning" as const,
          icon: <PendingIcon color="warning" />,
          description: "Aguardando confirmação do pagamento.",
        };
      case "completed":
        return {
          label: "Concluída",
          color: "success" as const,
          icon: <CheckCircleIcon color="success" />,
          description: "Pagamento aprovado e inscrição liberada.",
        };
      case "refunded":
        return {
          label: "Reembolsada",
          color: "error" as const,
          icon: <CancelIcon color="error" />,
          description:
            "Pagamento reembolsado e processo de inscrição cancelado.",
        };
      case "deleted":
        return {
          label: "Excluída",
          color: "default" as const,
          icon: <CancelIcon color="error" />,
          description: "Processo de aquisição cancelado.",
        };
      default:
        return {
          label: "Desconhecida",
          color: "default" as const,
          icon: <PendingIcon />,
          description: "Situação desconhecida.",
        };
    }
  };

  const statusInfo = getStatusInfo(status);

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
          <span className="text-green">{statusInfo.icon}</span>
          <Typography variant="h6" component="h2">
            Situação da aquisição: {statusInfo.label}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {statusInfo.description}
        </Typography>
      </CardContent>
    </Card>
  );
}
