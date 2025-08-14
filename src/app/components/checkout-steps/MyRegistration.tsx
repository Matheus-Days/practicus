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
} from "@mui/icons-material";
import { useCheckout } from "../../contexts/CheckoutContext";
import { RegistrationStatus } from "../../api/registrations/registration.types";

export default function MyRegistration() {
  const {
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
      setSnackbarMessage("Erro ao cancelar inscrição");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleReactivateMyRegistration = async () => {
    try {
      if (!registration) {
        throw new Error("Nenhuma inscrição encontrada");
      }

      await updateRegistrationStatus(registration.id, "ok");
      await refreshRegistration();
      setSnackbarMessage("Inscrição reativada com sucesso");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage("Erro ao reativar inscrição");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const getChipLabel = (status?: RegistrationStatus) => {
    switch (status) {
      case "cancelled":
        return "Cancelada";
      case "ok":
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
      default:
        return "warning";
    }
  };

  const shouldShowRegistration = registrateMyself || checkoutType === "voucher";
  const isMyRegistration = registration?.id === checkout?.id;
  const canReactivate =
    isMyRegistration && registration?.status === "cancelled";

  if (!shouldShowRegistration) {
    return null;
  }

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
                Minha Inscrição no evento
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
                {registration.status !== "cancelled" ? (
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={handleCancelMyRegistration}
                  >
                    Cancelar inscrição
                  </Button>
                ) : canReactivate ? (
                  <Button
                    variant="outlined"
                    color="success"
                    startIcon={<RefreshIcon />}
                    onClick={handleReactivateMyRegistration}
                  >
                    Reativar inscrição
                  </Button>
                ) : null}
              </Stack>
            </>
          ) : (
            <Box sx={{ textAlign: "center", py: 3 }}>
              <Typography variant="body1" color="text.secondary">
                Sua vaga no evento está garantida, mas você ainda não preencheu
                seus dados de inscrição.
              </Typography>
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
