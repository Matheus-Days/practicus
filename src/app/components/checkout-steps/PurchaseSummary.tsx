"use client";

import { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Divider,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  ShoppingCart as ShoppingCartIcon,
  Edit as EditIcon,
  Payment as PaymentIcon,
  Delete as DeleteIcon,
  AccountBalance as AccountBalanceIcon,
} from "@mui/icons-material";
import {
  BillingDetailsPF,
  BillingDetailsPJ,
} from "../../api/checkouts/checkout.types";
import {
  formatCurrency,
  formatOrganizationName,
} from "../../utils/export-utils";
import { useCheckout } from "../../contexts/CheckoutContext";
import Commitment from "../Commitment";
import { isPaymentByCommitment } from "../../api/checkouts/utils";
import { formatCNPJ } from "../../utils/cnpj-utils";

export default function PurchaseSummary() {
  const {
    registrationsAmount,
    legalEntity,
    registrateMyself,
    billingDetails,
    checkout,
    setCurrentStep,
    deleteCheckout,
    isEventClosed,
  } = useCheckout();

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [commitmentOpen, setCommitmentOpen] = useState(false);

  if (!checkout) return null;

  const handleEditBilling = () => {
    setCurrentStep("billing-details");
  };

  const handleGoToPayment = () => {
    setCurrentStep("payment");
  };

  const handleCancelAcquisition = async () => {
    if (!checkout?.id) return;

    const confirm = window.confirm(
      "Tem certeza que deseja cancelar a aquisição?"
    );
    if (!confirm) return;

    try {
      await deleteCheckout();
    } catch (error) {
      console.error("Erro ao cancelar aquisição:", error);
    }
  };

  const handleRequestCancellation = () => {
    setCancelDialogOpen(true);
  };

  return (
    <>
      <Card sx={{ width: "100%", maxWidth: "100%", overflow: "hidden" }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 }, overflow: "hidden" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <ShoppingCartIcon color="primary" />
            <Typography variant="h6" component="h3">
              Resumo da compra
            </Typography>
          </Box>

          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 2,
              flexDirection: { xs: "column", sm: "row" },
            }}
          >
            <Box
              sx={{
                flex: { xs: "0 0 46px", sm: "1 1 300px" },
                minWidth: { xs: "100%", sm: "200px" },
              }}
            >
              <Typography variant="subtitle2" color="text.secondary">
                Quantidade de Inscrições
              </Typography>
              <Typography variant="h6">{registrationsAmount}</Typography>
            </Box>

            {checkout.totalValue && (
              <Box
                sx={{
                  flex: { xs: "0 0 46px", sm: "1 1 300px" },
                  minWidth: { xs: "100%", sm: "200px" },
                }}
              >
                <Typography variant="subtitle2" color="text.secondary">
                  Valor total da compra
                </Typography>
                <Typography variant="h6">
                  {formatCurrency(checkout.totalValue)}
                </Typography>
              </Box>
            )}

            {!!checkout.complimentary && (
              <Box
                sx={{
                  flex: { xs: "0 0 46px", sm: "1 1 300px" },
                  minWidth: { xs: "100%", sm: "200px" },
                }}
              >
                <Typography variant="subtitle2" color="text.secondary">
                  Quantidade de cortesias
                </Typography>
                <Typography variant="h6" color="primary">
                  {checkout.complimentary}
                </Typography>
              </Box>
            )}

            <Box
              sx={{
                flex: { xs: "0 0 46px", sm: "1 1 300px" },
                minWidth: { xs: "100%", sm: "200px" },
              }}
            >
              <Typography variant="subtitle2" color="text.secondary">
                Tipo de pessoa
              </Typography>
              <Typography variant="body1">
                {legalEntity === "pf" ? "Pessoa física" : "Pessoa jurídica"}
              </Typography>
            </Box>

            {legalEntity === "pj" &&
              billingDetails &&
              (billingDetails as BillingDetailsPJ).paymentByCommitment && (
                <Box
                  sx={{
                    flex: { xs: "0 0 46px", sm: "1 1 100%" },
                    minWidth: { xs: "100%", sm: "200px" },
                  }}
                >
                  <Typography variant="subtitle2" color="text.secondary">
                    Forma de pagamento
                  </Typography>
                  <Typography variant="body1" color="primary">
                    Empenho
                  </Typography>
                </Box>
              )}
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Dados de faturamento */}
          <Typography variant="subtitle1" gutterBottom>
            Dados de faturamento
          </Typography>

          {billingDetails && legalEntity === "pf" ? (
            <Box>
              <Typography variant="body2">
                <strong>Nome:</strong>{" "}
                {(billingDetails as BillingDetailsPF).fullName}
              </Typography>
              <Typography variant="body2">
                <strong>Email:</strong>{" "}
                {(billingDetails as BillingDetailsPF).email}
              </Typography>
              <Typography variant="body2">
                <strong>Telefone:</strong>{" "}
                {(billingDetails as BillingDetailsPF).phone}
              </Typography>
            </Box>
          ) : billingDetails && legalEntity === "pj" ? (
            <Box>
              <Typography variant="body2">
                <strong>Organização:</strong>{" "}
                {formatOrganizationName(
                  (billingDetails as BillingDetailsPJ).orgName,
                  (billingDetails as BillingDetailsPJ).orgDepartment
                )}
              </Typography>
              <Typography variant="body2">
                <strong>CNPJ:</strong>{" "}
                {formatCNPJ((billingDetails as BillingDetailsPJ).orgCnpj)}
              </Typography>
              <Typography variant="body2">
                <strong>Responsável:</strong>{" "}
                {(billingDetails as BillingDetailsPJ).responsibleName}
              </Typography>
              <Typography variant="body2">
                <strong>Email:</strong>{" "}
                {(billingDetails as BillingDetailsPJ).responsibleEmail}
              </Typography>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Dados de faturamento não disponíveis
            </Typography>
          )}

          {/* Botões de Ação */}
          <Divider sx={{ my: 3 }} />
          <Stack
            direction={{ xs: "column", sm: "row" }}
            sx={{
              mt: 2,
              flexWrap: "wrap",
              gap: 1,
              "& > *": {
                flex: { xs: "1 1 100%", sm: "0 1 auto" },
                minWidth: { xs: "100%", sm: "auto" },
              },
            }}
          >
            {checkout?.status === "pending" && !isEventClosed && (
              <>
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={handleEditBilling}
                  sx={{
                    width: { xs: "100%", sm: "auto" },
                    minWidth: { sm: "auto" },
                  }}
                >
                  Editar dados de faturamento
                </Button>

                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={handleCancelAcquisition}
                  sx={{
                    width: { xs: "100%", sm: "auto" },
                    minWidth: { sm: "auto" },
                  }}
                >
                  Cancelar aquisição
                </Button>
              </>
            )}

            {/* Botão de pagamento baseado no tipo de pagamento */}
            {isPaymentByCommitment(checkout) && (
              <Button
                variant="contained"
                startIcon={<AccountBalanceIcon />}
                onClick={() => setCommitmentOpen(true)}
                sx={{
                  width: { xs: "100%", sm: "auto" },
                  minWidth: { sm: "auto" },
                }}
              >
                Gerenciar empenho
              </Button>
            )}
            {!isPaymentByCommitment(checkout) &&
              checkout.status === "pending" && (
                <Button
                  variant="contained"
                  startIcon={<PaymentIcon />}
                  onClick={handleGoToPayment}
                  sx={{
                    width: { xs: "100%", sm: "auto" },
                    minWidth: { sm: "auto" },
                  }}
                >
                  Efetuar Pagamento
                </Button>
              )}

            {checkout?.status === "completed" && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleRequestCancellation}
                sx={{
                  width: { xs: "100%", sm: "auto" },
                  minWidth: { sm: "auto" },
                }}
              >
                Solicitar cancelamento
              </Button>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Commitment */}
      <Commitment
        checkout={checkout}
        eventId={checkout.eventId}
        open={commitmentOpen}
        onClose={() => setCommitmentOpen(false)}
      />

      {/* Dialog de Solicitação de Cancelamento */}
      <Dialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Solicitar cancelamento</DialogTitle>
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
            Ir para contato
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
