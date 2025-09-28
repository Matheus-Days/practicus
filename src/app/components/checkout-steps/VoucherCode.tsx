"use client";

import { useState } from "react";
import {
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
  Receipt as ReceiptIcon,
  ContentCopy as CopyIcon,
  Share as ShareIcon,
} from "@mui/icons-material";
import { useCheckout } from "../../contexts/CheckoutContext";
import { useVoucherPDF } from "../../hooks/useVoucherPDF";

interface VoucherCodeProps {
  voucher: string;
}

export default function VoucherCode({ voucher }: VoucherCodeProps) {
  const { voucherData, voucherLoading, toggleVoucherActiveStatus, checkout } =
    useCheckout();
  const { generateVoucherPDF, isLoading: pdfLoading } = useVoucherPDF();
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    "success" | "error" | "info"
  >("success");

  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  };

  const handleCopyVoucher = async () => {
    try {
      await navigator.clipboard.writeText(voucher);
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

    try {
      await toggleVoucherActiveStatus(newActiveStatus);
      setSnackbarMessage(
        `Voucher ${newActiveStatus ? "ativado" : "desativado"} com sucesso!`
      );
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage("Erro ao alterar status do voucher");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
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
      const file = new File([pdfBlob], fileName, { type: "application/pdf" });

      if (
        isMobile() &&
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        try {
          await navigator.share({
            title: "Voucher do Evento",
            text: `Compartilhe este voucher para o evento: ${eventName}`,
            files: [file],
          });
          setSnackbarMessage("PDF compartilhado com sucesso!");
          setSnackbarSeverity("success");
          setSnackbarOpen(true);
        } catch (shareError) {
          downloadPDF(pdfBlob, fileName);
        }
      } else {
        downloadPDF(pdfBlob, fileName);
      }
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

  return (
    <>
      <Card>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
              <ReceiptIcon color="primary" />
              <Typography variant="h6" component="h3">
                Código do voucher
              </Typography>
            </Box>
            {voucherData && (
              <Box
                sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}
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
              p: 2,
              borderRadius: 1,
              textAlign: "center",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 1,
              }}
            >
              <Typography
                variant="h5"
                component="div"
                sx={{ fontFamily: "monospace" }}
              >
                {voucher}
              </Typography>
              <IconButton
                onClick={handleCopyVoucher}
                sx={{ color: "white" }}
                title="Copiar código do voucher"
              >
                <CopyIcon />
              </IconButton>
            </Box>
            <Typography variant="body2" sx={{ mt: 1, fontWeight: "bold" }}>
              Compartilhe este código para que outras pessoas possam se
              inscrever
            </Typography>
          </Box>

          <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
            <IconButton
              onClick={handleSharePDF}
              disabled={pdfLoading || !checkout}
              sx={{
                backgroundColor: "primary.main",
                color: "white",
                "&:hover": {
                  backgroundColor: "primary.dark",
                },
                "&:disabled": {
                  backgroundColor: "grey.300",
                  color: "grey.500",
                },
                px: 3,
                py: 1,
                borderRadius: 2,
              }}
              title={
                isMobile()
                  ? "Compartilhar PDF do voucher"
                  : "Baixar PDF do voucher"
              }
            >
              {pdfLoading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <ShareIcon />
              )}
              <Typography variant="body2" sx={{ ml: 1, fontWeight: "bold" }}>
                {pdfLoading
                  ? "Gerando PDF..."
                  : isMobile()
                    ? "Compartilhar"
                    : "Baixar PDF"}
              </Typography>
            </IconButton>
          </Box>
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
