"use client";

import { Card, CardContent, Box, Typography, Chip } from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
} from "@mui/icons-material";
import { RegistrationStatus } from "@/app/api/registrations/registration.types";

type RegistrationStatusCardProps = {
  status: RegistrationStatus;
};

type StatusInfo = {
  label: string;
  color: "success" | "info" | "warning" | "error" | "default";
  icon: React.ReactElement | null;
  description: string;
};

export default function RegistrationStatusCard({
  status,
}: RegistrationStatusCardProps) {
  const getStatusInfo = (status: RegistrationStatus): StatusInfo => {
    switch (status) {
      case "ok":
        return {
          label: "ativa",
          color: "success" as const,
          icon: <CheckCircleIcon color="success" />,
          description:
            "Inscrição realizada com sucesso. Você não precisa tomar mais nenhuma ação.",
        };
      case "pending":
        return {
          label: "pendente",
          color: "warning" as const,
          icon: <PendingIcon color="warning" />,
          description:
            "<b>Inscrição realizada mas aguardando aprovação do pagamento.</b> Em caso de dúvidas, entre em contato com o responsável pela compra do ingresso.",
        };
      case "cancelled":
        return {
          label: "desativada",
          color: "error" as const,
          icon: <CancelIcon color="error" />,
          description:
            "Inscrição desativada e voucher liberado para outra pessoa utilizar. <b>Caso queira reativar sua inscrição, entre em contato com o responsável pela compra do ingresso.</b>",
        };
      case "invalid":
        return {
          label: "inválida",
          color: "default" as const,
          icon: <CancelIcon color="error" />,
          description:
            "<b>O comprador cancelou a aquisição de ingressos para este evento.</b> Caso queira se inscrever de outra forma, delete esta inscrição primeiro e adquira ingressos para o evento.",
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

  const statusInfo = getStatusInfo(status);

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            mb: statusInfo.description ? 2 : 0,
            flexDirection: { xs: "column", sm: "row" },
            textAlign: { xs: "center", sm: "left" },
          }}
        >
          <Typography
            variant="subtitle1"
            component="div"
            sx={{ fontWeight: 600 }}
          >
            Situação da inscrição:
          </Typography>
          <Chip
            icon={statusInfo.icon ?? undefined}
            label={statusInfo.label}
            color={statusInfo.color}
            variant="filled"
            sx={{ fontWeight: 500, textTransform: "uppercase" }}
          />
        </Box>
        {statusInfo.description && (
          <Typography
            variant="body2"
            color="text.secondary"
            dangerouslySetInnerHTML={{ __html: statusInfo.description }}
            sx={{ textAlign: { xs: "center", sm: "left" } }}
          />
        )}
      </CardContent>
    </Card>
  );
}
