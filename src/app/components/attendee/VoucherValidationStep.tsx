"use client";

import { ReactNode } from "react";
import {
  Box,
  Paper,
  Stack,
  TextField,
  Typography,
  Button,
  Alert,
  CircularProgress,
} from "@mui/material";
import { ConfirmationNumber, ArrowForward } from "@mui/icons-material";

export type VoucherValidationState = "idle" | "validating" | "valid" | "invalid";

type VoucherValidationStepProps = {
  value: string;
  onChange: (value: string) => void;
  validationState: VoucherValidationState;
  errorMessage: string;
  submitting: boolean;
  onValidate: () => void;
  onAdvance: () => void;
  /** Conteúdo exibido quando o voucher é válido mas o usuário não está logado (ex.: AuthCard). */
  loginGate?: ReactNode | null;
};

export default function VoucherValidationStep({
  value,
  onChange,
  validationState,
  errorMessage,
  submitting,
  onValidate,
  onAdvance,
  loginGate = null,
}: VoucherValidationStepProps) {
  const isValidationDisabled =
    !value.trim() ||
    validationState === "validating" ||
    validationState === "valid" ||
    submitting;
  const isAdvanceDisabled = validationState !== "valid" || submitting;

  return (
    <Paper
      elevation={2}
      sx={{ p: { xs: 3, sm: 4 }, maxWidth: 560, mx: "auto" }}
    >
      <Stack spacing={2}>
        <Box textAlign="center">
          <Typography variant="h5" gutterBottom>
            Inscrição com voucher
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Digite o código do seu voucher para liberar o formulário de
            inscrição.
          </Typography>
        </Box>

        <TextField
          fullWidth
          label="Código do voucher"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Ex: VOUCHER123"
          disabled={validationState === "validating" || submitting}
        />

        {errorMessage ? (
          <Alert severity="error">{errorMessage}</Alert>
        ) : null}

        {validationState === "valid" ? (
          <Alert severity="success">
            Voucher válido! Você pode avançar.
          </Alert>
        ) : null}

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <Button
            variant="contained"
            onClick={onValidate}
            disabled={isValidationDisabled}
            startIcon={
              validationState === "validating" ? (
                <CircularProgress size={20} />
              ) : (
                <ConfirmationNumber />
              )
            }
          >
            Validar voucher
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={onAdvance}
            disabled={isAdvanceDisabled}
            startIcon={<ArrowForward />}
          >
            Avançar
          </Button>
        </Stack>

        {loginGate}
      </Stack>
    </Paper>
  );
}
