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
} from "@mui/material";
import { PatternFormat } from "react-number-format";
import { useCheckout } from "../../contexts/CheckoutContext";
import {
  BillingDetailsPF,
  BillingDetailsPJ,
  LegalEntity,
} from "../../api/checkouts/checkout.types";
import { validateCNPJ } from "../../utils/cnpj-utils";
import { validatePhone } from "../../utils/phone-utils";
import { validateCEP, fetchCEPInfo } from "../../utils/cep-utils";

export default function BillingDetails() {
  const {
    setCheckoutType,
    setBillingDetails,
    setRegistrationsAmount,
    setRegistrateMyself,
    registrateMyself,
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
  } = useCheckout();

  // Estado para controlar o snackbar
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");
  const [cnpjError, setCnpjError] = useState<string | null>(null);
  
  // Estados para validação dos telefones
  const [phonePFError, setPhonePFError] = useState<string | null>(null);
  const [phoneOrgError, setPhoneOrgError] = useState<string | null>(null);
  const [phoneRespError, setPhoneRespError] = useState<string | null>(null);
  
  const [phonePFFormat, setPhonePFFormat] = useState<string>("(##) #####-####");
  const [phoneOrgFormat, setPhoneOrgFormat] = useState<string>("(##) #####-####");
  const [phoneRespFormat, setPhoneRespFormat] = useState<string>("(##) #####-####");
  
  // Estado para validação do CEP
  const [cepError, setCepError] = useState<string | null>(null);
  const [cepLoading, setCepLoading] = useState<boolean>(false);
  const [cepSuccess, setCepSuccess] = useState<boolean>(false);

  const [billingDetailsPF, setBillingDetailsPF] = useState<BillingDetailsPF>({
    email: user?.email || "",
    fullName: "",
    phone: "",
  });

  const [billingDetailsPJ, setBillingDetailsPJ] = useState<BillingDetailsPJ>({
    orgPhone: "",
    orgName: "",
    orgCnpj: "",
    orgAddress: "",
    orgZip: "",
    responsibleName: "",
    responsiblePhone: "",
    responsibleEmail: user?.email || "",
    paymentByCommitment: false,
  });

  const [localRegistrationsAmount, setLocalRegistrationsAmount] = useState(registrationsAmount || 1);
  const [localLegalEntity, setLocalLegalEntity] = useState<LegalEntity | null>(legalEntity);
  const [localRegistrateMyself, setLocalRegistrateMyself] = useState(registrateMyself || false);

  const hasExistingCheckout = checkout && checkout.status !== 'deleted';

  useEffect(() => {
    const userEmail = user?.email || "";
    setBillingDetailsPF((prev) => ({ ...prev, email: userEmail }));
    setBillingDetailsPJ((prev) => ({ ...prev, responsibleEmail: userEmail }));
  }, [user?.email]);

  useEffect(() => {
    if (legalEntity === "pf" && billingDetails) {
      const pf = billingDetails as BillingDetailsPF;
      setBillingDetailsPF({
        email: pf.email || user?.email || "",
        fullName: pf.fullName || "",
        phone: pf.phone || "",
      });
    } else if (legalEntity === "pj" && billingDetails) {
      const pj = billingDetails as BillingDetailsPJ;
      setBillingDetailsPJ({
        orgPhone: pj.orgPhone || "",
        orgName: pj.orgName || "",
        orgCnpj: pj.orgCnpj || "",
        orgAddress: pj.orgAddress || "",
        orgZip: pj.orgZip || "",
        responsibleName: pj.responsibleName || "",
        responsiblePhone: pj.responsiblePhone || "",
        responsibleEmail: pj.responsibleEmail || user?.email || "",
        paymentByCommitment: pj.paymentByCommitment || false,
      });
    }
  }, [legalEntity, billingDetails, user?.email]);

  useEffect(() => {
    if (localLegalEntity === "pf") {
        setBillingDetailsPJ({
          orgPhone: "",
          orgName: "",
          orgCnpj: "",
          orgAddress: "",
          orgZip: "",
          responsibleName: "",
          responsiblePhone: "",
          responsibleEmail: user?.email || "",
          paymentByCommitment: false,
        });
        setCnpjError(null);
        setPhoneOrgError(null);
        setPhoneRespError(null);
        setPhoneOrgFormat("(##) #####-####");
        setPhoneRespFormat("(##) #####-####");
        setCepError(null);
        setCepLoading(false);
        setCepSuccess(false);
    } else if (localLegalEntity === "pj") {
      setBillingDetailsPF({
        email: user?.email || "",
        fullName: "",
        phone: "",
      });
      setPhonePFError(null);
      setPhonePFFormat("(##) #####-####");
    }
  }, [localLegalEntity, user?.email]);

  useEffect(() => {
    setLocalRegistrationsAmount(registrationsAmount || 1);
  }, [registrationsAmount]);

  useEffect(() => {
    setLocalLegalEntity(legalEntity);
  }, [legalEntity]);

  useEffect(() => {
    setLocalRegistrateMyself(registrateMyself || false);
  }, [registrateMyself]);

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
  };

  const handleCreateCheckout = async () => {
    try {
      if (hasExistingCheckout) {
        // Atualiza checkout existente
        await updateCheckout({
          checkoutType: "acquire",
          billingDetails: localLegalEntity === "pf" ? billingDetailsPF : billingDetailsPJ,
          amount: localRegistrationsAmount,
          legalEntity: localLegalEntity || undefined,
          registrateMyself: localRegistrateMyself,
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
        await new Promise(resolve => setTimeout(resolve, 0));
        
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

  // Função para validar CEP com a API dos Correios
  const validateCEPWithAPI = async (cep: string) => {
    const numericCEP = cep.replace(/\D/g, '');
    
    if (numericCEP.length !== 8) {
      setCepError(null);
      setCepSuccess(false);
      return;
    }

    setCepLoading(true);
    setCepError(null);
    setCepSuccess(false);

    try {
      const cepInfo = await fetchCEPInfo(cep);
      
      // CEP válido e encontrado na API
      setCepSuccess(true);
      setCepError(null);
      
      // Mostrar snackbar de sucesso
      setSnackbarMessage(`CEP válido: ${cepInfo.logradouro}, ${cepInfo.localidade} - ${cepInfo.uf}`);
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      
    } catch (error) {
      setCepError("CEP não encontrado nos Correios");
      setCepSuccess(false);
    } finally {
      setCepLoading(false);
    }
  };

  const isFormValid = (): boolean => {
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
      const phoneRespValidation = validatePhone(billingDetailsPJ.responsiblePhone || "");
      
      if ((billingDetailsPJ.orgPhone?.trim() && phoneOrgValidation) ||
          (billingDetailsPJ.responsiblePhone?.trim() && phoneRespValidation)) {
        return false;
      }
      
      // Validar CEP
      const cepValidation = validateCEP(billingDetailsPJ.orgZip || "");
      if (billingDetailsPJ.orgZip?.trim() && cepValidation) {
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
          width: "100%"
        }}
      >
        <Typography 
          variant="h5" 
          component="h2" 
          gutterBottom
          sx={{ 
            fontSize: { xs: "1.5rem", sm: "1.5rem" },
            textAlign: { xs: "center", sm: "left" }
          }}
        >
          Informações da compra
        </Typography>

        {/* I. Campo de quantidade de inscrições */}
        <TextField
          fullWidth
          label="Quantidade de inscrições"
          type="number"
          value={localRegistrationsAmount}
          onChange={(e) => {
            const value = parseInt(e.target.value) || 1;
            setLocalRegistrationsAmount(value);
            setRegistrationsAmount(value);
          }}
          variant="outlined"
          size="medium"
          required
          slotProps={{ htmlInput: { min: 1 } }}
          helperText="Mínimo de 1 inscrição"
        />

        {/* II. Seletor do tipo de pessoa */}
        <FormControl fullWidth required>
          <InputLabel>Tipo de pessoa</InputLabel>
          <Select
            value={localLegalEntity || ""}
            label="Tipo de pessoa"
            size="medium"
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
              Os dados informados abaixo serão usados para a emissão do recibo de pagamento.
            </Typography>

            {localLegalEntity === "pf" ? (
              // Campos para Pessoa Física
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <TextField
                  fullWidth
                  label="Nome completo"
                  value={billingDetailsPF.fullName || ""}
                  onChange={(e) =>
                    handleBillingDetailsPFChange("fullName", e.target.value)
                  }
                  variant="outlined"
                  size="medium"
                  required
                  sx={{
                    '& input': {
                      textTransform: 'uppercase'
                    }
                  }}
                />

                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={billingDetailsPF.email || ""}
                  disabled
                  variant="outlined"
                  size="medium"
                  required
                  helperText="Email do usuário autenticado"
                />

                <PatternFormat
                  customInput={TextField}
                  format={phonePFFormat}
                  mask="_"
                  fullWidth
                  label="Telefone"
                  value={billingDetailsPF.phone || ""}
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
                    const validation = validatePhone(billingDetailsPF.phone || "");
                    setPhonePFError(validation);
                    
                    const numericPhone = (billingDetailsPF.phone || "").replace(/\D/g, '');
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
                  onChange={(e) =>
                    handleBillingDetailsPJChange("orgName", e.target.value)
                  }
                  variant="outlined"
                  size="medium"
                  required
                  sx={{
                    '& input': {
                      textTransform: 'uppercase'
                    }
                  }}
                />

                <PatternFormat
                  customInput={TextField}
                  format="##.###.###/####-##"
                  mask="_"
                  fullWidth
                  label="CNPJ"
                  value={billingDetailsPJ.orgCnpj || ""}
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
                    const validation = validateCNPJ(billingDetailsPJ.orgCnpj || "");
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
                    const validation = validatePhone(billingDetailsPJ.orgPhone || "");
                    setPhoneOrgError(validation);
                    
                    const numericPhone = (billingDetailsPJ.orgPhone || "").replace(/\D/g, '');
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

                <TextField
                  fullWidth
                  label="Endereço da organização"
                  value={billingDetailsPJ.orgAddress || ""}
                  onChange={(e) =>
                    handleBillingDetailsPJChange("orgAddress", e.target.value)
                  }
                  variant="outlined"
                  size="medium"
                  required
                  multiline
                  rows={2}
                  sx={{
                    '& textarea': {
                      textTransform: 'uppercase'
                    }
                  }}
                />

                <PatternFormat
                  customInput={TextField}
                  format="#####-###"
                  mask="_"
                  fullWidth
                  label="CEP"
                  value={billingDetailsPJ.orgZip || ""}
                  onValueChange={(values) => {
                    const { value } = values;
                    handleBillingDetailsPJChange("orgZip", value);
                    
                    // Validar CEP em tempo real
                    if (value && value.length === 8) {
                      const validation = validateCEP(value);
                      if (!validation) {
                        validateCEPWithAPI(value);
                      } else {
                        setCepError(validation);
                        setCepSuccess(false);
                      }
                    } else {
                      setCepError(null);
                      setCepSuccess(false);
                    }
                  }}
                  onBlur={() => {
                    const validation = validateCEP(billingDetailsPJ.orgZip || "");
                    setCepError(validation);
                  }}
                  variant="outlined"
                  size="medium"
                  required
                  error={!!cepError}
                  helperText={
                    cepLoading 
                      ? "Validando CEP..." 
                      : cepSuccess 
                        ? "CEP válido" 
                        : cepError || "Sujeito a validação com os Correios"
                  }
                  placeholder="00000-000"
                  InputProps={{
                    endAdornment: cepLoading ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                        <Box
                          sx={{
                            width: 16,
                            height: 16,
                            border: '2px solid #f3f3f3',
                            borderTop: '2px solid #1976d2',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            '@keyframes spin': {
                              '0%': { transform: 'rotate(0deg)' },
                              '100%': { transform: 'rotate(360deg)' }
                            }
                          }}
                        />
                      </Box>
                    ) : cepSuccess ? (
                      <Box sx={{ color: 'success.main', mr: 1 }}>✓</Box>
                    ) : null
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
                    '& input': {
                      textTransform: 'uppercase'
                    }
                  }}
                />

                <TextField
                  fullWidth
                  label="Email do responsável"
                  type="email"
                  value={billingDetailsPJ.responsibleEmail || user?.email || ""}
                  disabled
                  variant="outlined"
                  size="medium"
                  required
                  helperText="Email do usuário autenticado"
                />

                <PatternFormat
                  customInput={TextField}
                  format={phoneRespFormat}
                  mask="_"
                  fullWidth
                  label="Telefone do responsável"
                  value={billingDetailsPJ.responsiblePhone || ""}
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
                    const validation = validatePhone(billingDetailsPJ.responsiblePhone || "");
                    setPhoneRespError(validation);
                    
                    const numericPhone = (billingDetailsPJ.responsiblePhone || "").replace(/\D/g, '');
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
                    border: '2px solid #1976d2', 
                    borderRadius: 2, 
                    backgroundColor: '#f3f8ff',
                    borderStyle: 'dashed'
                  }}
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={billingDetailsPJ.paymentByCommitment || false}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          handleBillingDetailsPJChange("paymentByCommitment", checked);
                        }}
                        sx={{
                          '&.Mui-checked': {
                            color: '#1976d2',
                          },
                          transform: 'scale(1.2)',
                        }}
                      />
                    }
                    label={
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 'bold',
                          color: '#1976d2',
                          fontSize: '1.1rem'
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
                      color: '#666',
                      fontStyle: 'italic'
                    }}
                  >
                    Marque esta opção se o pagamento será realizado através de empenho
                  </Typography>
                </Box>
              </Box>
            )}

            {/* IV. Checkbox para registrateMyself */}
            {localLegalEntity === "pf" && (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={localRegistrateMyself}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setLocalRegistrateMyself(checked);
                      setRegistrateMyself(checked);
                    }}
                  />
                }
                label="Desejo me inscrever através desta compra"
              />
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
              minWidth: { xs: "100%", sm: "auto" }
            }
          }}
        >
          {/* Botão Voltar - apenas quando já existe um checkout */}
          {hasExistingCheckout && (
            <Button
              variant="outlined"
              size="large"
              onClick={handleBackToDashboard}
              disabled={loading}
              sx={{ 
                width: { xs: "100%", sm: "auto" },
                minWidth: { sm: "auto" }
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
            disabled={loading || !isFormValid()}
            sx={{ 
              width: { xs: "100%", sm: "auto" },
              flex: { xs: "1 1 100%", sm: 1 },
              minWidth: { sm: "auto" }
            }}
          >
            {loading 
              ? "Processando..." 
              : hasExistingCheckout
                ? "Atualizar dados da compra"
                : "Avançar"
            }
          </Button>
        </Stack>

        {/* Snackbar para notificações */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={() => setSnackbarOpen(false)} 
            severity={snackbarSeverity}
            sx={{ width: '100%' }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Box>
    </Card>
  );
}
