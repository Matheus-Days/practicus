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
  Autocomplete,
  Typography,
} from "@mui/material";
import { RegistrationFormData } from "../api/registrations/registration.types";
import {
  HOW_DID_YOU_HEAR_ABOUT_US_OPTIONS,
  PUBLIC_AGENT_OCCUPATIONS,
  PRIVATE_AGENT_OCCUPATIONS,
} from "../api/registrations/constants";
import { validateCPF } from "../utils/cpf-utils";
import { validatePhone } from "../utils/phone-utils";
import { PatternFormat } from "react-number-format";

interface RegistrationFormProps {
  initialData?: Partial<RegistrationFormData>;
  onDataChange: (data: Partial<RegistrationFormData>) => void;
  onValidationChange?: (isValid: boolean) => void;
}

const OCCUPATION_OPTIONS = [
  {
    group: "AGENTE PÚBLICO",
    options: PUBLIC_AGENT_OCCUPATIONS,
  },
  {
    group: "INICIATIVA PRIVADA",
    options: PRIVATE_AGENT_OCCUPATIONS,
  },
];

export default function RegistrationForm({
  initialData = {},
  onDataChange,
  onValidationChange,
}: RegistrationFormProps) {
  const [registration, setRegistration] = useState<
    Partial<RegistrationFormData>
  >({
    fullName: initialData.fullName || "",
    email: initialData.email || "",
    phone: initialData.phone || "",
    cpf: initialData.cpf || "",
    isPhoneWhatsapp: initialData.isPhoneWhatsapp || false,
    credentialName: initialData.credentialName || "",
    occupation: initialData.occupation || "",
    useImage: initialData.useImage || false,
    howDidYouHearAboutUs: initialData.howDidYouHearAboutUs || "",
    howDidYouHearAboutUsOther: initialData.howDidYouHearAboutUsOther || "",
  });

  const [credNameCounter, setCredNameCounter] = useState(0);

  // Validation states
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [cpfError, setCpfError] = useState<string | null>(null);

  // Estado para controlar o formato da máscara do telefone
  const [phoneFormat, setPhoneFormat] = useState<string>("(##) #####-####");

  // Validation function
  const validateForm = useCallback((): boolean => {
    // Verificar se todos os campos obrigatórios estão preenchidos
    const hasFullName =
      registration.fullName?.trim() !== undefined &&
      registration.fullName?.trim() !== "";
    const hasPhone =
      registration.phone?.trim() !== undefined &&
      registration.phone?.trim() !== "";
    const hasCpf =
      registration.cpf?.trim() !== undefined && registration.cpf?.trim() !== "";
    const hasHowDidYouHearAboutUs =
      registration.howDidYouHearAboutUs?.trim() !== undefined &&
      registration.howDidYouHearAboutUs?.trim() !== "";

    // Verificar se o telefone é válido (sem erros de validação)
    const isPhoneValid = !phoneError && hasPhone;

    // Verificar se o CPF é válido (sem erros de validação)
    const isCpfValid = !cpfError && hasCpf;

    // Verificar se concordou com o uso de imagem
    const hasAgreedToImageUse = registration.useImage === true;

    // Verificar se "como ficou sabendo" está preenchido quando "OUTRO" é selecionado
    const hasValidSource =
      registration.howDidYouHearAboutUs !== "OUTRO" ||
      (registration.howDidYouHearAboutUs === "OUTRO" &&
        registration.howDidYouHearAboutUsOther?.trim() !== "");

    return (
      hasFullName &&
      hasPhone &&
      hasCpf &&
      hasHowDidYouHearAboutUs &&
      isPhoneValid &&
      isCpfValid &&
      hasAgreedToImageUse &&
      hasValidSource
    );
  }, [registration, phoneError, cpfError]);

  // Effect para notificar mudanças na validação
  useEffect(() => {
    const isValid = validateForm();
    onValidationChange?.(isValid);
  }, [validateForm, onValidationChange]);

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

    // Convert to uppercase for specific fields
    if (field === "howDidYouHearAboutUsOther" && typeof value === "string") {
      value = value.toUpperCase();
    }

    // Handle "howDidYouHearAboutUs" field changes
    if (field === "howDidYouHearAboutUs") {
      // If changing away from "OUTRO", clear the other field
      const updatedData = {
        ...registration,
        [field]: value,
        howDidYouHearAboutUsOther:
          value === "OUTRO" ? registration.howDidYouHearAboutUsOther : "",
      };
      setRegistration(updatedData);
      onDataChange(updatedData);
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
        sx={{
          "& input": {
            textTransform: "uppercase",
          },
        }}
      />

      <TextField
        fullWidth
        label="Nome para crachá (opcional)"
        value={registration.credentialName}
        onChange={(e) => handleFieldChange("credentialName", e.target.value)}
        variant="outlined"
        size="medium"
        slotProps={{ htmlInput: { maxLength: 15 } }}
        helperText={`${credNameCounter}/15 caracteres`}
        sx={{
          "& input": {
            textTransform: "uppercase",
          },
        }}
      />

      <TextField
        fullWidth
        label="Email"
        type="email"
        value={registration.email}
        onChange={(e) => handleFieldChange("email", e.target.value)}
        variant="outlined"
        size="medium"
        required
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
          const numericPhone = (registration.phone || "").replace(/\D/g, "");
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

      <Autocomplete
        fullWidth
        options={OCCUPATION_OPTIONS.flatMap((group) => group.options)}
        groupBy={(option) => {
          const group = OCCUPATION_OPTIONS.find((g) =>
            g.options.includes(option)
          );
          return group?.group || "";
        }}
        value={registration.occupation || null}
        onChange={(_, newValue) => {
          handleFieldChange("occupation", newValue || "");
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Ocupação (opcional)"
            variant="outlined"
            size="medium"
            sx={{
              "& input": {
                textTransform: "uppercase",
              },
            }}
            helperText="Caso não esteja na lista, digite a ocupação"
            onChange={(e) => handleFieldChange("occupation", e.target.value)}
          />
        )}
        renderGroup={(params) => (
          <li key={params.key}>
            <Box
              sx={{
                px: 2,
                py: 1,
                bgcolor: "grey.100",
                fontWeight: "bold",
                fontSize: "0.875rem",
                color: "text.secondary",
              }}
            >
              {params.group}
            </Box>
            <ul style={{ padding: 0, margin: 0 }}>{params.children}</ul>
          </li>
        )}
        freeSolo
        selectOnFocus
        handleHomeEndKeys
      />

      <FormControl fullWidth required>
        <InputLabel>Como você ficou sabendo deste evento?</InputLabel>
        <Select
          value={registration.howDidYouHearAboutUs || ""}
          label="Como você ficou sabendo deste evento?"
          onChange={(e) =>
            handleFieldChange("howDidYouHearAboutUs", e.target.value)
          }
          required
          size="medium"
        >
          {HOW_DID_YOU_HEAR_ABOUT_US_OPTIONS.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {registration.howDidYouHearAboutUs === "OUTRO" && (
        <TextField
          fullWidth
          label="Especifique como ficou sabendo"
          value={registration.howDidYouHearAboutUsOther || ""}
          onChange={(e) => {
            handleFieldChange("howDidYouHearAboutUsOther", e.target.value);
          }}
          variant="outlined"
          size="medium"
          required
          sx={{
            "& input": {
              textTransform: "uppercase",
            },
          }}
        />
      )}

      <Typography color="text.secondary" variant="body2" sx={{ mt: 1 }}>
        A Practicus Treinamento e Capacitação
        poderá utilizar a referida imagem, no todo ou em parte, por número indeterminado de vezes, nos meios de 
        comunicação e para os fins que lhe convier, sem fins econômicos, desde que respeitados os dispositivos 
        vigentes na legislação brasileira e no presente instrumento.
      </Typography>

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
