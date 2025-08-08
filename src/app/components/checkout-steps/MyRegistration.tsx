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
} from "@mui/icons-material";
import { Registration } from "../../types/checkout";

import { CheckoutType } from "../../api/checkouts/checkout.types";

interface MyRegistrationProps {
  registration: Registration | null;
  registrateMyself: boolean;
  checkoutType: CheckoutType | null;
  onGoToRegistration?: () => void;
  onCancelMyRegistration?: () => void;
}

export default function MyRegistration({
  registration,
  registrateMyself,
  checkoutType,
  onGoToRegistration,
  onCancelMyRegistration,
}: MyRegistrationProps) {
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    "success" | "error" | "info"
  >("success");

  // Mock data para minha inscrição (será substituído pela API real)
  const mockMyRegistration: Registration = {
    id: "my-registration",
    eventId: "event-123",
    userId: "user-123",
    checkoutId: "checkout-123",
    createdAt: new Date(),
    fullName: "Matheus Braga Dias",
    email: "matheus@email.com",
    cpf: "123.456.789-00",
    credentialName: "Matheus Dias",
    phone: "(11) 99999-9999",
    isPhoneWhatsapp: true,
    city: "São Paulo",
    employer: "Practicus",
    occupation: "Desenvolvedor",
    howDidYouHearAboutUs: "Indicação",
    useImage: true,
    status: "ok",
  };

  const handleCancelMyRegistration = () => {
    // TODO: Implementar cancelamento da minha inscrição
    setSnackbarMessage(
      "Funcionalidade de cancelamento da minha inscrição será implementada em breve"
    );
    setSnackbarSeverity("info");
    setSnackbarOpen(true);
    onCancelMyRegistration?.();
  };

  const shouldShowRegistration = registrateMyself || checkoutType === "voucher";

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
            <Chip
              label="Ativa"
              color="success"
              size="small"
              variant="outlined"
            />
          </Box>
          <Typography variant="body2">
            Principais dados da sua inscrição. Eles serão usados para gerar o
            crachá e o certificado de participação, além de qualquer comunicação entre a equipe do evento e você, então verifique se estão
            corretos e os edite se necessário.
          </Typography>

          <div className="my-4"></div>

          {mockMyRegistration ? (
            <>
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>Nome completo:</strong> {mockMyRegistration.fullName}
                </Typography>
                <Typography variant="body2">
                  <strong>Email:</strong> {mockMyRegistration.email}
                </Typography>
                <Typography variant="body2">
                  <strong>CPF:</strong> {mockMyRegistration.cpf}
                </Typography>
                <Typography variant="body2">
                  <strong>Nome para crachá:</strong>{" "}
                  {mockMyRegistration.credentialName}
                </Typography>
                <Typography variant="body2">
                  <strong>Telefone:</strong> {mockMyRegistration.phone}
                  {mockMyRegistration.isPhoneWhatsapp && (
                    <Chip
                      label="WhatsApp"
                      color="success"
                      size="small"
                      variant="outlined"
                      sx={{ ml: 1 }}
                    />
                  )}
                </Typography>
              </Box>

              <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={onGoToRegistration}
                >
                  Editar meus dados de inscrição
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={handleCancelMyRegistration}
                >
                  Cancelar inscrição
                </Button>
              </Stack>
            </>
          ) : (
            <Box sx={{ textAlign: "center", py: 3 }}>
              <Typography variant="body1" color="text.secondary">
                Você ainda não preencheu seus dados de inscrição.
              </Typography>
              <Button
                variant="contained"
                startIcon={<PersonIcon />}
                onClick={onGoToRegistration}
              >
                Preencher dados da minha inscrição
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