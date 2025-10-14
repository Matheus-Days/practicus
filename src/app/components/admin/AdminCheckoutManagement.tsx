"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  IconButton,
  Alert,
  Snackbar,
  Switch,
  FormControlLabel,
  CircularProgress,
  TextField,
  Divider,
  Chip,
} from "@mui/material";
import {
  ConfirmationNumber as TicketIcon,
  ContentCopy as CopyIcon,
  Download as DownloadIcon,
  Check as CheckIcon,
  Clear as ClearIcon,
} from "@mui/icons-material";
import { useVoucherPDF } from "../../hooks/useVoucherPDF";
import { useVoucherAPI } from "../../hooks/voucherAPI";
import { useAdminContext } from "../../contexts/AdminContext";
import { CheckoutData } from "../../types/checkout";

interface VoucherData {
  id: string;
  active: boolean;
  code: string;
}

export default function AdminCheckoutManagement() {
  const { 
    selectedEvent, 
    eventCheckouts, 
    user, 
    updateComplimentaryTickets,
    loadingComplimentaryUpdate,
    showNotification 
  } = useAdminContext();
  const { generateVoucherPDF, isLoading: pdfLoading } = useVoucherPDF();
  const { changeVoucherActiveStatus, getVoucher } = useVoucherAPI();
  
  const [voucherData, setVoucherData] = useState<VoucherData | null>(null);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    "success" | "error" | "info"
  >("success");
  
  // Estados para edição de cortesias
  const [complimentaryValue, setComplimentaryValue] = useState<number>(0);
  const [isEditingComplimentary, setIsEditingComplimentary] = useState(false);

  // Encontrar o checkout do admin
  const adminCheckout = eventCheckouts.find(checkout => checkout.userId === user.uid);

  const loadVoucherData = useCallback(async () => {
    if (!adminCheckout?.voucher) return;

    try {
      setVoucherLoading(true);
      const voucherInfo = await getVoucher(adminCheckout.voucher);
      setVoucherData({
        id: voucherInfo.id,
        active: voucherInfo.active,
        code: adminCheckout.voucher,
      });
    } catch (error) {
      console.error("Erro ao carregar dados do voucher:", error);
      showNotification("Erro ao carregar dados do voucher", "error");
    } finally {
      setVoucherLoading(false);
    }
  }, [adminCheckout, getVoucher, showNotification]);

  // Carregar dados do voucher quando o checkout do admin mudar
  useEffect(() => {
    if (adminCheckout?.voucher) {
      loadVoucherData();
    } else {
      setVoucherData(null);
    }
  }, [adminCheckout, loadVoucherData]);

  // Sincronizar valor de cortesias quando checkout mudar
  useEffect(() => {
    if (adminCheckout) {
      setComplimentaryValue(adminCheckout.complimentary || 0);
      setIsEditingComplimentary(false);
    }
  }, [adminCheckout]);

  const handleCopyVoucher = async () => {
    if (!voucherData?.code) return;

    try {
      await navigator.clipboard.writeText(voucherData.code);
      setSnackbarMessage("Código do voucher copiado para a área de transferência!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage("Erro ao copiar código do voucher");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleToggleActiveStatus = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newActiveStatus = event.target.checked;

    if (!voucherData?.id) {
      setSnackbarMessage("Dados do voucher não encontrados");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }

    try {
      setVoucherLoading(true);
      await changeVoucherActiveStatus(voucherData.id, newActiveStatus);
      
      setVoucherData(prev => prev ? { ...prev, active: newActiveStatus } : null);
      
      setSnackbarMessage(
        `Voucher ${newActiveStatus ? "ativado" : "desativado"} com sucesso!`
      );
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error) {
      console.error("Erro ao alterar status do voucher:", error);
      setSnackbarMessage("Erro ao alterar status do voucher");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setVoucherLoading(false);
    }
  };

  const handleSharePDF = async () => {
    if (!adminCheckout) {
      setSnackbarMessage("Dados do checkout não encontrados");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }

    try {
      const pdfResult = await generateVoucherPDF(adminCheckout);

      if (!pdfResult) {
        setSnackbarMessage("Erro ao gerar PDF do voucher");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
        return;
      }

      const { blob: pdfBlob, eventName } = pdfResult;
      const fileName = `voucher-${eventName || "evento"}.pdf`;
      downloadPDF(pdfBlob, fileName);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      setSnackbarMessage("Erro ao gerar PDF do voucher");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const downloadPDF = (pdfBlob: Blob, fileName: string) => {
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setSnackbarMessage("PDF do voucher baixado com sucesso!");
    setSnackbarSeverity("success");
    setSnackbarOpen(true);
  };

  // Funções para edição de cortesias
  const handleComplimentaryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value) || 0;
    setComplimentaryValue(value);
    setIsEditingComplimentary(value !== (adminCheckout?.complimentary || 0));
  };

  const handleConfirmComplimentary = async () => {
    if (!adminCheckout?.id || !updateComplimentaryTickets) return;
    
    try {
      await updateComplimentaryTickets(adminCheckout, complimentaryValue);
      
      setIsEditingComplimentary(false);
      setSnackbarMessage("Cortesias atualizadas com sucesso!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (err) {
      console.error("Erro ao atualizar cortesias:", err);
      setSnackbarMessage("Erro ao atualizar cortesias");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleCancelComplimentary = () => {
    setComplimentaryValue(adminCheckout?.complimentary || 0);
    setIsEditingComplimentary(false);
  };

  if (!adminCheckout) {
    return (
      <Card>
        <CardContent>
          <Typography variant="body1" color="textSecondary" textAlign="center">
            Nenhuma aquisição de administrador encontrada para este evento.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom color="primary">
            Gerenciamento de Cortesias do Administrador
          </Typography>
          
          {/* Seção de Cortesias */}
          <Box mb={3}>
            <Typography variant="subtitle1" gutterBottom>
              Quantidade de Cortesias
            </Typography>
            <Box display="flex" alignItems="center" gap={2}>
              <TextField
                type="number"
                value={complimentaryValue}
                onChange={handleComplimentaryChange}
                size="small"
                sx={{ width: 120 }}
                inputProps={{ 
                  min: 0,
                  style: { textAlign: 'center' }
                }}
                disabled={loadingComplimentaryUpdate}
                label="Quantidade"
              />
              <IconButton
                size="small"
                color="primary"
                onClick={handleConfirmComplimentary}
                disabled={!isEditingComplimentary || loadingComplimentaryUpdate}
                sx={{ 
                  bgcolor: 'success.main', 
                  color: 'white',
                  '&:hover': { bgcolor: 'success.dark' },
                  '&:disabled': { bgcolor: 'grey.300', color: 'grey.500' }
                }}
              >
                <CheckIcon />
              </IconButton>
              <IconButton
                size="small"
                color="secondary"
                onClick={handleCancelComplimentary}
                disabled={!isEditingComplimentary || loadingComplimentaryUpdate}
                sx={{ 
                  bgcolor: 'secondary.main', 
                  color: 'white',
                  '&:hover': { bgcolor: 'secondary.dark' },
                  '&:disabled': { bgcolor: 'grey.300', color: 'grey.500' }
                }}
              >
                <ClearIcon />
              </IconButton>
            </Box>
          </Box>

          {/* Seção do Voucher */}
          {adminCheckout.voucher && (
            <>
              <Divider sx={{ my: 3 }} />
              
              <Box mb={3}>
                <Box sx={{ 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  gap: 2, 
                  mb: 2,
                  flexWrap: "wrap"
                }}>
                  <TicketIcon color="primary" />
                  <Typography variant="subtitle1">
                    Código do voucher de cortesias
                  </Typography>
                  
                  {voucherData && (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={voucherData.active}
                          onChange={handleToggleActiveStatus}
                          disabled={voucherLoading}
                        />
                      }
                      label={
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                            {voucherData.active
                              ? "Desativar voucher"
                              : "Ativar voucher"}
                          </Typography>
                          {voucherLoading && <CircularProgress size={16} />}
                        </Box>
                      }
                    />
                  )}
                </Box>

                <Box
                  sx={{
                    backgroundColor: voucherData?.active
                      ? "primary.main"
                      : "warning.main",
                    color: "white",
                    p: 2,
                    borderRadius: 1,
                    textAlign: "center",
                    mb: 2,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 1,
                      flexDirection: { xs: "column", sm: "row" },
                    }}
                  >
                    <Typography
                      variant="h6"
                      component="div"
                      sx={{ 
                        fontFamily: "monospace",
                        fontSize: { xs: "1.1rem", sm: "1.25rem" },
                        wordBreak: "break-all"
                      }}
                    >
                      {voucherData?.code || ""}
                    </Typography>
                    <IconButton
                      onClick={handleCopyVoucher}
                      sx={{ color: "white" }}
                      title="Copiar código do voucher"
                      size="small"
                      disabled={!voucherData?.code}
                    >
                      <CopyIcon />
                    </IconButton>
                  </Box>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      mt: 1, 
                      fontWeight: "bold",
                      fontSize: { xs: "0.75rem", sm: "0.875rem" }
                    }}
                  >
                    Compartilhe este código para que outras pessoas possam se inscrever
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    gap: 2,
                    justifyContent: "center",
                    mb: 2
                  }}
                >
                  <Button
                    variant="contained"
                    startIcon={pdfLoading ? <CircularProgress size={20} /> : <DownloadIcon />}
                    onClick={handleSharePDF}
                    disabled={pdfLoading || !adminCheckout}
                    color="primary"
                    sx={{ minWidth: "200px" }}
                  >
                    {pdfLoading ? "Baixando PDF..." : "Baixar PDF do voucher"}
                  </Button>
                </Box>

              </Box>
            </>
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
