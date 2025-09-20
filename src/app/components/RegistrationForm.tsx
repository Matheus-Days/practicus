"use client";

import { useState, useEffect, useCallback } from "react";
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
import { useCheckout } from "../contexts/CheckoutContext";
import { RegistrationFormData } from "../api/registrations/registration.types";
import { validateCPF } from "../utils/cpf-utils";
import { validatePhone } from "../utils/phone-utils";
import { PatternFormat } from "react-number-format";

interface RegistrationFormProps {
  initialData?: Partial<RegistrationFormData>;
  onDataChange: (data: Partial<RegistrationFormData>) => void;
  onValidationChange?: (isValid: boolean) => void;
}


export default function RegistrationForm({
  initialData = {},
  onDataChange,
  onValidationChange,
}: RegistrationFormProps) {
  const { user } = useCheckout();

  const [registration, setRegistration] = useState<Partial<RegistrationFormData>>({
    fullName: initialData.fullName || "",
    email: initialData.email || user?.email || "",
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

  const [otherSource, setOtherSource] = useState(initialData.howDidYouHearAboutUs === "outro" ? initialData.howDidYouHearAboutUs : "");
  const [selectedSource, setSelectedSource] = useState(initialData.howDidYouHearAboutUs || "");
  
  const [credNameCounter, setCredNameCounter] = useState(0);

  // Validation states
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [cpfError, setCpfError] = useState<string | null>(null);
  
  // Estado para controlar o formato da máscara do telefone
  const [phoneFormat, setPhoneFormat] = useState<string>("(##) #####-####");

  // Validation function
  const validateForm = useCallback((): boolean => {
    // Verificar se todos os campos obrigatórios estão preenchidos
    const hasFullName = registration.fullName?.trim() !== undefined && registration.fullName?.trim() !== "";
    const hasPhone = registration.phone?.trim() !== undefined && registration.phone?.trim() !== "";
    const hasCpf = registration.cpf?.trim() !== undefined && registration.cpf?.trim() !== "";
    const hasHowDidYouHearAboutUs = registration.howDidYouHearAboutUs?.trim() !== undefined && registration.howDidYouHearAboutUs?.trim() !== "";

    // Verificar se o telefone é válido (sem erros de validação)
    const isPhoneValid = !phoneError && hasPhone;

    // Verificar se o CPF é válido (sem erros de validação)
    const isCpfValid = !cpfError && hasCpf;

    // Verificar se concordou com o uso de imagem
    const hasAgreedToImageUse = registration.useImage === true;

    // Verificar se "como ficou sabendo" está preenchido quando "outro" é selecionado
    const hasValidSource = selectedSource !== "outro" || 
                          (selectedSource === "outro" && otherSource.trim() !== "");

    return hasFullName && hasPhone && hasCpf && hasHowDidYouHearAboutUs && isPhoneValid && isCpfValid && hasAgreedToImageUse && hasValidSource;
  }, [registration, phoneError, cpfError, otherSource, selectedSource]);

  // Effect para notificar mudanças na validação
  useEffect(() => {
    const isValid = validateForm();
    onValidationChange?.(isValid);
  }, [validateForm, onValidationChange]);


  const handleOtherSourceChange = (value: string) => {
    setOtherSource(value);
    if (selectedSource === "outro") {
      const updatedData = { ...registration, howDidYouHearAboutUs: value };
      setRegistration(updatedData);
      onDataChange(updatedData);
    }
  };

  const handleFieldChange = (field: keyof RegistrationFormData, value: any) => {
    if (field === "credentialName") {
      setCredNameCounter(value.length);
    }

    // Phone validation
    if (field === "phone") {
      const validation = validatePhone(value);
      setPhoneError(validation);
    }

    // CPF validation
    if (field === "cpf") {
      const validation = validateCPF(value);
      setCpfError(validation);
    }

    // Handle "howDidYouHearAboutUs" field changes
    if (field === "howDidYouHearAboutUs") {
      setSelectedSource(value);
      // If changing away from "outro", clear the otherSource
      if (value !== "outro") {
        setOtherSource("");
        const updatedData = { ...registration, [field]: value };
        setRegistration(updatedData);
        onDataChange(updatedData);
      } else {
        // If selecting "outro", keep the current otherSource value
        const updatedData = { ...registration, [field]: otherSource || "" };
        setRegistration(updatedData);
        onDataChange(updatedData);
      }
    } else {
      const updatedData = { ...registration, [field]: value };
      setRegistration(updatedData);
      onDataChange(updatedData);
    }
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

      <PatternFormat
        customInput={TextField}
        format={phoneFormat}
        mask="_"
        fullWidth
        label="Telefone"
        value={registration.phone}
        onValueChange={(values) => {
          const { value } = values;
          handleFieldChange("phone", value);
        }}
        onBlur={() => {
          const validation = validatePhone(registration.phone || "");
          setPhoneError(validation);
          
          // Ajustar formato baseado no número de dígitos
          const numericPhone = (registration.phone || "").replace(/\D/g, '');
          if (numericPhone.length === 10) {
            setPhoneFormat("(##) ####-####");
          } else {
            setPhoneFormat("(##) #####-####");
          }
        }}
        onFocus={() => {
          // Resetar para formato que permite 11 dígitos ao focar
          setPhoneFormat("(##) #####-####");
        }}
        variant="outlined"
        size="medium"
        required
        error={!!phoneError}
        helperText={phoneError || "Digite o telefone para validação"}
        placeholder="(00) 00000-0000"
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

      <PatternFormat
        customInput={TextField}
        format="###.###.###-##"
        mask="_"
        fullWidth
        label="CPF"
        value={registration.cpf}
        onValueChange={(values) => {
          const { value } = values;
          handleFieldChange("cpf", value);
        }}
        onBlur={() => {
          const validation = validateCPF(registration.cpf || "");
          setCpfError(validation);
        }}
        variant="outlined"
        size="medium"
        required
        error={!!cpfError}
        helperText={cpfError || "Digite o CPF para validação"}
        placeholder="000.000.000-00"
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
          value={selectedSource}
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

      {selectedSource === "outro" && (
      <TextField
        fullWidth
        label="Especifique como ficou sabendo"
        value={otherSource}
        onChange={(e) => {
          handleOtherSourceChange(e.target.value);
        }}
        variant="outlined"
        size="medium"
        required
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
