"use client";

import { Box, Card, CardContent, Typography } from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
} from "@mui/icons-material";
import { useCheckout } from "../../contexts/CheckoutContext";

type StatusInfo = {
  label: string;
  color: "success" | "info" | "warning" | "error" | "default";
  icon: React.ReactNode;
  description: string;
};

export default function CheckoutStatus() {
  const { checkout, registration } = useCheckout();

  if (!checkout) return null;

  const getCheckoutStatusInfo = (): StatusInfo => {
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

  const getCheckoutByCommitmentStatusInfo = (): StatusInfo | null => {
    if (!checkout.billingDetails) return null;
    if (!("paymentByCommitment" in checkout.billingDetails)) return null;
    if (!checkout.billingDetails.paymentByCommitment) return null;
    const paymentStatus = checkout.payment?.status;

    if (paymentStatus === "paid") {
      return {
        label: "Pagamento recebido",
        color: "success" as const,
        icon: <CheckCircleIcon color="success" />,
        description: "Pagamento do empenho confirmado pela Practicus.",
      };
    }
    if (paymentStatus === "committed") {
      return {
        label: "Pagamento empenhado",
        color: "info" as const,
        icon: <CheckCircleIcon color="success" />,
        description: "O recibo de empenho foi validado pela Practicus.",
      };
    }
    if (
      checkout.payment?.method === "empenho" &&
      checkout.payment.commitmentAttachment
    ) {
      return {
        label: "Empenho pendente",
        color: "warning" as const,
        icon: <PendingIcon color="warning" />,
        description:
          "Recibo de empenho enviado e aguardando validação da Practicus.",
      };
    }
    return {
      label: "Empenho pendente",
      color: "warning" as const,
      icon: <PendingIcon color="warning" />,
      description:
        "Aguardando envio do recibo de empenho para a Practicus. Clique em <b>'Gerenciar Empenho'</b> abaixo para enviar o recibo.",
    };
  };

  const getVoucherStatusInfo = (): StatusInfo => {
    const status = registration ? registration.status : "invalid";
    switch (status) {
      case "ok":
      case "pending":
        return {
          label: "ativa",
          color: "success" as const,
          icon: <CheckCircleIcon color="success" />,
          description:
            "Inscrição realizada. Você não precisa tomar mais nenhuma ação.",
        };
      case "cancelled":
        return {
          label: "desativada",
          color: "error" as const,
          icon: <CancelIcon color="error" />,
          description:
            "Inscrição desativada e voucher liberado para outra pessoa utilizar. <b>Caso queira reativar sua inscrição, entre em contato com o responsável pela compra.</b>",
        };
      case "invalid":
        return {
          label: "inválida",
          color: "default" as const,
          icon: <CancelIcon color="error" />,
          description:
            "<b>O comprador cancelou a compra desta inscrição.</b> Delete sua inscrição e use um novo voucher.",
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

  let statusInfo: StatusInfo;
  if (checkout.checkoutType === "voucher") {
    statusInfo = getVoucherStatusInfo();
  } else if (getCheckoutByCommitmentStatusInfo()) {
    statusInfo = getCheckoutByCommitmentStatusInfo()!;
  } else {
    statusInfo = getCheckoutStatusInfo();
  }

  return (
    <Card sx={{ width: "100%", maxWidth: "100%", overflow: "hidden" }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 }, overflow: "hidden" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            mb: 2,
            flexDirection: { xs: "column", sm: "row" },
            textAlign: { xs: "center", sm: "left" },
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              "& svg": {
                fontSize: { xs: "3rem", sm: "1.5rem" },
              },
            }}
          >
            {statusInfo.icon}
          </Box>
          <Typography
            variant="h6"
            component="h2"
            sx={{ fontSize: { xs: "1.1rem", sm: "1.25rem" } }}
          >
            {checkout.checkoutType === "voucher"
              ? "Situação da inscrição"
              : "Situação da aquisição"}
            : <span className="uppercase">{statusInfo.label}</span>
          </Typography>
        </Box>
        <Typography
          variant="body2"
          color="text.secondary"
          dangerouslySetInnerHTML={{ __html: statusInfo.description }}
          sx={{ textAlign: { xs: "center", sm: "left" } }}
        />
      </CardContent>
    </Card>
  );
}
