"use client";

import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Divider,
  Stack,
} from "@mui/material";
import {
  ShoppingCart as ShoppingCartIcon,
  Edit as EditIcon,
  Payment as PaymentIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import {
  BillingDetailsPF,
  BillingDetailsPJ,
  LegalEntity,
  CheckoutStatus,
} from "../../api/checkouts/checkout.types";

interface PurchaseSummaryProps {
  registrationsAmount: number;
  legalEntity: LegalEntity | null;
  registrateMyself: boolean;
  billingDetails: BillingDetailsPF | BillingDetailsPJ | null;
  checkoutStatus: CheckoutStatus;
  onEditBilling?: () => void;
  onGoToPayment?: () => void;
  onCancelAcquisition?: () => void;
  onRequestCancellation?: () => void;
}

export default function PurchaseSummary({
  registrationsAmount,
  legalEntity,
  registrateMyself,
  billingDetails,
  checkoutStatus,
  onEditBilling,
  onGoToPayment,
  onCancelAcquisition,
  onRequestCancellation,
}: PurchaseSummaryProps) {
  return (
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
              {(billingDetails as BillingDetailsPJ).orgName}
            </Typography>
            <Typography variant="body2">
              <strong>CNPJ:</strong>{" "}
              {(billingDetails as BillingDetailsPJ).orgCnpj}
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
        <Stack direction="row" sx={{ mt: 2, flexWrap: "wrap", gap: 1 }}>
          {checkoutStatus === "pending" && (
            <>
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={onEditBilling}
              >
                Editar Dados de Faturamento
              </Button>
              <Button
                variant="contained"
                startIcon={<PaymentIcon />}
                onClick={onGoToPayment}
              >
                Efetuar Pagamento
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={onCancelAcquisition}
              >
                Cancelar Aquisição
              </Button>
            </>
          )}

          {checkoutStatus === "completed" && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={onRequestCancellation}
            >
              Solicitar Cancelamento
            </Button>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
