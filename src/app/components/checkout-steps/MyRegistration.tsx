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
} from "@mui/material";
import {
  Person as PersonIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Cancel as CancelIcon,
} from "@mui/icons-material";
import { useCheckout } from "../../contexts/CheckoutContext";
import { RegistrationStatus } from "../../api/registrations/registration.types";

export default function MyRegistration() {
  const {
    deleteCheckout,
    registration,
    registrateMyself,
    checkoutType,
    setCurrentStep,
    updateRegistrationStatus,
    refreshRegistration,
    checkout,
  } = useCheckout();
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    "success" | "error" | "info"
  >("success");

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
      await refreshRegistration();
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
      if (!registration) {
        throw new Error("Nenhuma inscrição encontrada");
      }

      await updateRegistrationStatus(registration.id, "cancelled");
      await refreshRegistration();
      setSnackbarMessage("Inscrição cancelada com sucesso");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage("Erro ao desativar inscrição");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
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

    // Não pode desativar se a inscrição já estiver cancelada
    if (registration.status === "cancelled") {
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
        return "success";
      case "pending":
        return "warning";
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
      await deleteCheckout();
      setSnackbarMessage("Inscrição deletada com sucesso");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage((error as Error).message);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  return (
    <>
      <Card>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 2,
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
                  <strong>CPF:</strong> {registration.cpf}
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

              <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => setCurrentStep("registration-form")}
                >
                  Editar meus dados de inscrição
                </Button>
                {canCancelMyRegistration() ? (
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<CancelIcon />}
                    onClick={handleCancelMyRegistration}
                  >
                    Desativar inscrição
                  </Button>
                ) : canActivateMyRegistration() ? (
                  <Button
                    variant="outlined"
                    color="success"
                    startIcon={<RefreshIcon />}
                    onClick={handleActivateMyRegistration}
                  >
                    Ativar inscrição
                  </Button>
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
                  <div>
                    <Button
                      variant="contained"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={handleDeleteVoucherCheckout}
                    >
                      Deletar inscrição
                    </Button>
                  </div>
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
                  pendente,<br /> porém você já pode preencher seus dados de
                  inscrição.
                </Typography>
              )}
              <div className="my-4"></div>
              <Button
                variant="contained"
                startIcon={<PersonIcon />}
                onClick={() => setCurrentStep("registration-form")}
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
