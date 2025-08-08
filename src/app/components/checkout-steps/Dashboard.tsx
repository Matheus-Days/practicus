"use client";

import { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Alert,
  Stack,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  Edit as EditIcon,
  Payment as PaymentIcon,
  Person as PersonIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Receipt as ReceiptIcon,
  ContentCopy as CopyIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
  Refresh as RefreshIcon,
  ShoppingCart as ShoppingCartIcon,
  ConfirmationNumber as TicketIcon,
  Group as GroupIcon,
} from "@mui/icons-material";
import { useCheckout } from "../../contexts/CheckoutContext";
import { CheckoutStatus } from "../../api/checkouts/checkout.types";
import { Registration } from "../../types/checkout";

interface DashboardProps {
  onEditBilling?: () => void;
  onGoToPayment?: () => void;
  onGoToRegistration?: () => void;
}

export default function Dashboard({
  onEditBilling,
  onGoToPayment,
  onGoToRegistration,
}: DashboardProps) {
  const {
    checkout,
    registration,
    billingDetails,
    registrationsAmount,
    registrateMyself,
    legalEntity,
    setCurrentStep,
    deleteCheckout,
  } = useCheckout();

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    "success" | "error" | "info"
  >("success");
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  if (!checkout) {
    return <Alert severity="error">Nenhum checkout encontrado.</Alert>;
  }

  // Calcular quantidade de vouchers disponíveis
  const vouchersAmount = registrateMyself
    ? registrationsAmount - 1
    : registrationsAmount;

  // Traduzir status do checkout
  const getStatusInfo = (status: CheckoutStatus) => {
    switch (status) {
      case "pending":
        return {
          label: "Pagamento Pendente",
          color: "warning" as const,
          icon: <PendingIcon color="warning" />,
          description: "Aguardando confirmação do pagamento.",
        };
      case "completed":
        return {
          label: "Concluída",
          color: "success" as const,
          icon: <CheckCircleIcon color="success" />,
          description: "Pagamento aprovado e inscrição liberada.",
        };
      case "refunded":
        return {
          label: "Reembolsada",
          color: "error" as const,
          icon: <CancelIcon color="error" />,
          description: "Pagamento reembolsado e processo de inscrição cancelado.",
        };
      case "deleted":
        return {
          label: "Excluída",
          color: "default" as const,
          icon: <CancelIcon color="error" />,
          description: "Processo de aquisição cancelado.",
        };
      default:
        return {
          label: "Desconhecida",
          color: "default" as const,
          icon: <PendingIcon />,
          description: "Situação desconhecida.",
        };
    }
  };

  const statusInfo = getStatusInfo(checkout.status);

  // Mock data para inscritos (será substituído pela API real)
  const mockRegistrations = [
    { id: "1", fullName: "João Silva", email: "joao@email.com", status: "ok" },
    {
      id: "2",
      fullName: "Maria Santos",
      email: "maria@email.com",
      status: "invalid",
    },
    {
      id: "3",
      fullName: "Carina Tavares",
      email: "carina@email.com",
      status: "cancelled",
    },
  ];

  // Mock data para minha inscrição (será substituído pela API real)
  const mockMyRegistration: Registration = {
    id: "my-registration",
    eventId: "event-123",
    userId: "user-123",
    checkoutId: checkout?.id,
    createdAt: new Date(),
    fullName: "Matheus Braga Dias",
    email: "matheus@email.com",
    cpf: "123.456.789-00",
    credentialName: "Matheus Dias",
    phone: "(11) 99999-9999",
    isPhoneWhatsapp: true,
    city: "São Paulo",
    employer: "Practicus",
    occupation: "Desenvolvedor",
    howDidYouHearAboutUs: "Indicação",
    useImage: true,
    status: "ok",
  };

  const handleCancelRegistration = (registrationId: string) => {
    // TODO: Implementar cancelamento de inscrição
    setSnackbarMessage(
      "Funcionalidade de cancelamento será implementada em breve"
    );
    setSnackbarSeverity("info");
    setSnackbarOpen(true);
  };

  const handleReactivateRegistration = (registrationId: string) => {
    // TODO: Implementar reativação de inscrição
    setSnackbarMessage(
      "Funcionalidade de reativação será implementada em breve"
    );
    setSnackbarSeverity("info");
    setSnackbarOpen(true);
  };

  const handleCancelAcquisition = async () => {
    if (!checkout?.id) return;

    try {
      await deleteCheckout();
      setSnackbarMessage("Aquisição cancelada com sucesso!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage("Erro ao cancelar aquisição");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleRequestCancellation = () => {
    setCancelDialogOpen(true);
  };

  const handleCancelMyRegistration = () => {
    // TODO: Implementar cancelamento da minha inscrição
    setSnackbarMessage(
      "Funcionalidade de cancelamento da minha inscrição será implementada em breve"
    );
    setSnackbarSeverity("info");
    setSnackbarOpen(true);
  };

  const handleCopyVoucher = async () => {
    if (checkout.voucher) {
      try {
        await navigator.clipboard.writeText(checkout.voucher);
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
    }
  };

  const getRegistrationStatusInfo = (status: string) => {
    switch (status) {
      case "ok":
        return {
          label: "Ativa",
          color: "success" as const,
          icon: <CheckCircleIcon fontSize="small" color="success" />,
        };
      case "invalid":
        return {
          label: "Inválida",
          color: "default" as const,
          icon: <BlockIcon fontSize="small" color="disabled" />,
        };
      case "cancelled":
        return {
          label: "Cancelada",
          color: "error" as const,
          icon: <CancelIcon fontSize="small" color="error" />,
        };
      default:
        return {
          label: "Desconhecido",
          color: "default" as const,
          icon: <PendingIcon fontSize="small" color="disabled" />,
        };
    }
  };

  const handleEditBilling = () => {
    setCurrentStep("billing-details");
    onEditBilling?.();
  };

  const handleGoToPayment = () => {
    setCurrentStep("payment");
    onGoToPayment?.();
  };

  const handleGoToRegistration = () => {
    setCurrentStep("registration-form");
    onGoToRegistration?.();
  };

      return (
      <Box
        sx={{ display: "flex", flexDirection: "column", gap: 3 }}
      >
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard da Inscrição
      </Typography>

      {/* Status do Checkout */}
      <Card>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
            <span className="text-green">
              {statusInfo.icon}
            </span>
            <Typography variant="h6" component="h2">
              Situação da aquisição: {statusInfo.label}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            {statusInfo.description}
          </Typography>
        </CardContent>
      </Card>

      {/* Código do Voucher */}
      {checkout.voucher && (
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
                  {checkout.voucher}
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
      )}

      {/* Resumo da Compra */}
      <Card>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <ShoppingCartIcon color="primary" />
            <Typography variant="h6" component="h3">
              Resumo da compra
            </Typography>
          </Box>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
            <Box sx={{ flex: "1 1 300px" }}>
              <Typography variant="subtitle2" color="text.secondary">
                Quantidade de Inscrições
              </Typography>
              <Typography variant="h6">{registrationsAmount}</Typography>
            </Box>

            <Box sx={{ flex: "1 1 300px" }}>
              <Typography variant="subtitle2" color="text.secondary">
                Tipo de Pessoa
              </Typography>
              <Typography variant="h6">
                {legalEntity === "pf" ? "Pessoa Física" : "Pessoa Jurídica"}
              </Typography>
            </Box>

            {registrateMyself && (
              <Box sx={{ flex: "1 1 100%" }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Inscrição Própria
                </Typography>
                <Typography variant="h6">
                  Sim - Esta inscrição é para mim
                </Typography>
              </Box>
            )}
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Dados de Faturamento */}
          <Typography variant="subtitle1" gutterBottom>
            Dados de Faturamento
          </Typography>

          {billingDetails && legalEntity === "pf" ? (
            <Box>
              <Typography variant="body2">
                <strong>Nome:</strong> {(billingDetails as any).fullName}
              </Typography>
              <Typography variant="body2">
                <strong>Email:</strong> {(billingDetails as any).email}
              </Typography>
              <Typography variant="body2">
                <strong>Telefone:</strong> {(billingDetails as any).phone}
              </Typography>
            </Box>
          ) : billingDetails && legalEntity === "pj" ? (
            <Box>
              <Typography variant="body2">
                <strong>Organização:</strong> {(billingDetails as any).orgName}
              </Typography>
              <Typography variant="body2">
                <strong>CNPJ:</strong> {(billingDetails as any).orgCnpj}
              </Typography>
              <Typography variant="body2">
                <strong>Responsável:</strong>{" "}
                {(billingDetails as any).responsibleName}
              </Typography>
              <Typography variant="body2">
                <strong>Email:</strong>{" "}
                {(billingDetails as any).responsibleEmail}
              </Typography>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Dados de faturamento não disponíveis
            </Typography>
          )}

          {/* Botões de Ação */}
          <Divider sx={{ my: 3 }} />
          <Stack direction="row" sx={{ mt: 2, flexWrap: "wrap", gap: 1 }}>
            {checkout.status === "pending" && (
              <>
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={handleEditBilling}
                >
                  Editar Dados de Faturamento
                </Button>
                <Button
                  variant="contained"
                  startIcon={<PaymentIcon />}
                  onClick={handleGoToPayment}
                >
                  Efetuar Pagamento
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={handleCancelAcquisition}
                >
                  Cancelar Aquisição
                </Button>
              </>
            )}

            {checkout.status === "completed" && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleRequestCancellation}
              >
                Solicitar Cancelamento
              </Button>
            )}

            {!registration &&
              (registrateMyself || checkout.checkoutType === "voucher") && (
                <Button
                  variant="contained"
                  startIcon={<PersonIcon />}
                  onClick={handleGoToRegistration}
                >
                  Preencher Dados da Minha Inscrição
                </Button>
              )}
          </Stack>
        </CardContent>
      </Card>

      {/* Dados da Inscrição */}
      {registration && (
        <Card>
          <CardContent>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 2,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <PersonIcon color="primary" />
                <Typography variant="h6" component="h3">
                  Dados da Inscrição
                </Typography>
              </Box>
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={handleGoToRegistration}
              >
                Editar
              </Button>
            </Box>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
              <Box sx={{ flex: "1 1 300px" }}>
                <Typography variant="body2">
                  <strong>Nome:</strong> {registration.fullName}
                </Typography>
              </Box>
              <Box sx={{ flex: "1 1 300px" }}>
                <Typography variant="body2">
                  <strong>Email:</strong> {registration.email}
                </Typography>
              </Box>
              <Box sx={{ flex: "1 1 300px" }}>
                <Typography variant="body2">
                  <strong>CPF:</strong> {registration.cpf}
                </Typography>
              </Box>
              <Box sx={{ flex: "1 1 300px" }}>
                <Typography variant="body2">
                  <strong>Telefone:</strong> {registration.phone}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Minha Inscrição */}
      <Card>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 2,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <PersonIcon color="primary" />
              <Typography variant="h6" component="h3">
                Minha Inscrição no evento
              </Typography>
            </Box>
            <Chip
              label={getRegistrationStatusInfo(mockMyRegistration.status).label}
              color={getRegistrationStatusInfo(mockMyRegistration.status).color}
              size="small"
              variant="outlined"
            />
          </Box>
          <Typography variant="body2">
            Principais dados da sua inscrição. Eles serão usados para gerar o
            crachá e o certificado de participação, além de qualquer comunicação entre a equipe do evento e você, então verifique se estão
            corretos e os edite se necessário.
          </Typography>

          <div className="my-4"></div>

          {mockMyRegistration ? (
            <>
              <Box sx={{ mb: 3 }}>
                                 <Typography variant="body2">
                   <strong>Nome completo:</strong> {mockMyRegistration.fullName}
                 </Typography>
                 <Typography variant="body2">
                   <strong>Email:</strong> {mockMyRegistration.email}
                 </Typography>
                 <Typography variant="body2">
                   <strong>CPF:</strong> {mockMyRegistration.cpf}
                 </Typography>
                 <Typography variant="body2">
                   <strong>Nome para crachá:</strong>{" "}
                   {mockMyRegistration.credentialName}
                 </Typography>
                 <Typography variant="body2">
                   <strong>Telefone:</strong> {mockMyRegistration.phone}
                   {mockMyRegistration.isPhoneWhatsapp && (
                     <Chip
                       label="WhatsApp"
                       color="success"
                       size="small"
                       variant="outlined"
                       sx={{ ml: 1 }}
                     />
                   )}
                 </Typography>
              </Box>

              <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={handleGoToRegistration}
                >
                  Editar meus dados de inscrição
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={handleCancelMyRegistration}
                >
                  Cancelar inscrição
                </Button>
              </Stack>
            </>
          ) : (
            <Box sx={{ textAlign: "center", py: 3 }}>
              <Typography variant="body1" color="text.secondary">
                Você ainda não preencheu seus dados de inscrição.
              </Typography>
              <Button
                variant="contained"
                startIcon={<PersonIcon />}
                onClick={handleGoToRegistration}
              >
                Preencher dados da minha inscrição
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Estatísticas de Vouchers (apenas se completed e vouchersAmount > 0) */}
      {checkout.status === "completed" && vouchersAmount > 0 && (
        <Card>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <TicketIcon color="primary" />
              <Typography variant="h6" component="h3">
                Acompanhe as inscrições via voucher
              </Typography>
            </Box>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
              <Box sx={{ flex: "1 1 200px" }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Total de Vouchers
                </Typography>
                <Typography variant="h4" color="primary">
                  {vouchersAmount}
                </Typography>
              </Box>
              <Box sx={{ flex: "1 1 200px" }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Vouchers Utilizados
                </Typography>
                <Typography variant="h4" color="success.main">
                  {
                    mockRegistrations.filter((reg) => reg.status === "ok")
                      .length
                  }
                </Typography>
              </Box>
              <Box sx={{ flex: "1 1 200px" }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Vouchers Disponíveis
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {vouchersAmount -
                    mockRegistrations.filter((reg) => reg.status === "ok")
                      .length}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Tabela de Inscritos (apenas se completed e vouchersAmount > 0) */}
      {checkout.status === "completed" &&
        vouchersAmount > 0 &&
        mockRegistrations.filter((reg) => reg.status === "ok").length > 0 && (
          <Card>
            <CardContent>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
              >
                <GroupIcon color="primary" />
                <Typography variant="h6" component="h3">
                  Inscritos via voucher
                </Typography>
              </Box>

              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: "bold" }}>
                        Nome Completo
                      </TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>E-mail</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Situação</TableCell>
                      <TableCell align="center" sx={{ fontWeight: "bold" }}>
                        Ações
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {mockRegistrations.map((reg) => {
                      const statusInfo = getRegistrationStatusInfo(reg.status);
                      return (
                        <TableRow key={reg.id}>
                          <TableCell>{reg.fullName}</TableCell>
                          <TableCell>{reg.email}</TableCell>
                          <TableCell>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              {statusInfo.icon}
                              <Chip
                                label={statusInfo.label}
                                color={statusInfo.color}
                                size="small"
                                variant="outlined"
                              />
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            {reg.status === "invalid" ? (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ fontStyle: "italic" }}
                              >
                                Ação indisponível
                              </Typography>
                            ) : reg.status === "cancelled" ? (
                              <Button
                                variant="outlined"
                                color="success"
                                size="small"
                                startIcon={<RefreshIcon />}
                                onClick={() =>
                                  handleReactivateRegistration(reg.id)
                                }
                              >
                                Reativar inscrição
                              </Button>
                            ) : (
                              <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                startIcon={<DeleteIcon />}
                                onClick={() => handleCancelRegistration(reg.id)}
                              >
                                Cancelar inscrição
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}

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

      {/* Dialog de Solicitação de Cancelamento */}
      <Dialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Solicitar Cancelamento</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Para solicitar o cancelamento de aquisição de inscrições e
            reembolsos, entre em contato direto com a equipe Practicus através
            dos meios oficiais de comunicação disponíveis na página de contato.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Nossa equipe está preparada para auxiliá-lo com todas as suas
            dúvidas e solicitações relacionadas ao seu pedido.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>Fechar</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              setCancelDialogOpen(false);
              window.open("/contato", "_blank");
            }}
          >
            Ir para Contato
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
