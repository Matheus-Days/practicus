"use client";

import React, { ReactElement, useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
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
  Cancel as CancelIcon,
  Block as BlockIcon,
  Pending as PendingIcon,
  ShoppingCart as ShoppingCartIcon,
  Download as DownloadIcon,
} from "@mui/icons-material";
import { CircularProgress } from "@mui/material";
import { useAdminContext } from "../../contexts/AdminContext";
import { RegistrationData } from "../../hooks/registrationAPI";
import { RegistrationStatus } from "../../api/registrations/registration.types";
import CheckoutDetailsDialog from "./CheckoutDetailsDialog";
import { useXlsxExport } from "../../hooks/useXlsxExport";
import { formatRegistrationForExport, formatOrganizationName } from "../../utils/export-utils";
import { CheckoutData } from "../../types/checkout";
import { useRegistrationPDF } from "../../hooks/useRegistrationPDF";

export type RegistrationType = "commom" | "commitment" | "complimentary";

export default function RegistrationsTable() {
  const {
    eventRegistrations,
    eventCheckouts,
    loadingRegistrations,
    updateRegistrationStatus,
    selectedEvent,
    loadingRegistrationStatusUpdate,
    showNotification,
    updateComplimentaryTickets,
    loadingComplimentaryUpdate,
    updateTotalValue,
    loadingTotalValueUpdate,
  } = useAdminContext();

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [selectedRegistration, setSelectedRegistration] =
    React.useState<RegistrationData | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("valid");
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
  const [selectedCheckout, setSelectedCheckout] = useState<CheckoutData | null>(
    null
  );
  const [orderBy, setOrderBy] = useState<string>("");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [generatingPDFFor, setGeneratingPDFFor] = useState<string | null>(null);

  const { generateRegistrationPDF } = useRegistrationPDF();

  const registrations = useMemo(() => {
    return eventRegistrations.map((registration) => {
      const regCheckout = eventCheckouts.find(
        (checkout) => checkout.id === registration.checkoutId
      );

      let registrationType: RegistrationType;
      if (regCheckout?.checkoutType === "admin")
        registrationType = "complimentary";
      else if (regCheckout && regCheckout.payment.method === "empenho")
        registrationType = "commitment";
      else registrationType = "commom";

      return {
        ...registration,
        checkout: regCheckout,
        registrationType,
      };
    });
  }, [eventRegistrations, eventCheckouts]);

  const { exportToXlsx, isLoading: isExporting } = useXlsxExport();

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    registration: RegistrationData
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedRegistration(registration);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRegistration(null);
  };

  const handleStatusChange = async (status: RegistrationStatus) => {
    if (selectedRegistration && !loadingRegistrationStatusUpdate) {
      handleMenuClose();
      await updateRegistrationStatus(selectedRegistration.id, status);
    }
  };

  const handleActivateRegistration = async () => {
    if (!selectedRegistration) return;

    // Buscar o checkout associado à inscrição
    const checkout = eventCheckouts.find(
      (c) => c.id === selectedRegistration.checkoutId
    );

    if (!checkout) {
      return;
    }

    // Determinar o novo status baseado no status do checkout
    const newStatus: RegistrationStatus =
      checkout.status === "pending" ? "pending" : "ok";

    await handleStatusChange(newStatus);
  };

  const handleCancelRegistration = async () => {
    await handleStatusChange("cancelled");
  };

  // Função para verificar se o botão "Ativar inscrição" deve estar habilitado
  const canActivateRegistration = (registration: RegistrationData) => {
    const checkout = eventCheckouts.find(
      (c) => c.id === registration.checkoutId
    );

    if (!checkout) return false;

    // Não pode ativar se o checkout for refunded
    if (checkout.status === "refunded") {
      return false;
    }

    // Não pode ativar se a inscrição já estiver pending ou ok
    if (registration.status === "pending" || registration.status === "ok") {
      return false;
    }

    return true;
  };

  // Função para verificar se o botão "Desativar inscrição" deve estar habilitado
  const canCancelRegistration = (registration: RegistrationData) => {
    const checkout = eventCheckouts.find(
      (c) => c.id === registration.checkoutId
    );

    // Não pode desativar se a inscrição já estiver cancelada
    if (registration.status === "cancelled") {
      return false;
    }

    // Não pode desativar se o checkout for refunded
    if (
      checkout &&
      checkout.status === "refunded"
    ) {
      return false;
    }

    return true;
  };

  const handleStatusFilterChange = (event: any) => {
    setStatusFilter(event.target.value);
  };

  const handleExportToXlsx = async () => {
    if (!selectedEvent) throw new Error("Nenhum evento selecionado.");
    try {
      const exportData = filteredRegistrations.map((registration) =>
        formatRegistrationForExport(registration, selectedEvent)
      );
      let statusDisplay: string;
      switch (statusFilter) {
        case "valid":
          statusDisplay = "Válidas";
          break;
        case "all":
          statusDisplay = "Todas";
          break;
        case "ok":
          statusDisplay = "Confirmadas";
          break;
        case "cancelled":
          statusDisplay = "Canceladas";
          break;
        case "pending":
          statusDisplay = "Pendentes";
          break;
        default:
          statusDisplay = "Inválidas";
      }
      await exportToXlsx(exportData, {
        filename: `inscricoes-${statusDisplay}_${selectedEvent?.title || "evento"}_${new Date().toISOString().split("T")[0]}.xlsx`,
        sheetName: `Inscrições - ${statusDisplay}`,
      });
    } catch (error) {
      console.error("Erro ao exportar inscrições:", error);
    }
  };

  const handleViewCheckout = (checkout: CheckoutData) => {
    setSelectedCheckout(checkout);
    setCheckoutDialogOpen(true);
  };

  const handleCheckoutDialogClose = () => {
    setCheckoutDialogOpen(false);
    setSelectedCheckout(null);
  };

  const handleGenerateRegistrationPDF = async (registration: RegistrationData) => {
    if (!selectedEvent?.id) {
      showNotification("Nenhum evento selecionado", "error");
      return;
    }

    try {
      setGeneratingPDFFor(registration.id);
      const result = await generateRegistrationPDF(registration, selectedEvent.id);

      if (!result) {
        throw new Error("Erro ao gerar PDF");
      }

      const { blob, eventName } = result;
      const fileName = `Comprovante_${eventName.replace(/[^a-zA-Z0-9]/g, "_")}_${registration.fullName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showNotification("Comprovante de inscrição gerado com sucesso!", "success");
    } catch (error) {
      console.error("Erro ao gerar PDF do comprovante:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao gerar PDF do comprovante";
      showNotification(errorMessage, "error");
    } finally {
      setGeneratingPDFFor(null);
    }
  };

  const handleRequestSort = (property: string) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const filteredRegistrations = useMemo(() => {
    // Função para obter o valor de ordenação de uma registration
    const getSortValue = (
      registration: typeof registrations[0],
      property: string
    ): string | number => {
      switch (property) {
        case "fullName":
          return registration.fullName.toLowerCase();
        case "organization":
          return (
            registration.checkout?.billingDetails &&
            "orgName" in registration.checkout.billingDetails
              ? formatOrganizationName(
                  registration.checkout.billingDetails.orgName,
                  registration.checkout.billingDetails.orgDepartment
                ).toLowerCase()
              : ""
          );
        case "createdAt":
          const date = registration.createdAt;
          if (!date) return 0;
          // Verificar se é um Timestamp do Firestore (tem método toDate)
          const dateObj = date as any;
          if (dateObj && typeof dateObj.toDate === "function") {
            return dateObj.toDate().getTime();
          }
          return new Date(date).getTime();
        default:
          return "";
      }
    };

    let filtered = registrations;

    // Aplicar filtros
    if (statusFilter === "all") {
      filtered = registrations;
    } else if (statusFilter === "valid") {
      filtered = registrations.filter(
        (registration) => registration.status !== "invalid"
      );
    } else if (statusFilter === "complimentary") {
      filtered = registrations.filter(
        (registration) => registration.registrationType === "complimentary"
      );
    } else if (statusFilter === "commitment") {
      filtered = registrations.filter(
        (registration) => registration.registrationType === "commitment"
      );
    } else if (statusFilter === "commom") {
      filtered = registrations.filter(
        (registration) => registration.registrationType === "commom"
      );
    } else {
      filtered = registrations.filter(
        (registration) => registration.status === statusFilter
      );
    }

    // Aplicar ordenação
    if (orderBy) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = getSortValue(a, orderBy);
        const bVal = getSortValue(b, orderBy);

        if (aVal < bVal) return order === "asc" ? -1 : 1;
        if (aVal > bVal) return order === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [registrations, statusFilter, orderBy, order]);

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "ok":
        return {
          text: "Confirmada",
          color: "success" as const,
          icon: <CheckCircleIcon />,
        };
      case "cancelled":
        return {
          text: "Cancelada",
          color: "error" as const,
          icon: <CancelIcon />,
        };
      case "invalid":
        return {
          text: "Inválida",
          color: "error" as const,
          icon: <BlockIcon />,
        };
      case "pending":
        return {
          text: "Pendente",
          color: "warning" as const,
          icon: <PendingIcon />,
        };
      default:
        return { text: "Desconhecido", color: "default" as const, icon: null };
    }
  };

  const getRegistrationTypeDisplay = (type: RegistrationType) => {
    switch (type) {
      case "complimentary":
        return {
          text: "Cortesia",
          color: "primary" as const,
        };
      case "commitment":
        return {
          text: "Empenho",
          color: "warning" as const,
        };
      case "commom":
        return {
          text: "Comum",
          color: "success" as const,
        };
      default:
        return { text: "Desconhecido", color: "default" as const };
    }
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

  if (loadingRegistrations) {
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
          Inscrições ({filteredRegistrations.length})
        </Typography>

        <Box display="flex" gap={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="status-filter-label">Filtrar por:</InputLabel>
            <Select
              labelId="status-filter-label"
              value={statusFilter}
              label="Situação"
              onChange={handleStatusFilterChange}
            >
              <MenuItem value="valid">Válidas</MenuItem>
              <MenuItem value="complimentary">Cortesias</MenuItem>
              <MenuItem value="commitment">Empenhos</MenuItem>
              <MenuItem value="commom">Comuns</MenuItem>
              <MenuItem value="ok">Confirmadas</MenuItem>
              <MenuItem value="pending">Pendentes</MenuItem>
              <MenuItem value="cancelled">Canceladas</MenuItem>
              <MenuItem value="invalid">Inválidas</MenuItem>
              <MenuItem value="all">Todas</MenuItem>
            </Select>
          </FormControl>

          <Button
            onClick={handleExportToXlsx}
            disabled={isExporting || filteredRegistrations.length === 0}
            color="primary"
            variant="outlined"
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
              <TableCell sx={{ fontWeight: "bold" }}>Tipo</TableCell>
              <TableCell
                sx={{ fontWeight: "bold" }}
                sortDirection={orderBy === "fullName" ? order : false}
              >
                <TableSortLabel
                  active={orderBy === "fullName"}
                  direction={orderBy === "fullName" ? order : "asc"}
                  onClick={() => handleRequestSort("fullName")}
                >
                  Nome completo
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Email</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Telefone</TableCell>
              <TableCell
                sx={{ fontWeight: "bold" }}
                sortDirection={orderBy === "organization" ? order : false}
              >
                <TableSortLabel
                  active={orderBy === "organization"}
                  direction={orderBy === "organization" ? order : "asc"}
                  onClick={() => handleRequestSort("organization")}
                >
                  Organização
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Situação</TableCell>
              <TableCell
                sx={{ fontWeight: "bold" }}
                sortDirection={orderBy === "createdAt" ? order : false}
              >
                <TableSortLabel
                  active={orderBy === "createdAt"}
                  direction={orderBy === "createdAt" ? order : "asc"}
                  onClick={() => handleRequestSort("createdAt")}
                >
                  Data de inscrição
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontWeight: "bold" }} align="center">
                Ações
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRegistrations.map((registration) => {
              const statusDisplay = getStatusDisplay(registration.status);
              const typeDisplay = getRegistrationTypeDisplay(registration.registrationType);
              return (
                <TableRow key={registration.id} hover>
                  <TableCell>
                    <Chip
                      label={typeDisplay.text}
                      color={typeDisplay.color}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {registration.fullName}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {registration.email}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {registration.phone || "-"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {registration.checkout?.billingDetails &&
                      "orgName" in registration.checkout.billingDetails
                        ? formatOrganizationName(
                            registration.checkout.billingDetails.orgName,
                            registration.checkout.billingDetails.orgDepartment
                          )
                        : ""}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={statusDisplay.icon as ReactElement}
                      label={statusDisplay.text}
                      color={statusDisplay.color}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(registration.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Box display="flex" gap={1} justifyContent="center">
                      <Tooltip title="Gerar comprovante de inscrição">
                        <IconButton
                          size="small"
                          onClick={() => handleGenerateRegistrationPDF(registration)}
                          disabled={generatingPDFFor === registration.id}
                          color="primary"
                        >
                          {generatingPDFFor === registration.id ? (
                            <CircularProgress size={20} />
                          ) : (
                            <DownloadIcon />
                          )}
                        </IconButton>
                      </Tooltip>
                      {registration.checkoutId && (
                        <Tooltip title="Ver aquisição">
                          <IconButton
                            size="small"
                            onClick={() =>
                              handleViewCheckout(registration.checkout!)
                            }
                            color="primary"
                          >
                            <ShoppingCartIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Mais ações">
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, registration)}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {filteredRegistrations.length === 0 && (
        <Box textAlign="center" py={4}>
          <Typography variant="body1" color="textSecondary">
            {statusFilter === "all"
              ? "Nenhuma inscrição encontrada para este evento."
              : statusFilter === "valid"
                ? "Nenhuma inscrição válida encontrada."
                : `Nenhuma inscrição com situação "${getStatusDisplay(statusFilter).text}" encontrada.`}
          </Typography>
        </Box>
      )}

      {/* Menu de ações */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={handleActivateRegistration}
          disabled={
            loadingRegistrationStatusUpdate ||
            !selectedRegistration ||
            !canActivateRegistration(selectedRegistration)
          }
        >
          <ListItemIcon>
            {loadingRegistrationStatusUpdate ? (
              <CircularProgress size={20} />
            ) : (
              <CheckCircleIcon color="success" />
            )}
          </ListItemIcon>
          Ativar inscrição
        </MenuItem>
        <MenuItem
          onClick={handleCancelRegistration}
          disabled={
            loadingRegistrationStatusUpdate ||
            !selectedRegistration ||
            !canCancelRegistration(selectedRegistration)
          }
        >
          <ListItemIcon>
            {loadingRegistrationStatusUpdate ? (
              <CircularProgress size={20} />
            ) : (
              <CancelIcon color="error" />
            )}
          </ListItemIcon>
          Desativar inscrição
        </MenuItem>
      </Menu>

      {/* Dialog de detalhes do checkout */}
      <CheckoutDetailsDialog
        open={checkoutDialogOpen}
        onClose={handleCheckoutDialogClose}
        checkout={selectedCheckout || undefined}
        eventData={selectedEvent || undefined}
        onUpdateComplimentaryTickets={updateComplimentaryTickets}
        loadingComplimentaryUpdate={loadingComplimentaryUpdate}
        onUpdateTotalValue={updateTotalValue}
        loadingTotalValueUpdate={loadingTotalValueUpdate}
      />
    </Box>
  );
}
