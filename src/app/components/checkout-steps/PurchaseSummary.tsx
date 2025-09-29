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
import { formatCNPJ } from "../../utils/export-utils";

interface PurchaseSummaryProps {
  registrationsAmount: number;
  legalEntity: LegalEntity | null;
  registrateMyself: boolean;
  billingDetails: BillingDetailsPF | BillingDetailsPJ | null;
  checkoutStatus: CheckoutStatus;
  complimentary?: number;
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
  complimentary,
  onEditBilling,
  onGoToPayment,
  onCancelAcquisition,
  onRequestCancellation,
}: PurchaseSummaryProps) {
  return (
    <Card sx={{ width: "100%", maxWidth: "100%", overflow: "hidden" }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 }, overflow: "hidden" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <ShoppingCartIcon color="primary" />
          <Typography variant="h6" component="h3">
            Resumo da compra
          </Typography>
        </Box>

        <Box sx={{ 
          display: "flex", 
          flexWrap: "wrap", 
          gap: 2,
          flexDirection: { xs: "column", sm: "row" }
        }}>
          <Box sx={{ 
            flex: { xs: "0 0 46px", sm: "1 1 300px" }, 
            minWidth: { xs: "100%", sm: "200px" } 
          }}>
            <Typography variant="subtitle2" color="text.secondary">
              Quantidade de Inscrições
            </Typography>
            <Typography variant="h6">{registrationsAmount}</Typography>
          </Box>

          {!!complimentary && (
            <Box sx={{ 
              flex: { xs: "0 0 46px", sm: "1 1 300px" }, 
              minWidth: { xs: "100%", sm: "200px" } 
            }}>
              <Typography variant="subtitle2" color="text.secondary">
                Quantidade de cortesias
              </Typography>
              <Typography variant="h6" color="primary">
                {complimentary}
              </Typography>
            </Box>
          )}

          <Box sx={{ 
            flex: { xs: "0 0 46px", sm: "1 1 300px" }, 
            minWidth: { xs: "100%", sm: "200px" } 
          }}>
            <Typography variant="subtitle2" color="text.secondary">
              Tipo de pessoa
            </Typography>
            <Typography variant="body1">
              {legalEntity === "pf" ? "Pessoa física" : "Pessoa jurídica"}
            </Typography>
          </Box>

          {registrateMyself && (
            <Box sx={{ 
              flex: { xs: "0 0 46px", sm: "1 1 100%" }, 
              minWidth: { xs: "100%", sm: "200px" } 
            }}>
              <Typography variant="subtitle2" color="text.secondary">
                Inscrição própria
              </Typography>
              <Typography variant="body1">
                Sim - Vou usar umas das inscrições para mim
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
              {(billingDetails as BillingDetailsPJ).orgName}
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
              minWidth: { xs: "100%", sm: "auto" }
            }
          }}
        >
          {checkoutStatus === "pending" && (
            <>
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={onEditBilling}
                sx={{ 
                  width: { xs: "100%", sm: "auto" },
                  minWidth: { sm: "auto" }
                }}
              >
                Editar dados de faturamento
              </Button>
              <Button
                variant="contained"
                startIcon={<PaymentIcon />}
                onClick={onGoToPayment}
                sx={{ 
                  width: { xs: "100%", sm: "auto" },
                  minWidth: { sm: "auto" }
                }}
              >
                Efetuar Pagamento
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={onCancelAcquisition}
                sx={{ 
                  width: { xs: "100%", sm: "auto" },
                  minWidth: { sm: "auto" }
                }}
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
              sx={{ 
                width: { xs: "100%", sm: "auto" },
                minWidth: { sm: "auto" }
              }}
            >
              Solicitar cancelamento
            </Button>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
