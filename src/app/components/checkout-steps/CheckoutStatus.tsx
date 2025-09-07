"use client";

import { Box, Card, CardContent, Typography } from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
} from "@mui/icons-material";
import { useCheckout } from "../../contexts/CheckoutContext";

export default function CheckoutStatus() {
  const { checkout, registration } = useCheckout();

  if (!checkout) return null;

  const getCheckoutStatusInfo = () => {
    const multiple = Boolean(
      checkout && checkout.amount && checkout.amount > 1
    );

    switch (checkout.status) {
      case "pending":
        return {
          label: "pagamento pendente",
          color: "warning" as const,
          icon: <PendingIcon color="warning" />,
          description: multiple
            ? "Voucher liberado para inscrições. Porém elas só serão confirmadas após a aprovação do pagamento."
            : "Aguardando confirmação do pagamento.",
        };
      case "completed":
        return {
          label: "concluída",
          color: "success" as const,
          icon: <CheckCircleIcon color="success" />,
          description: multiple
            ? "Seu pagamento foi aprovado e as vagas no evento foram confirmadas e garantidas."
            : "Seu pagamento foi aprovado e a vaga no evento foi confirmada e garantida.",
        };
      case "refunded":
        return {
          label: "reembolsada",
          color: "error" as const,
          icon: <CancelIcon color="error" />,
          description: multiple
            ? "Pagamento reembolsado e inscrição cancelada."
            : "Pagamento reembolsado e inscrições feitas pelo voucher canceladas.",
        };
      case "deleted":
        return {
          label: "excluída",
          color: "default" as const,
          icon: <CancelIcon color="error" />,
          description: multiple
            ? "Processo de aquisição e inscrições feitas pelo voucher cancelados."
            : "Processo de aquisição e inscrição cancelados.",
        };
      default:
        return {
          label: "desconhecida",
          color: "default" as const,
          icon: <PendingIcon />,
          description: "Situação desconhecida.",
        };
    }
  };

  const getVoucherStatusInfo = () => {
    const status = registration ? registration.status : "invalid";
    switch (status) {
      case "ok":
        return {
          label: "ativa",
          color: "success" as const,
          icon: <CheckCircleIcon color="success" />,
          description: "Inscrição realizada e vaga garantida no evento.",
        };
      case "cancelled":
        return {
          label: "desativada",
          color: "error" as const,
          icon: <CancelIcon color="error" />,
          description:
            "Inscrição desativada e voucher liberado para outra pessoa utilizar. Caso queira reativar sua inscrição, entre em contato com o responsável pela compra.",
        };
      case "pending":
        return {
          label: "ativa",
          color: "warning" as const,
          icon: <PendingIcon color="warning" />,
          description:
            "Inscrição realizada, porém sua vaga no evento só será garantida após a aprovação do pagamento do responsável pela compra.",
        };
      default:
        return {
          label: "desconhecida",
          color: "default" as const,
          icon: <PendingIcon />,
          description: "Situação desconhecida.",
        };
    }
  };

  const statusInfo =
    checkout.checkoutType === "voucher"
      ? getVoucherStatusInfo()
      : getCheckoutStatusInfo();

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
          <span className="text-green">{statusInfo.icon}</span>
          <Typography variant="h6" component="h2">
            {checkout.checkoutType === "voucher"
              ? "Situação da inscrição"
              : "Situação da aquisição"}
            : <span className="uppercase">{statusInfo.label}</span>
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {statusInfo.description}
        </Typography>
      </CardContent>
    </Card>
  );
}
