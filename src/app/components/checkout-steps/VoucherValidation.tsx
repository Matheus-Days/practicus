"use client";

import { useState, useEffect, useCallback } from "react";
import { useCheckout } from "../../contexts/CheckoutContext";
import { useVoucherAPI } from "../../hooks/voucherAPI";
import RegistrationForm from "../RegistrationForm";
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Paper,
} from "@mui/material";
import {
  ConfirmationNumber as VoucherIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  PersonAdd as PersonAddIcon,
} from "@mui/icons-material";
import { RegistrationFormData } from "../../api/registrations/registration.types";

type ValidationState = "idle" | "validating" | "success" | "error";

export default function VoucherValidation() {
  const {
    setVoucher,
    setCurrentStep,
    formData,
    updateFormData,
    createVoucherCheckout,
    loading,
    error,
  } = useCheckout();
  const { validateVoucher } = useVoucherAPI();
  const [voucherCode, setVoucherCode] = useState("");
  const [validationState, setValidationState] =
    useState<ValidationState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [hasValidated, setHasValidated] = useState(false);
  const [inputModified, setInputModified] = useState(false);

  const handleValidateVoucher = useCallback(async (voucherToValidate?: string) => {
    const codeToValidate = voucherToValidate || voucherCode.trim();
    if (!codeToValidate) {
      return;
    }

    setValidationState("validating");
    setErrorMessage("");

    try {
      await validateVoucher(codeToValidate);

      setValidationState("success");
      setVoucher(codeToValidate);
      setHasValidated(true);
      setInputModified(false);
    } catch (error) {
      setValidationState("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Erro ao validar voucher"
      );
      setHasValidated(true);
      setInputModified(false);
    }
  }, [voucherCode, validateVoucher, setVoucher]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const voucherFromUrl = urlParams.get('voucher');
    
    if (voucherFromUrl && !voucherCode) {
      setVoucherCode(voucherFromUrl);
      handleValidateVoucher(voucherFromUrl);
    }
  }, [voucherCode, handleValidateVoucher]);

  const handleCreateRegistration = () => {
    setShowRegistrationForm(true);
  };

  const handleFinalizeRegistration = async () => {
    if (!formData) {
      setErrorMessage("Dados obrigatórios não encontrados");
      return;
    }

    try {
      // Garantir que todos os campos obrigatórios estejam presentes
      const registrationData = {
        fullName: formData.fullName,
        email: formData.email || "",
        phone: formData.phone,
        cpf: formData.cpf,
        isPhoneWhatsapp: formData.isPhoneWhatsapp || false,
        credentialName: formData.credentialName || formData.fullName,
        occupation: formData.occupation || "",
        employer: formData.employer || "",
        city: formData.city || "",
        useImage: formData.useImage || false,
        howDidYouHearAboutUs: formData.howDidYouHearAboutUs || "",
      };

      await createVoucherCheckout(
        voucherCode.trim(),
        registrationData as RegistrationFormData
      );
      // O contexto já redireciona para "overview" após sucesso
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erro ao criar inscrição"
      );
    }
  };

  const handleVoucherCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVoucherCode(e.target.value);
    if (hasValidated) {
      setInputModified(true);
    }
  };

  const handleBackToSelectType = () => {
    setCurrentStep("select-type");
  };

  const getValidationMessage = () => {
    switch (validationState) {
      case "idle":
        return "Digite o código do seu voucher para continuar";
      case "validating":
        return "Validando voucher...";
      case "success":
        return "Voucher válido! Você pode prosseguir com a inscrição.";
      case "error":
        return (
          errorMessage ||
          "Código de voucher inválido. Verifique e tente novamente."
        );
      default:
        return "";
    }
  };

  const getValidationIcon = () => {
    switch (validationState) {
      case "idle":
        return <VoucherIcon sx={{ fontSize: 48, color: "text.secondary" }} />;
      case "validating":
        return <CircularProgress size={48} />;
      case "success":
        return <SuccessIcon sx={{ fontSize: 48, color: "success.main" }} />;
      case "error":
        return <ErrorIcon sx={{ fontSize: 48, color: "error.main" }} />;
      default:
        return null;
    }
  };

  const getValidationColor = () => {
    switch (validationState) {
      case "success":
        return "success";
      case "error":
        return "error";
      default:
        return "info";
    }
  };

  // Se o voucher foi validado com sucesso e o usuário clicou para criar inscrição
  if (showRegistrationForm) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, p: { xs: 2, sm: 3 } }}>
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom
          sx={{ 
            fontSize: { xs: "1.75rem", sm: "2.125rem" },
            textAlign: { xs: "center", sm: "left" }
          }}
        >
          Dados do participante
        </Typography>

        <Alert severity="success">
          Voucher <strong>{voucherCode}</strong> validado com sucesso! Agora
          preencha seus dados para completar a inscrição.
        </Alert>

        {error && (
          <Alert severity="error">
            {error}
          </Alert>
        )}

        <Card sx={{ boxShadow: 2 }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <RegistrationForm
              initialData={formData || {}}
              onDataChange={updateFormData}
              onValidationChange={setIsFormValid}
            />
          </CardContent>
        </Card>

        <Box sx={{ 
          display: "flex", 
          gap: 2, 
          justifyContent: "space-between",
          flexDirection: { xs: "column", sm: "row" }
        }}>
          <Button
            variant="outlined"
            onClick={() => setShowRegistrationForm(false)}
            disabled={loading}
            sx={{ 
              width: { xs: "100%", sm: "auto" },
              minWidth: { sm: "auto" }
            }}
          >
            Voltar
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={
              loading ? <CircularProgress size={20} /> : <PersonAddIcon />
            }
            onClick={handleFinalizeRegistration}
            disabled={loading || !isFormValid}
            sx={{ 
              width: { xs: "100%", sm: "auto" },
              minWidth: { sm: "auto" }
            }}
          >
            {loading ? "Criando..." : "Finalizar inscrição"}
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3, p: { xs: 2, sm: 3 } }}>
      <Box sx={{ textAlign: "center", mb: 2 }}>
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom
          sx={{ fontSize: { xs: "1.75rem", sm: "2.125rem" } }}
        >
          Validação de voucher
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Digite o código do seu voucher para prosseguir com a inscrição
        </Typography>
      </Box>

      <Paper
        elevation={2}
        sx={{
          p: { xs: 3, sm: 4 },
          maxWidth: 500,
          mx: "auto",
          width: "100%",
          textAlign: "center",
        }}
      >
        <Box sx={{ mb: 3 }}>{getValidationIcon()}</Box>

        <Typography variant="h6" gutterBottom>
          Código do voucher
        </Typography>

        <TextField
          fullWidth
          label="Digite o código do voucher"
          value={voucherCode}
          onChange={handleVoucherCodeChange}
          disabled={validationState === "validating"}
          sx={{ mb: 3 }}
          placeholder="Ex: VOUCHER123"
        />

        <Alert
          severity={getValidationColor()}
          sx={{ mb: 3, textAlign: "left" }}
        >
          {getValidationMessage()}
        </Alert>

        <Box sx={{ 
          display: "flex", 
          gap: 2, 
          justifyContent: "center",
          flexDirection: { xs: "column", sm: "row" }
        }}>
          <Button
            variant="outlined"
            onClick={handleBackToSelectType}
            disabled={validationState === "validating"}
            sx={{ 
              width: { xs: "100%", sm: "auto" },
              minWidth: { sm: "auto" }
            }}
          >
            Voltar
          </Button>

          <Button
            variant="contained"
            onClick={() => handleValidateVoucher()}
            disabled={
              !voucherCode.trim() || 
              validationState === "validating" ||
              (hasValidated && !inputModified)
            }
            startIcon={
              validationState === "validating" ? (
                <CircularProgress size={20} />
              ) : (
                <VoucherIcon />
              )
            }
            sx={{ 
              width: { xs: "100%", sm: "auto" },
              minWidth: { sm: "auto" }
            }}
          >
            {validationState === "validating"
              ? "Validando..."
              : "Validar voucher"}
          </Button>
        </Box>

        {validationState === "success" && (
          <Box sx={{ mt: 3 }}>
            <Button
              variant="contained"
              color="success"
              size="large"
              onClick={handleCreateRegistration}
              startIcon={<PersonAddIcon />}
              sx={{ 
                width: { xs: "100%", sm: "auto" },
                minWidth: { sm: "auto" }
              }}
            >
              Criar inscrição
            </Button>
          </Box>
        )}
      </Paper>

      {validationState === "error" && (
        <Alert severity="info" sx={{ maxWidth: 500, mx: "auto" }}>
          <Typography variant="body2">
            <strong>Dica:</strong> Verifique se o código do voucher está correto
            e se ainda é válido.
          </Typography>
        </Alert>
      )}
    </Box>
  );
}
