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
} from "@mui/material";
import {
  Receipt as ReceiptIcon,
  ContentCopy as CopyIcon,
} from "@mui/icons-material";

interface VoucherCodeProps {
  voucher: string;
}

export default function VoucherCode({ voucher }: VoucherCodeProps) {
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    "success" | "error" | "info"
  >("success");

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

  return (
    <>
      <Card>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
            <ReceiptIcon color="primary" />
            <Typography variant="h6" component="h3">
              Código do voucher
            </Typography>
          </Box>
          <Box
            sx={{
              backgroundColor: "primary.main",
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