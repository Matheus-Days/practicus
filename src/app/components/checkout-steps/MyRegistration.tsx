"use client";

import { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Stack,
  Alert,
  Snackbar,
  Tooltip,
} from "@mui/material";
import {
  Person as PersonIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Cancel as CancelIcon,
} from "@mui/icons-material";
import { CircularProgress } from "@mui/material";
import { useCheckout } from "../../contexts/CheckoutContext";
import { RegistrationStatus } from "../../api/registrations/registration.types";
import { formatCPF } from "../../utils/export-utils";

export default function MyRegistration() {
  const {
    deleteCheckout,
    registration,
    registrateMyself,
    checkoutType,
    setCurrentStep,
    updateRegistrationStatus,
    checkout,
    checkoutRegistrations,
    registrationsAmount,
  } = useCheckout();
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    "success" | "error" | "info"
  >("success");
  const [isDeletingVoucher, setIsDeletingVoucher] = useState(false);
  const [isCancellingRegistration, setIsCancellingRegistration] = useState(false);

  const usedRegistrations = checkoutRegistrations.filter(
    (reg) =>
      (reg.status === "ok" || reg.status === "pending") && !reg.isMyRegistration
  ).length;
  const availableRegistrations = registrationsAmount - usedRegistrations;

  const handleActivateMyRegistration = async () => {
    try {
      if (!registration) {
        throw new Error("Nenhuma inscrição encontrada");
      }

      if (!checkout) {
        throw new Error("Checkout não encontrado");
      }

      // Determinar o novo status baseado no status do checkout
      const newStatus: RegistrationStatus =
        checkout.status === "pending" ? "pending" : "ok";

      await updateRegistrationStatus(registration.id, newStatus);

      setSnackbarMessage("Inscrição ativada com sucesso");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage((error as Error).message);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleCancelMyRegistration = async () => {
    try {
      setIsCancellingRegistration(true);
      if (!registration) {
        throw new Error("Nenhuma inscrição encontrada");
      }

      await updateRegistrationStatus(registration.id, "cancelled");

      setSnackbarMessage("Inscrição cancelada com sucesso");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage("Erro ao desativar inscrição");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setIsCancellingRegistration(false);
    }
  };

  // Função para verificar se o botão "Ativar inscrição" deve estar habilitado
  const canActivateMyRegistration = () => {
    if (!registration || !checkout) return false;

    // Não pode ativar a inscrição se checkout for do tipo voucher
    if (checkout.checkoutType === "voucher") {
      return false;
    }

    // Não pode ativar se o checkout for deleted ou refunded
    if (checkout.status === "deleted" || checkout.status === "refunded") {
      return false;
    }

    // Não pode ativar se a inscrição já estiver ok
    if (registration.status === "ok") {
      return false;
    }

    return true;
  };

  // Função para verificar se o botão "Desativar inscrição" deve estar habilitado
  const canCancelMyRegistration = () => {
    if (!registration) return false;

    // Não pode desativar se a inscrição já estiver cancelada ou for inválida
    if (registration.status === "cancelled" || registration.status === "invalid") {
      return false;
    }

    // Não pode desativar se o checkout for deleted ou refunded
    if (
      checkout &&
      (checkout.status === "deleted" || checkout.status === "refunded")
    ) {
      return false;
    }

    return true;
  };

  const getChipLabel = (status?: RegistrationStatus) => {
    switch (status) {
      case "cancelled":
        return "Desativada";
      case "ok":
      case "pending":
        return "Ativa";
      default:
        return "Inválida";
    }
  };

  const getChipColor = (status?: RegistrationStatus) => {
    switch (status) {
      case "cancelled":
        return "error";
      case "ok":
      case "pending":
        return "success";
      default:
        return "warning";
    }
  };

  const shouldShowRegistration = registrateMyself || checkoutType === "voucher";

  if (!shouldShowRegistration) {
    return null;
  }

  const handleDeleteVoucherCheckout = async () => {
    try {
      setIsDeletingVoucher(true);
      await deleteCheckout();
      setSnackbarMessage("Inscrição deletada com sucesso");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage((error as Error).message);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setIsDeletingVoucher(false);
    }
  };

  return (
    <>
      <Card sx={{ width: "100%", maxWidth: "100%", overflow: "hidden" }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 }, overflow: "hidden" }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 2,
              flexDirection: { xs: "column", sm: "row" },
              gap: { xs: 2, sm: 0 }
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <PersonIcon color="primary" />
              <Typography variant="h6" component="h3">
                Minha inscrição no evento
              </Typography>
            </Box>
            {registration && (
              <Chip
                label={getChipLabel(registration?.status)}
                color={getChipColor(registration?.status)}
                size="medium"
                variant="filled"
                sx={{
                  fontSize: { xs: "1rem", sm: "0.75rem" },
                  height: { xs: 36, sm: 32 },
                  "& .MuiChip-label": {
                    fontSize: { xs: "1rem", sm: "0.75rem" },
                    fontWeight: { xs: "bold", sm: "normal" }
                  }
                }}
              />
            )}
          </Box>
          {registration && (
            <Typography variant="body2">
              Principais dados da sua inscrição. Eles serão usados para gerar o
              crachá e o certificado de participação, além de qualquer
              comunicação entre a equipe do evento e você, então verifique se
              estão corretos e os edite se necessário.
            </Typography>
          )}

          <div className="my-4"></div>

          {registration ? (
            <>
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>Nome completo:</strong> {registration.fullName}
                </Typography>
                <Typography variant="body2">
                  <strong>Email:</strong> {registration.email}
                </Typography>
                <Typography variant="body2">
                  <strong>CPF:</strong> {formatCPF(registration.cpf)}
                </Typography>
                <Typography variant="body2">
                  <strong>Nome para crachá:</strong>{" "}
                  {registration.credentialName}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography variant="body2">
                    <strong>Telefone:</strong> {registration.phone}
                  </Typography>
                  {registration.isPhoneWhatsapp && (
                    <Chip
                      label="WhatsApp"
                      color="success"
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Box>
              </Box>

              <Stack 
                direction={{ xs: "column", sm: "row" }} 
                sx={{ 
                  flexWrap: "wrap", 
                  gap: 1,
                  "& > *": {
                    flex: { xs: "1 1 100%", sm: "0 1 auto" },
                    minWidth: { xs: "100%", sm: "auto" }
                  }
                }}
              >
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => setCurrentStep("registration-form")}
                  sx={{ 
                    width: { xs: "100%", sm: "auto" },
                    minWidth: { sm: "auto" }
                  }}
                >
                  Editar meus dados de inscrição
                </Button>
                {canCancelMyRegistration() ? (
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={isCancellingRegistration ? <CircularProgress size={20} color="inherit" /> : <CancelIcon />}
                    onClick={handleCancelMyRegistration}
                    disabled={isCancellingRegistration}
                    sx={{ 
                      width: { xs: "100%", sm: "auto" },
                      minWidth: { sm: "auto" }
                    }}
                  >
                    {isCancellingRegistration ? "Processando..." : "Desistir da inscrição"}
                  </Button>
                ) : canActivateMyRegistration() ? (
                  <Tooltip
                    title={
                      availableRegistrations <= 0
                        ? "Não há ingressos disponíveis"
                        : "Reativar inscrição"
                    }
                  >
                    <span>
                      <Button
                        variant="outlined"
                        color="success"
                        disabled={availableRegistrations <= 0}
                        startIcon={<RefreshIcon />}
                        onClick={handleActivateMyRegistration}
                        sx={{ 
                          width: { xs: "100%", sm: "auto" },
                          minWidth: { sm: "auto" }
                        }}
                      >
                        Reativar inscrição
                      </Button>
                    </span>
                  </Tooltip>
                ) : null}
              </Stack>
              {checkout && checkout.checkoutType === "voucher" && (
                <Stack
                  direction="column"
                  sx={{ flexWrap: "wrap", gap: 1, mt: 2 }}
                >
                  <Typography variant="body2" color="text.secondary">
                    *Quer se inscrever de outra forma que não com voucher?
                    Pressione o botão abaixo para deletar esta inscrição e
                    escolher outra opção:
                  </Typography>
                  <Box>
                    <Button
                      variant="contained"
                      color="error"
                      startIcon={isDeletingVoucher ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />}
                      onClick={handleDeleteVoucherCheckout}
                      disabled={isDeletingVoucher}
                      sx={{ 
                        width: { xs: "100%", sm: "auto" },
                        minWidth: { sm: "auto" }
                      }}
                    >
                      {isDeletingVoucher ? "Deletando..." : "Deletar inscrição"}
                    </Button>
                  </Box>
                </Stack>
              )}
            </>
          ) : (
            <Box sx={{ textAlign: "center", py: 3 }}>
              {checkout && checkout.status === "completed" && (
                <Typography variant="body1" color="text.secondary">
                  Sua vaga no evento está garantida, mas você ainda não
                  preencheu seus dados de inscrição.
                </Typography>
              )}
              {checkout && checkout.status === "pending" && (
                <Typography variant="body1" color="text.secondary">
                  O pagamento ou aprovação de sua vaga no evento ainda está
                  pendente,
                  <br /> porém você já pode preencher seus dados de inscrição.
                </Typography>
              )}
              <div className="my-4"></div>
              <Button
                variant="contained"
                startIcon={<PersonIcon />}
                onClick={() => setCurrentStep("registration-form")}
                sx={{ 
                  width: { xs: "100%", sm: "auto" },
                  minWidth: { sm: "auto" }
                }}
              >
                Preencher minha inscrição
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
}
