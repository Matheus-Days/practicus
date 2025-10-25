"use client";

import { useState, useEffect, useRef } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Alert,
  CircularProgress,
  Divider,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  AccountBalance as AccountBalanceIcon,
  AttachFile as AttachFileIcon,
  Close as CloseIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";
import { CommitmentPayment } from "../api/checkouts/checkout.types";
import { calculateTotalPurchasePrice } from "../../lib/checkout-utils";
import { EventData } from "../types/events";
import { useFirebase } from "../hooks/firebase";
import { doc, getDoc } from "firebase/firestore";
import { ref, getDownloadURL } from "firebase/storage";
import { useCommitmentAPI } from "../hooks/commitmentAPI";
import { CheckoutData } from "../types/checkout";

interface CommitmentProps {
  checkout: CheckoutData;
  eventId: string;
  isAdmin?: boolean;
  open: boolean;
  onClose: () => void;
}

export default function Commitment({
  checkout,
  eventId,
  isAdmin,
  open,
  onClose,
}: CommitmentProps) {
  const { firestore, storage } = useFirebase();
  const {
    sendCommitmentReceipt,
    sendPaymentReceipt,
    deleteCommitmentAttachment,
    updateCommitmentStatus,
  } = useCommitmentAPI();

  const [commitmentData, setCommitmentData] = useState<CommitmentPayment>({
    method: "empenho",
    status: "pending",
    value: 0,
    commitmentAttachment: undefined,
    paymentAttachment: undefined,
  });

  const [eventData, setEventData] = useState<EventData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [commitmentAttachmentUrl, setCommitmentAttachmentUrl] =
    useState<string>("");
  const [paymentAttachmentUrl, setPaymentAttachmentUrl] = useState<string>("");

  // Referências para os inputs de arquivo
  const commitmentFileInputRef = useRef<HTMLInputElement>(null);
  const paymentFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadEventData = async () => {
      if (eventId) {
        const eventRef = doc(firestore, "events", eventId);
        const eventDoc = await getDoc(eventRef);
        if (eventDoc.exists()) {
          setEventData({
            id: eventDoc.id,
            ...eventDoc.data(),
          } as EventData);
        }
      }
    };
    loadEventData();
  }, [eventId, firestore]);

  useEffect(() => {
    if (checkout?.payment && checkout.payment.method === "empenho") {
      setCommitmentData(checkout.payment as CommitmentPayment);
    }
  }, [checkout]);

  // useEffect para gerar URL de download do anexo de empenho
  useEffect(() => {
    const generateCommitmentDownloadUrl = async () => {
      if (commitmentData.commitmentAttachment?.storagePath) {
        try {
          const fileRef = ref(
            storage,
            commitmentData.commitmentAttachment.storagePath
          );
          const downloadURL = await getDownloadURL(fileRef);
          setCommitmentAttachmentUrl(downloadURL);
        } catch (error) {
          console.error(
            "Erro ao gerar URL de download do anexo de empenho:",
            error
          );
          setCommitmentAttachmentUrl("");
        }
      } else {
        setCommitmentAttachmentUrl("");
      }
    };

    generateCommitmentDownloadUrl();
  }, [commitmentData.commitmentAttachment, storage]);

  // useEffect para gerar URL de download do anexo de pagamento
  useEffect(() => {
    const generatePaymentDownloadUrl = async () => {
      if (commitmentData.paymentAttachment?.storagePath) {
        try {
          const fileRef = ref(
            storage,
            commitmentData.paymentAttachment.storagePath
          );
          const downloadURL = await getDownloadURL(fileRef);
          setPaymentAttachmentUrl(downloadURL);
        } catch (error) {
          console.error(
            "Erro ao gerar URL de download do anexo de pagamento:",
            error
          );
          setPaymentAttachmentUrl("");
        }
      } else {
        setPaymentAttachmentUrl("");
      }
    };

    generatePaymentDownloadUrl();
  }, [commitmentData.paymentAttachment, storage]);

  const calculateCommitmentValue = () => {
    if (commitmentData.value > 0) {
      return commitmentData.value;
    }

    if (checkout && eventData) {
      return calculateTotalPurchasePrice(eventData, checkout);
    }

    return 0;
  };

  const handleFileUpload = async (
    field: "commitmentAttachment" | "paymentAttachment",
    file: File
  ) => {
    if (!checkout) throw new Error("Missing checkout for handleFileUpload");
    try {
      setError(null);

      setIsLoading(true);

      if (field === "commitmentAttachment") {
        await sendCommitmentReceipt({ checkout, file });
      } else {
        await sendPaymentReceipt({ checkout, file });
      }

      setSuccess(
        `Arquivo ${field === "commitmentAttachment" ? "de empenho" : "de pagamento"} enviado com sucesso!`
      );
    } catch (error) {
      console.error(`Erro ao fazer upload do arquivo ${field}:`, error);
      setError(`Erro ao fazer upload do arquivo. Tente novamente.`);

      // Limpar o input de arquivo correspondente quando houver erro
      if (field === "commitmentAttachment" && commitmentFileInputRef.current) {
        commitmentFileInputRef.current.value = "";
      } else if (field === "paymentAttachment" && paymentFileInputRef.current) {
        paymentFileInputRef.current.value = "";
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAttachment = async (
    field: "commitmentAttachment" | "paymentAttachment"
  ) => {
    if (!checkout)
      throw new Error("Missing checkout for handleDeleteAttachment");
    setIsDeleting(true);
    setError(null);
    setSuccess(null);
    const attachmentType =
      field === "commitmentAttachment" ? "commitment" : "payment";

    try {
      await deleteCommitmentAttachment(checkout.id, { attachmentType });
      setCommitmentData((prev) => ({
        ...prev,
        [field]: undefined,
      }));
      setSuccess(
        `Anexo ${field === "commitmentAttachment" ? "de empenho" : "de pagamento"} removido com sucesso!`
      );
    } catch (error) {
      console.error(`Erro ao deletar o anexo ${field}:`, error);
      setError(`Erro ao deletar o anexo. Tente novamente.`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePaymentStatusChange = async (
    newStatus: CommitmentPayment["status"]
  ) => {
    if (!checkout)
      throw new Error("Missing checkout for handlePaymentStatusChange");

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await updateCommitmentStatus(checkout.id, { status: newStatus });

      let statusLabel = "";
      switch (newStatus) {
        case "pending":
          statusLabel = "pendente";
          break;
        case "committed":
          statusLabel = "empenhado";
          break;
        case "paid":
          statusLabel = "pago";
          break;
      }
      setSuccess(
        `Situação do empenho atualizada para ${statusLabel} com sucesso!`
      );
    } catch (error) {
      console.error(`Erro ao atualizar status para ${newStatus}:`, error);
      setError(`Erro ao atualizar situação do empenho. Tente novamente.`);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusLabel = (status: CommitmentPayment["status"]) => {
    switch (status) {
      case "pending":
        return "Pendente";
      case "committed":
        return "Empenhado";
      case "paid":
        return "Pago";
      default:
        return status;
    }
  };

  const getStatusColor = (status: CommitmentPayment["status"]) => {
    switch (status) {
      case "pending":
        return "warning";
      case "committed":
        return "info";
      case "paid":
        return "success";
      default:
        return "default";
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown={isLoading}
      fullScreen={false}
    >
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <AccountBalanceIcon color="primary" />
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontSize: { xs: "1.25rem", sm: "1.75rem" },
            }}
          >
            Gerenciar Empenho
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          )}

          <Card sx={{ boxShadow: 0 }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" gutterBottom>
                Dados do Empenho
              </Typography>

              <Stack spacing={3}>
                {/* Status e Valor do Empenho - Na mesma linha */}
                <Box
                  sx={{
                    display: "flex",
                    gap: 2,
                    flexDirection: { xs: "column", sm: "row" },
                  }}
                >
                  {/* Status Atual */}
                  <Box
                    sx={{
                      flex: 1,
                      p: 1,
                      bgcolor: "grey.50",
                      borderRadius: 2,
                      border: 1,
                      borderColor: "grey.200",
                      textAlign: "center",
                    }}
                  >
                    <Typography variant="h6" gutterBottom>
                      Situação do Empenho
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 1,
                      }}
                    >
                      <Box
                        sx={{
                          width: 16,
                          height: 16,
                          borderRadius: "50%",
                          bgcolor: `${getStatusColor(commitmentData.status)}.main`,
                        }}
                      />
                      <Typography
                        variant="h5"
                        color={`${getStatusColor(commitmentData.status)}.main`}
                      >
                        {getStatusLabel(commitmentData.status)}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Valor do Empenho */}
                  <Box
                    sx={{
                      flex: 1,
                      p: 1,
                      bgcolor: "primary.50",
                      borderRadius: 2,
                      border: 1,
                      borderColor: "primary.200",
                      textAlign: "center",
                    }}
                  >
                    <Typography variant="h6" gutterBottom>
                      Valor do Empenho
                    </Typography>
                    <Typography
                      variant="h5"
                      color="primary.main"
                      fontWeight="bold"
                    >
                      R${" "}
                      {(calculateCommitmentValue() / 100).toLocaleString(
                        "pt-BR",
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }
                      )}
                    </Typography>
                  </Box>
                </Box>

                <Divider />

                {/* Anexos */}
                <Typography variant="h6" gutterBottom>
                  Anexos
                </Typography>

                {/* Anexo do Empenho */}
                <Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 1,
                    }}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                      Recibo de empenho
                    </Typography>
                    {commitmentData.status !== "pending" && (
                      <Tooltip title="Recibo de empenho validado pela Practicus">
                        <CheckCircleIcon color="success" />
                      </Tooltip>
                    )}
                  </Box>
                  {commitmentData.commitmentAttachment ? (
                    <Box sx={{ mb: 2 }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mb: 1,
                        }}
                      >
                        <AttachFileIcon color="primary" />
                        <Typography variant="body2" color="primary">
                          {commitmentData.commitmentAttachment.fileName}
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        {commitmentAttachmentUrl && (
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<DownloadIcon />}
                            component="a"
                            href={commitmentAttachmentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Download
                          </Button>
                        )}
                        {isAdmin &&
                          commitmentAttachmentUrl &&
                          commitmentData.status === "pending" && (
                            <Button
                              variant="contained"
                              size="small"
                              color="success"
                              disabled={isLoading || isDeleting}
                              onClick={() =>
                                handlePaymentStatusChange("committed")
                              }
                            >
                              Validar empenho
                            </Button>
                          )}
                        {isAdmin &&
                          commitmentAttachmentUrl &&
                          commitmentData.status === "committed" && (
                            <Button
                              variant="contained"
                              size="small"
                              color="error"
                              disabled={isLoading || isDeleting}
                              onClick={() =>
                                handlePaymentStatusChange("pending")
                              }
                            >
                              Invalidar empenho
                            </Button>
                          )}
                        {commitmentData.status === "pending" && (
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              startIcon={<DeleteIcon />}
                              disabled={isDeleting}
                              onClick={() =>
                                handleDeleteAttachment("commitmentAttachment")
                              }
                            >
                              Deletar
                            </Button>
                            {isDeleting && <CircularProgress size={20} />}
                          </Box>
                        )}
                      </Box>
                    </Box>
                  ) : (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
                      Nenhum arquivo anexado
                    </Typography>
                  )}

                  {commitmentData.status === "pending" &&
                    !commitmentData.commitmentAttachment && (
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mt: 1,
                        }}
                      >
                        <Button
                          variant="outlined"
                          component="label"
                          startIcon={<AttachFileIcon />}
                          size="small"
                          disabled={isLoading}
                        >
                          Anexar recibo
                          <input
                            ref={commitmentFileInputRef}
                            type="file"
                            hidden
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleFileUpload("commitmentAttachment", file);
                              }
                            }}
                          />
                        </Button>
                        {isLoading && <CircularProgress size={24} />}
                      </Box>
                    )}
                </Box>

                {/* Anexo do Pagamento - Só aparece se o status for committed */}
                {(commitmentData.status !== "pending" ||
                  !!commitmentData.paymentAttachment) && (
                  <Box>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 1,
                      }}
                    >
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: "bold" }}
                      >
                        Comprovante de pagamento
                      </Typography>
                      {commitmentData.status === "paid" && (
                        <Tooltip title="Comprovante de pagamento validado pela Practicus">
                          <CheckCircleIcon color="success" />
                        </Tooltip>
                      )}
                    </Box>
                    {commitmentData.paymentAttachment ? (
                      <Box sx={{ mb: 2 }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mb: 1,
                          }}
                        >
                          <AttachFileIcon color="primary" />
                          <Typography variant="body2" color="primary">
                            {commitmentData.paymentAttachment.fileName}
                          </Typography>
                        </Box>
                        <Box sx={{ display: "flex", gap: 1 }}>
                          {paymentAttachmentUrl && (
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<DownloadIcon />}
                              component="a"
                              href={paymentAttachmentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Download
                            </Button>
                          )}
                          {isAdmin &&
                            paymentAttachmentUrl &&
                            commitmentData.status === "committed" && (
                              <Button
                                variant="contained"
                                size="small"
                                color="success"
                                disabled={isLoading || isDeleting}
                                onClick={() =>
                                  handlePaymentStatusChange("paid")
                                }
                              >
                                Validar pagamento
                              </Button>
                            )}
                          {isAdmin &&
                            paymentAttachmentUrl &&
                            commitmentData.status === "paid" && (
                              <Button
                                variant="contained"
                                size="small"
                                color="error"
                                disabled={isLoading || isDeleting}
                                onClick={() =>
                                  handlePaymentStatusChange("committed")
                                }
                              >
                                Invalidar pagamento
                              </Button>
                            )}
                          {commitmentData.status !== "paid" && (
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                startIcon={<DeleteIcon />}
                                disabled={isDeleting}
                                onClick={() =>
                                  handleDeleteAttachment("paymentAttachment")
                                }
                              >
                                Deletar
                              </Button>
                              {isDeleting && <CircularProgress size={20} />}
                            </Box>
                          )}
                        </Box>
                      </Box>
                    ) : (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1 }}
                      >
                        Nenhum arquivo anexado
                      </Typography>
                    )}

                    {commitmentData.status === "committed" &&
                      !commitmentData.paymentAttachment && (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mt: 1,
                          }}
                        >
                          <Button
                            variant="outlined"
                            component="label"
                            startIcon={<AttachFileIcon />}
                            size="small"
                            disabled={isLoading}
                          >
                            Anexar Comprovante
                            <input
                              ref={paymentFileInputRef}
                              type="file"
                              hidden
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleFileUpload("paymentAttachment", file);
                                }
                              }}
                            />
                          </Button>
                          {isLoading && <CircularProgress size={24} />}
                        </Box>
                      )}
                  </Box>
                )}

                <Divider />
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button
          variant="outlined"
          startIcon={<CloseIcon />}
          onClick={onClose}
          disabled={isLoading}
        >
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
