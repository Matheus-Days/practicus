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
} from "@mui/material";
import { useCheckout } from "../../contexts/CheckoutContext";
import {
  BillingDetailsPF,
  BillingDetailsPJ,
  LegalEntity,
} from "../../api/checkouts/checkout.types";

interface BillingDetailsProps {
  onComplete?: () => void;
}

export default function BillingDetails({
  onComplete,
}: BillingDetailsProps) {
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
  } = useCheckout();

  // Estado para controlar o snackbar
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");

  // Estados para pessoa física
  const [billingDetailsPF, setBillingDetailsPF] = useState<BillingDetailsPF>({
    email: user?.email || "",
    fullName: "",
    phone: "",
  });

  // Estados para pessoa jurídica
  const [billingDetailsPJ, setBillingDetailsPJ] = useState<BillingDetailsPJ>({
    orgPhone: "",
    orgName: "",
    orgCnpj: "",
    orgAddress: "",
    orgZip: "",
    responsibleName: "",
    responsiblePhone: "",
    responsibleEmail: user?.email || "",
  });

  // Estados locais para controlar valores dos inputs
  const [localRegistrationsAmount, setLocalRegistrationsAmount] = useState(registrationsAmount || 1);
  const [localLegalEntity, setLocalLegalEntity] = useState<LegalEntity | null>(legalEntity);
  const [localRegistrateMyself, setLocalRegistrateMyself] = useState(registrateMyself || false);

  // Atualizar emails quando o usuário mudar
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
      });
    }
  }, [legalEntity, billingDetails]);

  // Garantir que os campos sempre tenham valores definidos quando trocar de tipo
  useEffect(() => {
    if (localLegalEntity === "pf") {
      // Limpar campos PJ quando trocar para PF
      setBillingDetailsPJ({
        orgPhone: "",
        orgName: "",
        orgCnpj: "",
        orgAddress: "",
        orgZip: "",
        responsibleName: "",
        responsiblePhone: "",
        responsibleEmail: user?.email || "",
      });
    } else if (localLegalEntity === "pj") {
      // Limpar campos PF quando trocar para PJ
      setBillingDetailsPF({
        email: user?.email || "",
        fullName: "",
        phone: "",
      });
    }
  }, [localLegalEntity, user?.email]);

  // Sincronizar estados locais com o contexto
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
    value: string
  ) => {
    const updated = { ...billingDetailsPJ, [field]: value || "" };
    setBillingDetailsPJ(updated);
    setBillingDetails(updated);
  };

  const handleCreateCheckout = async () => {
    try {
      setCheckoutType("acquire");
      
      // Verifica se já existe um checkout para este evento
      const hasExistingCheckout = checkout && checkout.status !== 'deleted';
      
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
      } else {
        // Cria novo checkout
        await createCheckout();
      }
      
      onComplete?.();
    } catch (error) {
      console.error("Erro ao processar checkout:", error);
      
      // Mostra snackbar de erro
      setSnackbarMessage("Erro ao processar checkout. Tente novamente.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const isFormValid = (): boolean => {
    if (localLegalEntity === "pf") {
      return Boolean(
        billingDetailsPF.email?.trim() &&
        billingDetailsPF.fullName?.trim() &&
        billingDetailsPF.phone?.trim()
      );
    } else if (localLegalEntity === "pj") {
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
    <Box
      sx={{ display: "flex", flexDirection: "column", gap: 3, maxWidth: 600 }}
    >
      <Typography variant="h5" component="h2" gutterBottom>
        Informações da compra
      </Typography>

      {/* I. Campo de quantidade de inscrições */}
      <TextField
        fullWidth
        label="Quantidade de Inscrições"
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
        <InputLabel>Tipo de Pessoa</InputLabel>
        <Select
          value={localLegalEntity || ""}
          label="Tipo de Pessoa"
          size="medium"
          onChange={(e) => {
            const value = e.target.value as LegalEntity;
            setLocalLegalEntity(value);
            setLegalEntity(value);
          }}
        >
          <MenuItem value="pf">Pessoa Física</MenuItem>
          <MenuItem value="pj">Pessoa Jurídica</MenuItem>
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
            Os dados informado serão usados para a emissão do recibo de pagamento.
          </Typography>

          {localLegalEntity === "pf" ? (
            // Campos para Pessoa Física
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                fullWidth
                label="Nome Completo"
                value={billingDetailsPF.fullName || ""}
                onChange={(e) =>
                  handleBillingDetailsPFChange("fullName", e.target.value)
                }
                variant="outlined"
                size="medium"
                required
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

              <TextField
                fullWidth
                label="Telefone"
                value={billingDetailsPF.phone || ""}
                onChange={(e) =>
                  handleBillingDetailsPFChange("phone", e.target.value)
                }
                variant="outlined"
                size="medium"
                required
                helperText="Apenas números"
              />
            </Box>
          ) : (
            // Campos para Pessoa Jurídica
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                fullWidth
                label="Nome da Organização"
                value={billingDetailsPJ.orgName || ""}
                onChange={(e) =>
                  handleBillingDetailsPJChange("orgName", e.target.value)
                }
                variant="outlined"
                size="medium"
                required
              />

              <TextField
                fullWidth
                label="CNPJ"
                value={billingDetailsPJ.orgCnpj || ""}
                onChange={(e) =>
                  handleBillingDetailsPJChange("orgCnpj", e.target.value)
                }
                variant="outlined"
                size="medium"
                required
                helperText="Apenas números"
              />

              <TextField
                fullWidth
                label="Telefone da Organização"
                value={billingDetailsPJ.orgPhone || ""}
                onChange={(e) =>
                  handleBillingDetailsPJChange("orgPhone", e.target.value)
                }
                variant="outlined"
                size="medium"
                required
                helperText="Apenas números"
              />

              <TextField
                fullWidth
                label="Endereço da Organização"
                value={billingDetailsPJ.orgAddress || ""}
                onChange={(e) =>
                  handleBillingDetailsPJChange("orgAddress", e.target.value)
                }
                variant="outlined"
                size="medium"
                required
                multiline
                rows={2}
              />

              <TextField
                fullWidth
                label="CEP"
                value={billingDetailsPJ.orgZip || ""}
                onChange={(e) =>
                  handleBillingDetailsPJChange("orgZip", e.target.value)
                }
                variant="outlined"
                size="medium"
                required
                helperText="Apenas números"
              />

              <Divider />
              <Typography variant="subtitle1" gutterBottom>
                Dados do Responsável
              </Typography>

              <TextField
                fullWidth
                label="Nome do Responsável"
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
              />

              <TextField
                fullWidth
                label="Email do Responsável"
                type="email"
                value={billingDetailsPJ.responsibleEmail || user?.email || ""}
                disabled
                variant="outlined"
                size="medium"
                required
                helperText="Email do usuário autenticado"
              />

              <TextField
                fullWidth
                label="Telefone do Responsável"
                value={billingDetailsPJ.responsiblePhone || ""}
                onChange={(e) =>
                  handleBillingDetailsPJChange(
                    "responsiblePhone",
                    e.target.value
                  )
                }
                variant="outlined"
                size="medium"
                required
                helperText="Apenas números"
              />
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
              label="Esta inscrição é para mim"
            />
          )}
        </>
      )}

      {/* Botão para criar/atualizar checkout */}
      <Button
        variant="contained"
        size="large"
        onClick={handleCreateCheckout}
        disabled={loading || !isFormValid()}
        sx={{ mt: 2 }}
      >
        {loading 
          ? "Processando..." 
          : checkout && checkout.status !== 'deleted'
            ? "Atualizar dados da compra"
            : "Avançar"
        }
      </Button>

      {/* Snackbar para notificações */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
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
  );
}
