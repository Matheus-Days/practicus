"use client";

import React, { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Box,
  LinearProgress,
  Menu,
  MenuItem,
  ListItemIcon,
  FormControl,
  InputLabel,
  Select,
  Button,
} from "@mui/material";
import {
  MoreVert as MoreVertIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Warning as WarningIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  Receipt as ReceiptIcon,
} from "@mui/icons-material";
import { CircularProgress } from "@mui/material";
import { useAdminContext } from "../../contexts/AdminContext";
import { CheckoutData } from "../../types/checkout";
import {
  CheckoutStatus,
  CommitmentPayment,
} from "../../api/checkouts/checkout.types";
import { calculateTotalPurchasePrice } from "@/lib/checkout-utils";
import CheckoutDetailsDialog from "./CheckoutDetailsDialog";
import Commitment from "../Commitment";
import { useXlsxExport } from "../../hooks/useXlsxExport";
import { formatCheckoutForExport } from "../../utils/export-utils";
import { isPaymentByCommitment } from "../../api/checkouts/utils";

export default function CheckoutsTable() {
  const {
    eventCheckouts,
    loadingCheckouts,
    selectedEvent,
    updateCheckoutStatus,
    updateComplimentaryTickets,
    loadingComplimentaryUpdate,
    loadingCheckoutStatusUpdate,
    user,
  } = useAdminContext();

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [selectedCheckout, setSelectedCheckout] =
    React.useState<CheckoutData | null>(null);
  const [checkoutDialogOpen, setCheckoutDialogOpen] = React.useState(false);
  const [selectedCheckoutForDialog, setSelectedCheckoutForDialog] =
    React.useState<CheckoutData | null>(null);
  const [commitmentDialogOpen, setCommitmentDialogOpen] = React.useState(false);
  const [selectedCheckoutForCommitment, setSelectedCheckoutForCommitment] =
    React.useState<CheckoutData | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("valid");

  const { exportToXlsx, isLoading: isExporting } = useXlsxExport();

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    checkout: CheckoutData
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedCheckout(checkout);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCheckout(null);
  };

  const handleViewCheckoutDetails = (checkout: CheckoutData) => {
    setSelectedCheckoutForDialog(checkout);
    setCheckoutDialogOpen(true);
  };

  const handleCheckoutDialogClose = () => {
    setCheckoutDialogOpen(false);
    setSelectedCheckoutForDialog(null);
  };

  const handleOpenCommitmentDialog = (checkout: CheckoutData) => {
    setSelectedCheckoutForCommitment(checkout);
    setCommitmentDialogOpen(true);
  };

  const handleCommitmentDialogClose = () => {
    setCommitmentDialogOpen(false);
    setSelectedCheckoutForCommitment(null);
  };

  const handleStatusFilterChange = (event: any) => {
    setStatusFilter(event.target.value);
  };

  const handleExportToXlsx = async () => {
    try {
      const exportData = filteredCheckouts.map((checkout) =>
        formatCheckoutForExport(checkout, selectedEvent!)
      );
      let statusDisplay: string;
      switch (statusFilter) {
        case "valid":
          statusDisplay = "Válidas";
          break;
        case "all":
          statusDisplay = "Todas";
          break;
        case "pending":
          statusDisplay = "Pendentes";
          break;
        case "completed":
          statusDisplay = "Concluídas";
          break;
        case "refunded":
          statusDisplay = "Reembolsadas";
          break;
        case "deleted":
          statusDisplay = "Canceladas";
          break;
        default:
          statusDisplay = "Inválidas";
      }
      await exportToXlsx(exportData, {
        filename: `aquisicoes-${statusDisplay}_${selectedEvent?.title || "evento"}_${new Date().toISOString().split("T")[0]}.xlsx`,
        sheetName: `Aquisições - ${statusDisplay}`,
      });
    } catch (error) {
      console.error("Erro ao exportar checkouts:", error);
    }
  };

  // Filtrar checkouts baseado no status selecionado
  const filteredCheckouts = useMemo(() => {
    const checkouts = eventCheckouts.filter(
      (checkout) => checkout.checkoutType === "acquire"
    );
    if (statusFilter === "all") {
      return checkouts;
    }
    if (statusFilter === "valid") {
      return checkouts.filter((checkout) => checkout.status !== "deleted");
    }
    return checkouts.filter((checkout) => checkout.status === statusFilter);
  }, [eventCheckouts, statusFilter]);

  const handleStatusChange = async (status: CheckoutStatus) => {
    if (status === "deleted" || status === "refunded") {
      const confirmed = window.confirm(
        "Ao cancelar uma aquisição, todas as inscrições confirmadas associadas a ela serão invalidadas. Tem certeza que deseja continuar?"
      );
      if (!confirmed) return;
    }
    if (
      status === "pending" &&
      selectedCheckout?.status === "deleted" &&
      !isPaymentByCommitment(selectedCheckout)
    ) {
      const confirmed = window.confirm(
        "Ao reativar uma compra cancelada como pendente, todas as inscrições associadas a ela serão reativadas. Tem certeza que deseja continuar?"
      );
      if (!confirmed) return;
    }
    if (
      status === "pending" &&
      selectedCheckout?.status === "deleted" &&
      isPaymentByCommitment(selectedCheckout)
    ) {
      const confirmed = window.confirm(
        "Ao reativar uma compra por empenho, todas as inscrições associadas a ela se tornarão válidas novamente. Tem certeza que deseja continuar?"
      );
      if (!confirmed) return;
    }
    if (status === "completed" && selectedCheckout?.status === "deleted") {
      const confirmed = window.confirm(
        "Ao reativar uma compra cancelada de marcá-la como concluída, todas as inscrições associadas a ela serão reativadas. Tem certeza que deseja continuar?"
      );
      if (!confirmed) return;
    }
    if (selectedCheckout) {
      await updateCheckoutStatus(selectedCheckout.id, status);
      handleMenuClose();
    }
  };

  const getStatusDisplay = (checkout: CheckoutData) => {
    if (checkout.status === "deleted") {
      return {
        text: "Cancelado",
        color: "error" as const,
        icon: <CancelIcon />,
      };
    }
    if (checkout.status === "refunded") {
      return {
        text: "Reembolsado",
        color: "info" as const,
        icon: <CancelIcon />,
      };
    }
    if (isPaymentByCommitment(checkout)) {
      const payment = (checkout.payment as CommitmentPayment) || undefined;
      if (!payment) {
        return {
          text: "Empenho pendente",
          color: "warning" as const,
          icon: <PendingIcon />,
        };
      }
      if (
        (payment.status === "pending" && payment.commitmentAttachment) ||
        (payment.status === "committed" && payment.paymentAttachment)
      ) {
        return {
          text: "Aguardando validação",
          color: "warning" as const,
          icon: <WarningIcon />,
        };
      }
      if (payment.status === "pending") {
        return {
          text: "Empenho pendente",
          color: "warning" as const,
          icon: <PendingIcon />,
        };
      }
      if (payment.status === "committed") {
        return {
          text: "Empenhado",
          color: "info" as const,
          icon: <CheckCircleIcon />,
        };
      }
      if (payment.status === "paid") {
        return {
          text: "Empenho pago",
          color: "success" as const,
          icon: <CheckCircleIcon />,
        };
      }
    }
    if (checkout.status === "pending") {
      return {
        text: "Pendente",
        color: "warning" as const,
        icon: <PendingIcon />,
      };
    }
    if (checkout.status === "completed") {
      return {
        text: "Concluído",
        color: "success" as const,
        icon: <CheckCircleIcon />,
      };
    }
    return {
      text: "Desconhecido",
      color: "default" as const,
      icon: undefined,
    };
  };

  const formatCurrency = (amountInCents: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(amountInCents / 100);
  };

  const formatDate = (date: any) => {
    if (!date) return "-";
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(dateObj);
  };

  const extractCheckoutPhone = (checkout: CheckoutData): string => {
    if (!checkout.billingDetails) return "Não informado";
    if ("phone" in checkout.billingDetails)
      return checkout.billingDetails.phone;
    if ("responsiblePhone" in checkout.billingDetails)
      return checkout.billingDetails.responsiblePhone;
    return "Não informado";
  };

  const extractCheckoutName = (checkout: CheckoutData): string => {
    const isAdmin = user.uid === checkout.userId;
    if (isAdmin) return "Administrador Practicus";
    if (!checkout.billingDetails) return "Não informado";
    if ("fullName" in checkout.billingDetails)
      return checkout.billingDetails.fullName;
    if ("orgName" in checkout.billingDetails)
      return checkout.billingDetails.orgName;
    return "Não informado";
  };

  const extractLegalEntityLabel = (checkout: CheckoutData): string => {
    const isAdmin = user.uid === checkout.userId;
    if (isAdmin) return "Admin";
    if (!checkout.legalEntity) return "Não informado";
    return checkout.legalEntity === "pf" ? "Física" : "Jurídica";
  };

  const extractLegalEntityColor = (checkout: CheckoutData) => {
    const isAdmin = user.uid === checkout.userId;
    if (isAdmin) return "success";
    if (!checkout.legalEntity) return "default";
    return checkout.legalEntity === "pf" ? "primary" : "secondary";
  };

  if (loadingCheckouts) {
    return (
      <Box sx={{ width: "100%" }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h6">
          Aquisições ({filteredCheckouts.length})
        </Typography>

        <Box display="flex" gap={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="status-filter-label">Situação</InputLabel>
            <Select
              labelId="status-filter-label"
              value={statusFilter}
              label="Situação"
              onChange={handleStatusFilterChange}
            >
              <MenuItem value="valid">Válidas</MenuItem>
              <MenuItem value="all">Todas</MenuItem>
              <MenuItem value="pending">Pendentes</MenuItem>
              <MenuItem value="completed">Concluídas</MenuItem>
              <MenuItem value="refunded">Reembolsadas</MenuItem>
              <MenuItem value="deleted">Canceladas</MenuItem>
            </Select>
          </FormControl>

          <Button
            onClick={handleExportToXlsx}
            disabled={isExporting || filteredCheckouts.length === 0}
            color="primary"
            variant="contained"
            size="small"
            startIcon={
              isExporting ? <CircularProgress size={16} /> : <DownloadIcon />
            }
          >
            {isExporting ? "Exportando..." : "Baixar planilha da tabela atual"}
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold" }}>Pessoa</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Adquirido por</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Telefone</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Valor</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Situação</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Data de criação</TableCell>
              <TableCell sx={{ fontWeight: "bold" }} align="center">
                Ações
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCheckouts.map((checkout) => {
              const statusDisplay = getStatusDisplay(checkout);
              return (
                <TableRow key={checkout.id} hover>
                  <TableCell>
                    <Chip
                      label={extractLegalEntityLabel(checkout)}
                      color={extractLegalEntityColor(checkout)}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {extractCheckoutName(checkout)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {extractCheckoutPhone(checkout)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {checkout.amount
                        ? formatCurrency(
                            calculateTotalPurchasePrice(
                              selectedEvent!,
                              checkout
                            )
                          )
                        : "-"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={statusDisplay.icon}
                      label={statusDisplay.text}
                      color={statusDisplay.color}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(checkout.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Box display="flex" gap={1} justifyContent="flex-end">
                      <Tooltip title="Ver detalhes">
                        <IconButton
                          size="small"
                          onClick={() => handleViewCheckoutDetails(checkout)}
                          color="primary"
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>

                      {isPaymentByCommitment(checkout) &&
                      checkout.status !== "deleted" ? (
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<ReceiptIcon />}
                          onClick={() => handleOpenCommitmentDialog(checkout)}
                          color="secondary"
                          sx={{ minWidth: "auto" }}
                        >
                          Empenho
                        </Button>
                      ) : (
                        <Tooltip title="Mais ações">
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, checkout)}
                          >
                            <MoreVertIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {filteredCheckouts.length === 0 && (
        <Box textAlign="center" py={4}>
          <Typography variant="body1" color="textSecondary">
            {statusFilter === "all"
              ? "Nenhuma aquisição encontrada para este evento."
              : statusFilter === "valid"
                ? "Nenhuma aquisição válida encontrada."
                : `Nenhuma aquisição com situação selecionada foi encontrada.`}
          </Typography>
        </Box>
      )}

      {/* Menu de ações */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {/* Marcar como pago / Cancelar reembolso / Reativar como pago - não mostrar se já for completed */}
        {selectedCheckout &&
          selectedCheckout.status !== "completed" &&
          !isPaymentByCommitment(selectedCheckout) && (
            <MenuItem
              onClick={() => handleStatusChange("completed")}
              disabled={loadingCheckoutStatusUpdate}
            >
              <ListItemIcon>
                {loadingCheckoutStatusUpdate ? (
                  <CircularProgress size={20} />
                ) : (
                  <CheckCircleIcon color="success" />
                )}
              </ListItemIcon>
              {selectedCheckout.status === "refunded"
                ? "Cancelar reembolso"
                : selectedCheckout.status === "deleted"
                  ? "Reativar como pago"
                  : "Marcar como pago"}
            </MenuItem>
          )}

        {/* Reativar aquisição - só mostrar para pagamentos por empenho cancelados */}
        {selectedCheckout?.status === "deleted" &&
          isPaymentByCommitment(selectedCheckout) && (
            <MenuItem
              onClick={() => handleStatusChange("pending")}
              disabled={loadingCheckoutStatusUpdate}
            >
              <ListItemIcon>
                {loadingCheckoutStatusUpdate ? (
                  <CircularProgress size={20} />
                ) : (
                  <CheckCircleIcon color="success" />
                )}
              </ListItemIcon>
              Reativar
            </MenuItem>
          )}

        {/* Marcar como pagamento pendente / Reativar como pendente - ocultar se status for refunded ou pending, ou se for pagamento por empenho */}
        {selectedCheckout &&
          selectedCheckout.status !== "refunded" &&
          selectedCheckout.status !== "pending" &&
          !isPaymentByCommitment(selectedCheckout) && (
            <MenuItem
              onClick={() => handleStatusChange("pending")}
              disabled={loadingCheckoutStatusUpdate}
            >
              <ListItemIcon>
                {loadingCheckoutStatusUpdate ? (
                  <CircularProgress size={20} />
                ) : (
                  <PendingIcon color="warning" />
                )}
              </ListItemIcon>
              {selectedCheckout.status === "deleted"
                ? "Reativar como pendente"
                : "Marcar como pagamento pendente"}
            </MenuItem>
          )}

        {/* Reembolsar - apenas para compras completed */}
        {selectedCheckout?.status === "completed" && (
          <MenuItem
            onClick={() => handleStatusChange("refunded")}
            disabled={loadingCheckoutStatusUpdate}
          >
            <ListItemIcon>
              {loadingCheckoutStatusUpdate ? (
                <CircularProgress size={20} />
              ) : (
                <CancelIcon color="error" />
              )}
            </ListItemIcon>
            Reembolsar compra
          </MenuItem>
        )}

        {/* Cancelar compra - apenas para compras pending */}
        {selectedCheckout?.status === "pending" && (
          <MenuItem
            onClick={() => handleStatusChange("deleted")}
            disabled={loadingCheckoutStatusUpdate}
          >
            <ListItemIcon>
              {loadingCheckoutStatusUpdate ? (
                <CircularProgress size={20} />
              ) : (
                <CancelIcon color="error" />
              )}
            </ListItemIcon>
            Cancelar compra
          </MenuItem>
        )}
      </Menu>

      {/* Dialog de detalhes do checkout */}
      <CheckoutDetailsDialog
        open={checkoutDialogOpen}
        onClose={handleCheckoutDialogClose}
        checkoutData={selectedCheckoutForDialog || undefined}
        eventData={selectedEvent || undefined}
        onUpdateComplimentaryTickets={updateComplimentaryTickets}
        loadingComplimentaryUpdate={loadingComplimentaryUpdate}
      />

      {/* Dialog de gerenciamento de empenho */}
      {selectedCheckoutForCommitment && (
        <Commitment
          checkout={
            eventCheckouts.find(
              (c) => c.id === selectedCheckoutForCommitment.id
            ) || selectedCheckoutForCommitment
          }
          eventId={selectedEvent?.id || ""}
          isAdmin={true}
          open={commitmentDialogOpen}
          onClose={handleCommitmentDialogClose}
        />
      )}
    </Box>
  );
}
