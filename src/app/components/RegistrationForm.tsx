"use client";

import { useState } from "react";
import {
  TextField,
  Checkbox,
  FormControlLabel,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import { RegistrationData } from "../types/checkout";
import { useCheckout } from "../contexts/CheckoutContext";

interface RegistrationFormProps {
  initialData?: Partial<RegistrationData>;
  onDataChange: (data: Partial<RegistrationData>) => void;
}

// CPF validation function
function validateCPF(cpf: string): boolean {
  // Check if contains only digits
  if (!/^\d+$/.test(cpf)) return false;
  
  // Check if it has 11 digits
  if (cpf.length !== 11) return false;
  
  // Check if all digits are the same
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  
  // Validate first digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.charAt(9))) return false;
  
  // Validate second digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.charAt(10))) return false;
  
  return true;
}

export default function RegistrationForm({
  initialData = {},
  onDataChange,
}: RegistrationFormProps) {
  const { user } = useCheckout();

  const [registration, setRegistration] = useState<Partial<RegistrationData>>({
    fullName: initialData.fullName || "",
    email: user?.email || "",
    phone: initialData.phone || "",
    cpf: initialData.cpf || "",
    isPhoneWhatsapp: initialData.isPhoneWhatsapp || false,
    credentialName: initialData.credentialName || "",
    occupation: initialData.occupation || "",
    employer: initialData.employer || "",
    city: initialData.city || "",
    useImage: initialData.useImage || false,
    howDidYouHearAboutUs: initialData.howDidYouHearAboutUs || "",
  });

  const [otherSource, setOtherSource] = useState("");
  
  const [credNameCounter, setCredNameCounter] = useState(0);

  // Validation states
  const [phoneError, setPhoneError] = useState(false);
  const [cpfError, setCpfError] = useState(false);

  const handleFieldChange = (field: keyof RegistrationData, value: any) => {
    if (field === "credentialName") {
      setCredNameCounter(value.length);
    }

    // Phone validation
    if (field === "phone") {
      const digits = value.replace(/\D/g, '');
      const isValid = digits.length >= 10 && digits.length <= 13;
      setPhoneError(!isValid && digits.length > 0);
    }

    // CPF validation
    if (field === "cpf") {
      const isValid = validateCPF(value);
      setCpfError(!isValid && value.length > 0);
    }

    const updatedData = { ...registration, [field]: value };
    setRegistration(updatedData);
    onDataChange(updatedData);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <TextField
        fullWidth
        label="Nome completo"
        value={registration.fullName}
        onChange={(e) => handleFieldChange("fullName", e.target.value)}
        variant="outlined"
        size="medium"
        required
        helperText="Esse nome será usado para emissão do certificado."
      />

      <TextField
        fullWidth
        label="Nome para crachá (opcional)"
        value={registration.credentialName}
        onChange={(e) => handleFieldChange("credentialName", e.target.value)}
        variant="outlined"
        size="medium"
        slotProps={{ htmlInput: { maxLength: 15 }}}
        helperText={`${credNameCounter}/15 caracteres`}
      />

      <TextField
        fullWidth
        label="Email"
        type="email"
        value={registration.email}
        disabled
        variant="outlined"
        size="medium"
        helperText="Esse e-mail será usado para envio do certificado."
      />

      <TextField
        fullWidth
        label="Telefone"
        variant="outlined"
        size="medium"
        required
        value={registration.phone}
        onChange={(e) => handleFieldChange("phone", e.target.value)}
        error={phoneError}
        helperText={phoneError ? "Telefone deve ter entre 10 e 13 dígitos" : "Apenas números"}
      />

      <FormControlLabel
        control={
          <Checkbox
            checked={registration.isPhoneWhatsapp}
            onChange={(e) =>
              handleFieldChange("isPhoneWhatsapp", e.target.checked)
            }
          />
        }
        label="Este telefone é WhatsApp"
      />

      <TextField
        fullWidth
        label="CPF"
        variant="outlined"
        size="medium"
        required
        value={registration.cpf}
        onChange={(e) => handleFieldChange("cpf", e.target.value)}
        error={cpfError}
        helperText={cpfError ? "CPF inválido" : "Apenas números"}
      />

      <TextField
        fullWidth
        label="Ocupação (opcional)"
        value={registration.occupation}
        onChange={(e) => handleFieldChange("occupation", e.target.value)}
        variant="outlined"
        size="medium"
      />

      <TextField
        fullWidth
        label="Empregador (opcional)"
        value={registration.employer}
        onChange={(e) => handleFieldChange("employer", e.target.value)}
        variant="outlined"
        size="medium"
      />

      <TextField
        fullWidth
        label="Município de ocupação (opcional)"
        value={registration.city}
        onChange={(e) => handleFieldChange("city", e.target.value)}
        variant="outlined"
        size="medium"
      />

      <FormControl fullWidth required>
        <InputLabel>Como você ficou sabendo deste evento?</InputLabel>
        <Select
          value={registration.howDidYouHearAboutUs}
          label="Como você ficou sabendo deste evento?"
          onChange={(e) =>
            handleFieldChange("howDidYouHearAboutUs", e.target.value)
          }
          required
          size="medium"
        >
          <MenuItem value="instagram">Instagram</MenuItem>
          <MenuItem value="website">Website Practicus</MenuItem>
          <MenuItem value="indicacao">Indicação</MenuItem>
          <MenuItem value="outro">Outro</MenuItem>
        </Select>
      </FormControl>

      {registration.howDidYouHearAboutUs === "outro" && (
      <TextField
        fullWidth
        label="Especifique como ficou sabendo"
        value={otherSource}
        onChange={(e) => {
          setOtherSource(e.target.value);
          handleFieldChange("howDidYouHearAboutUs", e.target.value);
        }}
        variant="outlined"
        size="medium"
        />
      )}

      <FormControlLabel
        control={
          <Checkbox
            checked={registration.useImage}
            onChange={(e) => handleFieldChange("useImage", e.target.checked)}
            required
          />
        }
        label="Eu autorizo o uso de minha imagem"
      />
    </Box>
  );
}
