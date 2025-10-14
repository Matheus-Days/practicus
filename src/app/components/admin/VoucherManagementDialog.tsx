"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Alert,
  Snackbar,
  Switch,
  FormControlLabel,
  CircularProgress,
} from "@mui/material";
import {
  ConfirmationNumber as TicketIcon,
  ContentCopy as CopyIcon,
  Close as CloseIcon,
  Download as DownloadIcon,
} from "@mui/icons-material";
import { useVoucherPDF } from "../../hooks/useVoucherPDF";
import { useVoucherAPI } from "../../hooks/voucherAPI";
import { useAdminContext } from "../../contexts/AdminContext";
import { CheckoutData } from "../../types/checkout";

interface VoucherManagementDialogProps {
  open: boolean;
  onClose: () => void;
  checkout: CheckoutData | null;
}

interface VoucherData {
  id: string;
  active: boolean;
  code: string;
}

export default function VoucherManagementDialog({
  open,
  onClose,
  checkout,
}: VoucherManagementDialogProps) {
  const { showNotification } = useAdminContext();
  const { generateVoucherPDF, isLoading: pdfLoading } = useVoucherPDF();
  const { changeVoucherActiveStatus, getVoucher } = useVoucherAPI();
  
  const [voucherData, setVoucherData] = useState<VoucherData | null>(null);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    "success" | "error" | "info"
  >("success");

  const loadVoucherData = useCallback(async () => {
    if (!checkout?.voucher) return;

    try {
      setVoucherLoading(true);
      // Buscar dados do voucher pela API
      const voucherInfo = await getVoucher(checkout.voucher);
      setVoucherData({
        id: voucherInfo.id,
        active: voucherInfo.active,
        code: checkout.voucher,
      });
    } catch (error) {
      console.error("Erro ao carregar dados do voucher:", error);
      showNotification("Erro ao carregar dados do voucher", "error");
    } finally {
      setVoucherLoading(false);
    }
  }, [checkout, getVoucher, showNotification]);

  // Carregar dados do voucher quando o dialog abrir
  useEffect(() => {
    if (open && checkout?.voucher) {
      loadVoucherData();
    }
  }, [open, checkout, loadVoucherData]);

  const handleCopyVoucher = async () => {
    if (!voucherData?.code) return;

    try {
      await navigator.clipboard.writeText(voucherData.code);
      setSnackbarMessage(
        "Código do voucher copiado para a área de transferência!"
      );
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
      // Chamar a API para alterar o status do voucher
      await changeVoucherActiveStatus(voucherData.id, newActiveStatus);
      
      // Atualizar estado local
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
    if (!checkout) {
      setSnackbarMessage("Dados do checkout não encontrados");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }

    try {
      const pdfResult = await generateVoucherPDF(checkout);

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

  if (!checkout?.voucher) {
    return null;
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { minHeight: "400px" }
        }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <TicketIcon color="primary" />
          <Typography variant="h6" component="h2">
            Gerenciar cortesias
          </Typography>
        </DialogTitle>

        <DialogContent>
          <Card sx={{ width: "100%", maxWidth: "100%", overflow: "hidden" }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 }, overflow: "hidden" }}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  justifyContent: "space-between",
                  alignItems: { xs: "flex-start", sm: "center" },
                  gap: { xs: 2, sm: 0 },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: { xs: 0, sm: 2 } }}>
                  <TicketIcon color="primary" />
                  <Typography variant="h6" component="h3">
                    Código do voucher de cortesias do administrador
                  </Typography>
                </Box>
                {voucherData && (
                  <Box
                    sx={{ 
                      mb: { xs: 2, sm: 2 }, 
                      display: "flex", 
                      alignItems: "center", 
                      gap: 1,
                      width: { xs: "100%", sm: "auto" }
                    }}
                  >
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
                  </Box>
                )}
              </Box>

              <Box
                sx={{
                  backgroundColor: voucherData?.active
                    ? "primary.main"
                    : "warning.main",
                  color: "white",
                  p: { xs: 2, sm: 3 },
                  borderRadius: 1,
                  textAlign: "center",
                  mb: 3,
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
                    variant="h5"
                    component="div"
                    sx={{ 
                      fontFamily: "monospace",
                      fontSize: { xs: "1.25rem", sm: "1.5rem" },
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
                  Compartilhe este código para que outras pessoas possam se
                  inscrever
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  gap: 2,
                  justifyContent: "center",
                }}
              >
                <Button
                  variant="contained"
                  startIcon={pdfLoading ? <CircularProgress size={20} /> : <DownloadIcon />}
                  onClick={handleSharePDF}
                  disabled={pdfLoading || !checkout}
                  color="primary"
                  sx={{ minWidth: "200px" }}
                >
                  {pdfLoading ? "Baixando PDF..." : "Baixar PDF do voucher"}
                </Button>
              </Box>

              {voucherData && (
                <Box sx={{ mt: 3, p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Status do voucher:
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: "bold",
                      color: voucherData.active ? "success.main" : "error.main",
                    }}
                  >
                    {voucherData.active ? "Ativo" : "Inativo"}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} startIcon={<CloseIcon />}>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>

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
