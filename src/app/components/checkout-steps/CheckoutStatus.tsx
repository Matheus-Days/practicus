"use client";

import { Box, Card, CardContent, Typography } from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
} from "@mui/icons-material";
import { useBuyer } from "../../contexts/BuyerContext";

type StatusInfo = {
  label: string;
  color: "success" | "info" | "warning" | "error" | "default";
  icon: React.ReactNode;
  description: string;
};

export default function CheckoutStatus() {
  const { checkout, registration } = useBuyer();

  if (!checkout) return null;

  const getCheckoutStatusInfo = (): StatusInfo => {
    const onlyRegistrateMylself =
      checkout.registrateMyself === true &&
      checkout.amount === 1 &&
      !checkout.complimentary;

    switch (checkout.status) {
      case "pending":
        return {
          label: "pagamento pendente",
          color: "warning" as const,
          icon: <PendingIcon color="warning" />,
          description: onlyRegistrateMylself
            ? "Aguardando confirmação do pagamento."
            : "O voucher para as inscrições será liberado após a aprovação do pagamento.",
        };
      case "approved":
      case "paid":
        return {
          label: "paga",
          color: "success" as const,
          icon: <CheckCircleIcon color="success" />,
          description: onlyRegistrateMylself
            ? "Seu pagamento foi aprovado e a vaga no evento está confirmada e garantida."
            : "Seu pagamento foi aprovado e as vagas no evento estão confirmadas e garantidas.",
        };
      case "refunded":
        return {
          label: "cancelada",
          color: "error" as const,
          icon: <CancelIcon color="error" />,
          description: onlyRegistrateMylself
            ? "Aquisição e inscrição cancelada. Se houve pagamento efetivado, o reembolso será avaliado."
            : "Aquisição e inscrições por voucher canceladas. Se houve pagamento efetivado, o reembolso será avaliado.",
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
    if (checkout.payment?.method !== "empenho") return null;

    if (checkout.status === "paid") {
      return {
        label: "Pagamento recebido",
        color: "success" as const,
        icon: <CheckCircleIcon color="success" />,
        description: "Pagamento do empenho confirmado pela Practicus.",
      };
    }
    if (checkout.status === "approved") {
      return {
        label: "Pagamento empenhado",
        color: "info" as const,
        icon: <CheckCircleIcon color="success" />,
        description: checkout.payment?.paymentAttachment
          ? "A Practicus recebeu o comprovante de pagamento do empenho e o está avaliando."
          : "O recibo de empenho foi validado pela Practicus. Não se esqueça de enviar o comprovante de pagamento quando ele tiver sido efetuado.",
      };
    }
    if (
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
        "Aguardando envio do recibo de empenho para a Practicus. Clique em <b>'Gerenciar empenho'</b> abaixo para enviar o recibo.",
    };
  };

  const statusInfo: StatusInfo =
    getCheckoutByCommitmentStatusInfo() ?? getCheckoutStatusInfo();

  if (checkout.checkoutType === "admin") return null;

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
            Situação da aquisição: <span className="uppercase">{statusInfo.label}</span>
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
