"use client";

import { useState, useEffect } from "react";
import {
  TextField,
  Checkbox,
  FormControlLabel,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Typography,
  Divider,
  Snackbar,
  Alert,
  Card,
  Stack,
  Autocomplete,
} from "@mui/material";
import { PatternFormat } from "react-number-format";
import { useBuyer } from "../../contexts/BuyerContext";
import {
  BillingDetailsPF,
  BillingDetailsPJ,
  LegalEntity,
  CheckoutDocument,
} from "../../api/checkouts/checkout.types";
import { validateCNPJ } from "../../utils/cnpj-utils";
import { validatePhone } from "../../utils/phone-utils";
import { validateCEP } from "../../utils/cep-utils";
import { useCEP } from "../../hooks/useCEP";
import { calculateTotalPurchasePrice } from "@/lib/checkout-utils";
import { formatCurrency } from "../../utils/export-utils";

export default function BillingDetails() {
  const {
    setCheckoutType,
    setBillingDetails,
    setRegistrationsAmount,
    registrationsAmount,
    legalEntity,
    billingDetails,
    setLegalEntity,
    createCheckout,
    updateCheckout,
    checkout,
    loading,
    user,
    setCurrentStep,
    event,
    isEventClosed,
  } = useBuyer();

  // Estado para controlar o snackbar
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">(
    "success"
  );
  const [cnpjError, setCnpjError] = useState<string | null>(null);

  // Estados para validação dos telefones
  const [phonePFError, setPhonePFError] = useState<string | null>(null);
  const [phoneOrgError, setPhoneOrgError] = useState<string | null>(null);
  const [phoneRespError, setPhoneRespError] = useState<string | null>(null);

  const [phonePFFormat, setPhonePFFormat] = useState<string>("(##) #####-####");
  const [phoneOrgFormat, setPhoneOrgFormat] =
    useState<string>("(##) #####-####");
  const [phoneRespFormat, setPhoneRespFormat] =
    useState<string>("(##) #####-####");

  // Estado para validação da quantidade de inscrições
  const [amountError, setAmountError] = useState<string | null>(null);

  // Hook useCEP para gerenciar CEP, estados e municípios
  const {
    cepState,
    statesState,
    municipalitiesState,
    fetchCEPData,
    validateCEPInput,
    fetchStates,
    fetchMunicipalities,
    clearCEP,
    clearMunicipalities,
  } = useCEP();

  const [billingDetailsPF, setBillingDetailsPF] = useState<BillingDetailsPF>({
    email: "",
    fullName: "",
    phone: "",
  });

  const [billingDetailsPJ, setBillingDetailsPJ] = useState<BillingDetailsPJ>({
    orgPhone: "",
    orgName: "",
    orgDepartment: "",
    orgCnpj: "",
    orgAddress: "",
    orgZip: "",
    orgCity: "",
    orgState: "",
    responsibleName: "",
    responsiblePhone: "",
    responsibleEmail: "",
    paymentByCommitment: false,
  });

  const [localRegistrationsAmount, setLocalRegistrationsAmount] = useState(
    registrationsAmount || 1
  );
  const [localLegalEntity, setLocalLegalEntity] = useState<LegalEntity | null>(
    legalEntity
  );

  const hasCheckout = !!checkout;
  const isReadOnly = isEventClosed;

  // Carregar estados ao montar o componente
  useEffect(() => {
    fetchStates();
  }, [fetchStates]);


  useEffect(() => {
    if (legalEntity === "pf" && billingDetails) {
      const pf = billingDetails as BillingDetailsPF;
      setBillingDetailsPF({
        email: pf.email || "",
        fullName: pf.fullName || "",
        phone: pf.phone || "",
      });
    } else if (legalEntity === "pj" && billingDetails) {
      const pj = billingDetails as BillingDetailsPJ;
      setBillingDetailsPJ({
        orgPhone: pj.orgPhone || "",
        orgName: pj.orgName || "",
        orgDepartment: pj.orgDepartment || "",
        orgCnpj: pj.orgCnpj || "",
        orgAddress: pj.orgAddress || "",
        orgZip: pj.orgZip || "",
        orgCity: pj.orgCity || "",
        orgState: pj.orgState || "",
        responsibleName: pj.responsibleName || "",
        responsiblePhone: pj.responsiblePhone || "",
        responsibleEmail: pj.responsibleEmail || "",
        paymentByCommitment: pj.paymentByCommitment || false,
      });
    }
  }, [legalEntity, billingDetails]);

  useEffect(() => {
    if (localLegalEntity === "pf") {
      setBillingDetailsPJ({
        orgPhone: "",
        orgName: "",
        orgDepartment: "",
        orgCnpj: "",
        orgAddress: "",
        orgZip: "",
        orgCity: "",
        orgState: "",
        responsibleName: "",
        responsiblePhone: "",
        responsibleEmail: "",
        paymentByCommitment: false,
      });
      setCnpjError(null);
      setPhoneOrgError(null);
      setPhoneRespError(null);
      setPhoneOrgFormat("(##) #####-####");
      setPhoneRespFormat("(##) #####-####");
      clearCEP();
      clearMunicipalities();
    } else if (localLegalEntity === "pj") {
      setBillingDetailsPF({
        email: "",
        fullName: "",
        phone: "",
      });
      setPhonePFError(null);
      setPhonePFFormat("(##) #####-####");
    }
  }, [localLegalEntity, clearCEP, clearMunicipalities]);

  useEffect(() => {
    setLocalRegistrationsAmount(registrationsAmount || 1);
  }, [registrationsAmount]);

  useEffect(() => {
    setLocalLegalEntity(legalEntity);
  }, [legalEntity]);

  const handleBillingDetailsPFChange = (
    field: keyof BillingDetailsPF,
    value: string
  ) => {
    const updated = { ...billingDetailsPF, [field]: value || "" };
    setBillingDetailsPF(updated);
    setBillingDetails(updated);
  };

  const handleBillingDetailsPJChange = (
    field: keyof BillingDetailsPJ,
    value: string | boolean
  ) => {
    const updated = { ...billingDetailsPJ, [field]: value };
    setBillingDetailsPJ(updated);
    setBillingDetails(updated);

    if (field === "orgState") {
      const state = statesState.states.find((state) => state.sigla === value);
      if (state) fetchMunicipalities(state.id);
    }
  };

  const handleCreateCheckout = async () => {
    try {
      if (hasCheckout) {
        // Atualiza checkout existente
        await updateCheckout({
          checkoutType: "acquire",
          billingDetails:
            localLegalEntity === "pf" ? billingDetailsPF : billingDetailsPJ,
          amount: localRegistrationsAmount,
          legalEntity: localLegalEntity || undefined,
        });

        // Mostra snackbar de sucesso para atualização
        setSnackbarMessage("Dados da compra atualizados com sucesso!");
        setSnackbarSeverity("success");
        setSnackbarOpen(true);

        // Redireciona para o Dashboard após atualização bem-sucedida
        // TODO: rever uso de timeout por conta de Snackbar
        setTimeout(() => {
          setCurrentStep("overview");
        }, 1500);
      } else {
        // Para novo checkout, definir o tipo ANTES de criar
        setCheckoutType("acquire");

        // Aguardar um tick para garantir que o estado foi atualizado
        await new Promise((resolve) => setTimeout(resolve, 0));

        // Cria novo checkout
        await createCheckout();

        // Redireciona para o Dashboard após criação bem-sucedida
        setCurrentStep("overview");
      }
    } catch (error) {
      console.error("Erro ao processar checkout:", error);

      // Mostra snackbar de erro
      setSnackbarMessage("Erro ao processar checkout. Tente novamente.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleBackToDashboard = () => {
    setCurrentStep("overview");
  };

  // Função para lidar com mudanças no CEP
  const handleCEPChange = async (cep: string) => {
    const numericCEP = cep.replace(/\D/g, "");

    if (numericCEP.length !== 8) {
      return;
    }

    try {
      const cepInfo = await fetchCEPData(cep);

      if (cepInfo) {
        setSnackbarMessage(
          `CEP válido: ${cepInfo.logradouro}, ${cepInfo.localidade} - ${cepInfo.uf}`
        );
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
      }
    } catch (error) {
      setSnackbarMessage("CEP não encontrado");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const isFormValid = (): boolean => {
    // Validar quantidade de inscrições
    if (localRegistrationsAmount <= 0) {
      return false;
    }

    if (localLegalEntity === "pf") {
      // Validar telefone PF
      const phonePFValidation = validatePhone(billingDetailsPF.phone || "");
      if (billingDetailsPF.phone?.trim() && phonePFValidation) {
        return false;
      }

      return Boolean(
        billingDetailsPF.email?.trim() &&
          billingDetailsPF.fullName?.trim() &&
          billingDetailsPF.phone?.trim()
      );
    } else if (localLegalEntity === "pj") {
      // Validar CNPJ
      const cnpjValidation = validateCNPJ(billingDetailsPJ.orgCnpj || "");
      if (billingDetailsPJ.orgCnpj?.trim() && cnpjValidation) {
        return false;
      }

      // Validar telefones PJ
      const phoneOrgValidation = validatePhone(billingDetailsPJ.orgPhone || "");
      const phoneRespValidation = validatePhone(
        billingDetailsPJ.responsiblePhone || ""
      );

      if (
        (billingDetailsPJ.orgPhone?.trim() && phoneOrgValidation) ||
        (billingDetailsPJ.responsiblePhone?.trim() && phoneRespValidation)
      ) {
        return false;
      }

      // Validar CEP
      const cepValidation = validateCEP(billingDetailsPJ.orgZip || "");
      if (billingDetailsPJ.orgZip?.trim() && cepValidation) {
        return false;
      }

      // Validar se estado (sigla) e município estão preenchidos
      if (
        !billingDetailsPJ.orgState?.trim() ||
        !billingDetailsPJ.orgCity?.trim()
      ) {
        return false;
      }

      return Boolean(
        billingDetailsPJ.orgName?.trim() &&
          billingDetailsPJ.orgCnpj?.trim() &&
          billingDetailsPJ.orgPhone?.trim() &&
          billingDetailsPJ.orgAddress?.trim() &&
          billingDetailsPJ.orgZip?.trim() &&
          billingDetailsPJ.responsibleName?.trim() &&
          billingDetailsPJ.responsiblePhone?.trim() &&
          billingDetailsPJ.responsibleEmail?.trim()
      );
    }
    return false;
  };

  return (
    <Card sx={{ p: { xs: 2, sm: 4 } }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 3,
          maxWidth: 600,
          width: "100%",
        }}
      >
        <Typography
          variant="h5"
          component="h2"
          gutterBottom
          sx={{
            fontSize: { xs: "1.5rem", sm: "1.5rem" },
            textAlign: { xs: "center", sm: "left" },
          }}
        >
          Informações da compra
        </Typography>

        {/* Alert quando evento está fechado */}
        {isReadOnly && (
          <Alert severity="info">
            <Typography variant="body2">
              As inscrições para este evento estão encerradas. Os dados de faturamento não podem ser editados.
            </Typography>
          </Alert>
        )}

        {/* I. Campo de quantidade de inscrições, valor por inscrição e valor total */}
        <Box
          sx={{
            display: "flex",
            gap: 2,
            flexDirection: { xs: "column", sm: "row" },
          }}
        >
          <TextField
            sx={{
              marginTop: "1.5rem",
              flex: { xs: "1 1 100%", sm: "1 1 33.33%" },
            }}
            label="Quantidade de inscrições"
            type="number"
            value={localRegistrationsAmount}
            disabled={isReadOnly}
            onChange={(e) => {
              const value = parseInt(e.target.value) || 0;
              setLocalRegistrationsAmount(value);
              setRegistrationsAmount(value);

              // Validar quantidade
              if (value <= 0) {
                setAmountError("A quantidade deve ser maior que zero");
              } else {
                setAmountError(null);
              }
            }}
            variant="outlined"
            size="medium"
            required
            error={!!amountError}
            helperText={amountError}
          />
          <Box
            sx={{
              flex: { xs: "1 1 100%", sm: "1 1 33.33%" },
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start",
            }}
          >
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              Valor por inscrição
            </Typography>
            <Typography
              variant="h6"
              color="primary"
              sx={{
                py: 1.5,
                px: 1.5,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
                backgroundColor: "background.paper",
              }}
            >
              {event && localRegistrationsAmount > 0
                ? formatCurrency(
                    calculateTotalPurchasePrice(event, {
                      amount: localRegistrationsAmount,
                    } as CheckoutDocument) / localRegistrationsAmount
                  )
                : "-"}
            </Typography>
          </Box>
          <Box
            sx={{
              flex: { xs: "1 1 100%", sm: "1 1 33.33%" },
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start",
            }}
          >
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              Valor total da compra
            </Typography>
            <Typography
              variant="h6"
              color="primary"
              sx={{
                py: 1.5,
                px: 1.5,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
                backgroundColor: "background.paper",
              }}
            >
              {event
                ? formatCurrency(
                    calculateTotalPurchasePrice(event, {
                      amount: localRegistrationsAmount,
                    } as CheckoutDocument)
                  )
                : "-"}
            </Typography>
          </Box>
        </Box>

        {/* II. Seletor do tipo de pessoa */}
        <FormControl fullWidth required>
          <InputLabel>Tipo de pessoa</InputLabel>
          <Select
            value={localLegalEntity || ""}
            label="Tipo de pessoa"
            size="medium"
            disabled={isReadOnly}
            onChange={(e) => {
              const value = e.target.value as LegalEntity;
              setLocalLegalEntity(value);
              setLegalEntity(value);
            }}
          >
            <MenuItem value="pf">Pessoa física</MenuItem>
            <MenuItem value="pj">Pessoa jurídica</MenuItem>
          </Select>
        </FormControl>

        {/* III. Campos de dados de cobrança */}
        {localLegalEntity && (
          <>
            <Divider />
            <Typography variant="h6" component="h3" gutterBottom>
              Dados de cobrança
            </Typography>
            <Typography variant="body1" gutterBottom>
              Os dados informados abaixo serão usados para a emissão do recibo
              de pagamento.
            </Typography>

            {localLegalEntity === "pf" ? (
              // Campos para Pessoa Física
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <TextField
                  fullWidth
                  label="Nome completo"
                  value={billingDetailsPF.fullName || ""}
                  disabled={isReadOnly}
                  onChange={(e) =>
                    handleBillingDetailsPFChange("fullName", e.target.value)
                  }
                  variant="outlined"
                  size="medium"
                  required
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
                  value={billingDetailsPF.email || ""}
                  disabled={isReadOnly}
                  onChange={(e) =>
                    handleBillingDetailsPFChange("email", e.target.value)
                  }
                  variant="outlined"
                  size="medium"
                  required
                />

                <PatternFormat
                  customInput={TextField}
                  format={phonePFFormat}
                  mask="_"
                  fullWidth
                  label="Telefone"
                  value={billingDetailsPF.phone || ""}
                  disabled={isReadOnly}
                  onValueChange={(values) => {
                    const { value } = values;
                    handleBillingDetailsPFChange("phone", value);

                    if (value && (value.length === 10 || value.length === 11)) {
                      const validation = validatePhone(value);
                      setPhonePFError(validation);
                    } else {
                      setPhonePFError(null);
                    }
                  }}
                  onBlur={() => {
                    const validation = validatePhone(
                      billingDetailsPF.phone || ""
                    );
                    setPhonePFError(validation);

                    const numericPhone = (billingDetailsPF.phone || "").replace(
                      /\D/g,
                      ""
                    );
                    if (numericPhone.length === 10) {
                      setPhonePFFormat("(##) ####-####");
                    } else {
                      setPhonePFFormat("(##) #####-####");
                    }
                  }}
                  onFocus={() => {
                    setPhonePFFormat("(##) #####-####");
                  }}
                  variant="outlined"
                  size="medium"
                  required
                  error={!!phonePFError}
                  helperText={phonePFError || ""}
                  placeholder="(00) 00000-0000"
                />
              </Box>
            ) : (
              // Campos para Pessoa Jurídica
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <TextField
                  fullWidth
                  label="Nome da organização"
                  value={billingDetailsPJ.orgName || ""}
                  disabled={isReadOnly}
                  onChange={(e) =>
                    handleBillingDetailsPJChange("orgName", e.target.value)
                  }
                  variant="outlined"
                  size="medium"
                  required
                  sx={{
                    "& input": {
                      textTransform: "uppercase",
                    },
                  }}
                />

                <TextField
                  fullWidth
                  label="Nome do órgão ou departamento"
                  value={billingDetailsPJ.orgDepartment || ""}
                  disabled={isReadOnly}
                  onChange={(e) =>
                    handleBillingDetailsPJChange(
                      "orgDepartment",
                      e.target.value
                    )
                  }
                  variant="outlined"
                  size="medium"
                  sx={{
                    "& input": {
                      textTransform: "uppercase",
                    },
                  }}
                />

                <PatternFormat
                  customInput={TextField}
                  format="##.###.###/####-##"
                  mask="_"
                  fullWidth
                  label="CNPJ"
                  value={billingDetailsPJ.orgCnpj || ""}
                  disabled={isReadOnly}
                  onValueChange={(values) => {
                    const { value } = values;
                    handleBillingDetailsPJChange("orgCnpj", value);

                    if (value && value.length === 14) {
                      const validation = validateCNPJ(value);
                      setCnpjError(validation);
                    } else {
                      setCnpjError(null);
                    }
                  }}
                  onBlur={() => {
                    const validation = validateCNPJ(
                      billingDetailsPJ.orgCnpj || ""
                    );
                    setCnpjError(validation);
                  }}
                  variant="outlined"
                  size="medium"
                  required
                  error={!!cnpjError}
                  helperText={cnpjError || ""}
                  placeholder="00.000.000/0000-00"
                />

                <PatternFormat
                  customInput={TextField}
                  format={phoneOrgFormat}
                  mask="_"
                  fullWidth
                  label="Telefone da organização"
                  value={billingDetailsPJ.orgPhone || ""}
                  disabled={isReadOnly}
                  onValueChange={(values) => {
                    const { value } = values;
                    handleBillingDetailsPJChange("orgPhone", value);

                    if (value && (value.length === 10 || value.length === 11)) {
                      const validation = validatePhone(value);
                      setPhoneOrgError(validation);
                    } else {
                      setPhoneOrgError(null);
                    }
                  }}
                  onBlur={() => {
                    const validation = validatePhone(
                      billingDetailsPJ.orgPhone || ""
                    );
                    setPhoneOrgError(validation);

                    const numericPhone = (
                      billingDetailsPJ.orgPhone || ""
                    ).replace(/\D/g, "");
                    if (numericPhone.length === 10) {
                      setPhoneOrgFormat("(##) ####-####");
                    } else {
                      setPhoneOrgFormat("(##) #####-####");
                    }
                  }}
                  onFocus={() => {
                    setPhoneOrgFormat("(##) #####-####");
                  }}
                  variant="outlined"
                  size="medium"
                  required
                  error={!!phoneOrgError}
                  helperText={phoneOrgError || ""}
                  placeholder="(00) 00000-0000"
                />

                {/* CEP - Primeiro campo de endereço */}
                <PatternFormat
                  customInput={TextField}
                  format="#####-###"
                  mask="_"
                  fullWidth
                  label="CEP"
                  value={billingDetailsPJ.orgZip || ""}
                  disabled={isReadOnly}
                  onValueChange={(values) => {
                    const { value } = values;
                    handleBillingDetailsPJChange("orgZip", value);
                  }}
                  onBlur={() => {
                    const validation = validateCEPInput(
                      billingDetailsPJ.orgZip || ""
                    );
                    if (
                      !validation &&
                      billingDetailsPJ.orgZip &&
                      billingDetailsPJ.orgZip.length === 8
                    ) {
                      handleCEPChange(billingDetailsPJ.orgZip);
                    }
                  }}
                  variant="outlined"
                  size="medium"
                  required
                  error={!!cepState.cepError}
                  helperText={
                    cepState.cepLoading
                      ? "Validando CEP..."
                      : cepState.cepSuccess
                        ? "CEP válido"
                        : cepState.cepError ||
                          "Digite o CEP para preenchimento automático"
                  }
                  placeholder="00000-000"
                  InputProps={{
                    endAdornment: cepState.cepLoading ? (
                      <Box
                        sx={{ display: "flex", alignItems: "center", mr: 1 }}
                      >
                        <Box
                          sx={{
                            width: 16,
                            height: 16,
                            border: "2px solid #f3f3f3",
                            borderTop: "2px solid #1976d2",
                            borderRadius: "50%",
                            animation: "spin 1s linear infinite",
                            "@keyframes spin": {
                              "0%": { transform: "rotate(0deg)" },
                              "100%": { transform: "rotate(360deg)" },
                            },
                          }}
                        />
                      </Box>
                    ) : cepState.cepSuccess ? (
                      <Box sx={{ color: "success.main", mr: 1 }}>✓</Box>
                    ) : null,
                  }}
                />

                {/* Estado */}
                <Autocomplete
                  fullWidth
                  options={statesState.states.map((state) => state.sigla)}
                  value={billingDetailsPJ.orgState}
                  onChange={(_, newValue) =>
                    handleBillingDetailsPJChange("orgState", newValue || "")
                  }
                  loading={statesState.statesLoading}
                  disabled={isReadOnly || statesState.statesLoading}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Estado"
                      required
                      error={
                        !billingDetailsPJ.orgState && !!billingDetailsPJ.orgZip
                      }
                      helperText={
                        !billingDetailsPJ.orgState && billingDetailsPJ.orgZip
                          ? "Selecione um estado"
                          : ""
                      }
                    />
                  )}
                  renderOption={(props, option) => {
                    const { key, ...otherProps } = props;
                    return (
                      <Box component="li" key={key} {...otherProps}>
                        {option}
                      </Box>
                    );
                  }}
                  noOptionsText="Nenhum estado encontrado"
                  loadingText="Carregando estados..."
                />

                {/* Município */}
                <Autocomplete
                  fullWidth
                  options={municipalitiesState.municipalities.map(
                    (municipality) => municipality.nome.toUpperCase()
                  )}
                  value={billingDetailsPJ.orgCity}
                  onChange={(_, newValue) =>
                    handleBillingDetailsPJChange("orgCity", newValue || "")
                  }
                  loading={municipalitiesState.municipalitiesLoading}
                  disabled={
                    isReadOnly ||
                    municipalitiesState.municipalities.length === 0 ||
                    municipalitiesState.municipalitiesLoading
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Município"
                      required
                      error={
                        !billingDetailsPJ.orgCity && !!billingDetailsPJ.orgState
                      }
                      helperText="Selecione um município"
                    />
                  )}
                  renderOption={(props, option) => {
                    const { key, ...otherProps } = props;
                    return (
                      <Box component="li" key={key} {...otherProps}>
                        {option}
                      </Box>
                    );
                  }}
                  noOptionsText={
                    municipalitiesState.municipalities.length === 0 &&
                    billingDetailsPJ.orgState
                      ? "Selecione um estado primeiro"
                      : "Nenhum município encontrado"
                  }
                  loadingText="Carregando municípios..."
                />

                {/* Logradouro */}
                <TextField
                  fullWidth
                  label="Logradouro da organização"
                  value={billingDetailsPJ.orgAddress || ""}
                  disabled={isReadOnly}
                  onChange={(e) =>
                    handleBillingDetailsPJChange("orgAddress", e.target.value)
                  }
                  variant="outlined"
                  size="medium"
                  required
                  multiline
                  rows={2}
                  sx={{
                    "& textarea": {
                      textTransform: "uppercase",
                    },
                  }}
                />

                <Divider />
                <Typography variant="subtitle1" gutterBottom>
                  Dados do responsável
                </Typography>

                <TextField
                  fullWidth
                  label="Nome do responsável"
                  value={billingDetailsPJ.responsibleName || ""}
                  disabled={isReadOnly}
                  onChange={(e) =>
                    handleBillingDetailsPJChange(
                      "responsibleName",
                      e.target.value
                    )
                  }
                  variant="outlined"
                  size="medium"
                  required
                  sx={{
                    "& input": {
                      textTransform: "uppercase",
                    },
                  }}
                />

                <TextField
                  fullWidth
                  label="Email do responsável"
                  type="email"
                  value={billingDetailsPJ.responsibleEmail || ""}
                  disabled={isReadOnly}
                  onChange={(e) =>
                    handleBillingDetailsPJChange("responsibleEmail", e.target.value)
                  }
                  variant="outlined"
                  size="medium"
                  required
                />

                <PatternFormat
                  customInput={TextField}
                  format={phoneRespFormat}
                  mask="_"
                  fullWidth
                  label="Telefone do responsável"
                  value={billingDetailsPJ.responsiblePhone || ""}
                  disabled={isReadOnly}
                  onValueChange={(values) => {
                    const { value } = values;
                    handleBillingDetailsPJChange("responsiblePhone", value);

                    if (value && (value.length === 10 || value.length === 11)) {
                      const validation = validatePhone(value);
                      setPhoneRespError(validation);
                    } else {
                      setPhoneRespError(null);
                    }
                  }}
                  onBlur={() => {
                    const validation = validatePhone(
                      billingDetailsPJ.responsiblePhone || ""
                    );
                    setPhoneRespError(validation);

                    const numericPhone = (
                      billingDetailsPJ.responsiblePhone || ""
                    ).replace(/\D/g, "");
                    if (numericPhone.length === 10) {
                      setPhoneRespFormat("(##) ####-####");
                    } else {
                      setPhoneRespFormat("(##) #####-####");
                    }
                  }}
                  onFocus={() => {
                    setPhoneRespFormat("(##) #####-####");
                  }}
                  variant="outlined"
                  size="medium"
                  required
                  error={!!phoneRespError}
                  helperText={phoneRespError || ""}
                  placeholder="(00) 00000-0000"
                />

                {/* Campo de Pagamento por Empenho - apenas para PJ */}
                <Box
                  sx={{
                    mt: 3,
                    p: 3,
                    border: "2px solid #1976d2",
                    borderRadius: 2,
                    backgroundColor: "#f3f8ff",
                    borderStyle: "dashed",
                  }}
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={billingDetailsPJ.paymentByCommitment || false}
                        disabled={isReadOnly}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          handleBillingDetailsPJChange(
                            "paymentByCommitment",
                            checked
                          );
                        }}
                        sx={{
                          "&.Mui-checked": {
                            color: "#1976d2",
                          },
                          transform: "scale(1.2)",
                        }}
                      />
                    }
                    label={
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: "bold",
                          color: "#1976d2",
                          fontSize: "1.1rem",
                        }}
                      >
                        Pagamento por empenho
                      </Typography>
                    }
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      mt: 1,
                      ml: 4.5,
                      color: "#666",
                      fontStyle: "italic",
                    }}
                  >
                    Marque esta opção se o pagamento será realizado através de
                    empenho
                  </Typography>
                </Box>
              </Box>
            )}
          </>
        )}

        {/* Botões de ação */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{
            mt: 2,
            "& > *": {
              flex: { xs: "1 1 100%", sm: "0 1 auto" },
              minWidth: { xs: "100%", sm: "auto" },
            },
          }}
        >
          {/* Botão Voltar - apenas quando já existe um checkout */}
          {hasCheckout && (
            <Button
              variant="outlined"
              size="large"
              onClick={handleBackToDashboard}
              disabled={loading}
              sx={{
                width: { xs: "100%", sm: "auto" },
                minWidth: { sm: "auto" },
              }}
            >
              Voltar
            </Button>
          )}

          {/* Botão principal */}
          <Button
            variant="contained"
            size="large"
            onClick={handleCreateCheckout}
            disabled={isReadOnly || loading || !isFormValid()}
            sx={{
              width: { xs: "100%", sm: "auto" },
              flex: { xs: "1 1 100%", sm: 1 },
              minWidth: { sm: "auto" },
            }}
          >
            {loading
              ? "Processando..."
              : hasCheckout
                ? "Atualizar dados da compra"
                : "Avançar"}
          </Button>
        </Stack>

        {/* Snackbar para notificações */}
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
      </Box>
    </Card>
  );
}
