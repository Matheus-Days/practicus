"use client";

import { useState } from "react";
import { useCheckout } from "../../contexts/CheckoutContext";
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

type ValidationState = "idle" | "validating" | "success" | "error";

export default function VoucherValidation() {
  const { setVoucher, setCurrentStep, formData, updateFormData } = useCheckout();
  const [voucherCode, setVoucherCode] = useState("");
  const [validationState, setValidationState] = useState<ValidationState>("idle");
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);

  const handleValidateVoucher = async () => {
    if (!voucherCode.trim()) {
      return;
    }

    setValidationState("validating");

    // Simulação de validação mockada
    setTimeout(() => {
      // Mock: vouchers válidos começam com "VOUCHER"
      if (voucherCode.toUpperCase().startsWith("VOUCHER")) {
        setValidationState("success");
        setVoucher(voucherCode);
      } else {
        setValidationState("error");
      }
    }, 1500);
  };

  const handleCreateRegistration = () => {
    setShowRegistrationForm(true);
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
        return "Código de voucher inválido. Verifique e tente novamente.";
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
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
          <SuccessIcon sx={{ color: "success.main", fontSize: 32 }} />
          <Typography variant="h4" component="h1">
            Dados do Participante
          </Typography>
        </Box>
        
        <Alert severity="success" sx={{ mb: 2 }}>
          Voucher <strong>{voucherCode}</strong> validado com sucesso! 
          Agora preencha seus dados para completar a inscrição.
        </Alert>

        <Card sx={{ boxShadow: 2 }}>
          <CardContent sx={{ p: 3 }}>
            <RegistrationForm
              initialData={formData || {}}
              onDataChange={updateFormData}
            />
          </CardContent>
        </Card>

        <Box sx={{ display: "flex", gap: 2, justifyContent: "space-between" }}>
          <Button
            variant="outlined"
            onClick={() => setShowRegistrationForm(false)}
          >
            Voltar
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<PersonAddIcon />}
          >
            Finalizar Inscrição
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box sx={{ textAlign: "center", mb: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Validação de Voucher
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Digite o código do seu voucher para prosseguir com a inscrição
        </Typography>
      </Box>

      <Paper 
        elevation={2} 
        sx={{ 
          p: 4, 
          maxWidth: 500, 
          mx: "auto", 
          width: "100%",
          textAlign: "center"
        }}
      >
        <Box sx={{ mb: 3 }}>
          {getValidationIcon()}
        </Box>

        <Typography variant="h6" gutterBottom>
          Código do Voucher
        </Typography>

        <TextField
          fullWidth
          label="Digite o código do voucher"
          value={voucherCode}
          onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
          disabled={validationState === "validating"}
          sx={{ mb: 3 }}
          placeholder="Ex: VOUCHER123"
          inputProps={{
            style: { textTransform: "uppercase" }
          }}
        />

        <Alert 
          severity={getValidationColor()} 
          sx={{ mb: 3, textAlign: "left" }}
        >
          {getValidationMessage()}
        </Alert>

        <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
          <Button
            variant="outlined"
            onClick={handleBackToSelectType}
            disabled={validationState === "validating"}
          >
            Voltar
          </Button>
          
          <Button
            variant="contained"
            onClick={handleValidateVoucher}
            disabled={!voucherCode.trim() || validationState === "validating"}
            startIcon={validationState === "validating" ? <CircularProgress size={20} /> : <VoucherIcon />}
          >
            {validationState === "validating" ? "Validando..." : "Validar Voucher"}
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
            >
              Criar Inscrição
            </Button>
          </Box>
        )}
      </Paper>

      {validationState === "error" && (
        <Alert severity="info" sx={{ maxWidth: 500, mx: "auto" }}>
          <Typography variant="body2">
            <strong>Dica:</strong> Para testar, use um código que comece com "VOUCHER" 
            (ex: VOUCHER123, VOUCHER456, etc.)
          </Typography>
        </Alert>
      )}
    </Box>
  );
}
