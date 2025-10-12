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
      case "completed":
        return {
          label: "concluída",
          color: "success" as const,
          icon: <CheckCircleIcon color="success" />,
          description: onlyRegistrateMylself
            ? "Seu pagamento foi aprovado e a vaga no evento foi confirmada e garantida."
            : "Seu pagamento foi aprovado e as vagas no evento foram confirmadas e garantidas.",
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
        description: checkout.payment?.paymentAttachment
          ? "A Practicus recebeu o comprovante de pagamento do empenho e o está avaliando."
          : "O recibo de empenho foi validado pela Practicus. Não se esqueça de enviar o comprovante de pagamento quando ele tiver sido efetuado.",
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
        return {
          label: "ativa",
          color: "success" as const,
          icon: <CheckCircleIcon color="success" />,
          description:
            "Inscrição realizada. Você não precisa tomar mais nenhuma ação.",
        };
      case "pending":
        return {
          label: "suspensa",
          color: "warning" as const,
          icon: <PendingIcon color="warning" />,
          description:
            "<b>Inscrição suspensa por problemas com a compra.</b> Entre em contato com o responsável pela aquisição.",
        }
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
            "<b>O comprador cancelou a compra desta inscrição.</b> Case queira se inscrever de outra forma, delete esta inscrição primeiro.",
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
