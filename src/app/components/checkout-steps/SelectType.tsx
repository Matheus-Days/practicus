"use client";

import Link from "next/link";
import { useBuyer } from "../../contexts/BuyerContext";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  ChipOwnProps,
  Alert,
  Button,
} from "@mui/material";
import { ShoppingCart as ShoppingCartIcon } from "@mui/icons-material";

export default function SelectType() {
  const { 
    setCheckoutType, 
    setCurrentStep, 
    isEventClosed, 
    checkout, 
    registration,
    eventId,
  } = useBuyer();

  const hasValidCheckout = checkout !== null;
  const hasVoucherRegistration =
    Boolean(registration) &&
    !registration?.checkoutId &&
    registration?.status !== "cancelled" &&
    registration?.status !== "invalid";

  if (isEventClosed && !hasValidCheckout) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3, p: { xs: 2, sm: 3 } }}>
        <Alert severity="info">
          <Typography variant="h6" gutterBottom>
            Inscrições encerradas
          </Typography>
          <Typography variant="body2">
            As inscrições para este evento estão encerradas. Você não pode mais realizar novas compras ou inscrições.
          </Typography>
        </Alert>
      </Box>
    );
  }

  // TODO: verificar se esse trecho de código não querbrou o fluxo do comprador
  if (hasVoucherRegistration && !hasValidCheckout) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3, p: { xs: 2, sm: 3 } }}>
        <Alert severity="warning">
          <Typography variant="h6" gutterBottom>
            Compra indisponível para esta conta
          </Typography>
          <Typography variant="body2">
            Detectamos que você já possui uma inscrição ativa neste evento via voucher.
            Para gerenciar seus dados, acesse o fluxo de inscrição.
          </Typography>
          <Box sx={{ mt: 1 }}>
            <Button
              component={Link}
              href={`/evento/${eventId}/inscricao`}
              variant="outlined"
              size="small"
              sx={{ textTransform: "none" }}
            >
              Ir para minha inscrição
            </Button>
          </Box>
        </Alert>
      </Box>
    );
  }

  const handleSelectType = (type: "acquire") => {
    setCheckoutType(type);

    if (type === "acquire") {
      setCurrentStep("billing-details");
    }
  };

  const checkoutTypes: {
    color: ChipOwnProps["color"];
    features: string[];
    [key: string]: any;
  }[] = [
    {
      type: "acquire" as const,
      title: "Adquirir inscrição",
      description: "Comprar uma ou mais inscrições",
      icon: ShoppingCartIcon,
      color: "primary",
      features: [
        "Adquira para si mesmo ou para outros",
        "Pessoas físicas ou jurídicas",
        "Inscrições garantidas após aprovação",
      ],
    },
  ];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Alert severity="info">
        Tem voucher? O fluxo de inscrição por voucher agora fica na página de inscrição do evento.
        <Box sx={{ mt: 1 }}>
          <Button
            component={Link}
            href={`/evento/${eventId}/inscricao`}
            variant="outlined"
            size="small"
            sx={{ textTransform: "none" }}
          >
            Ir para inscrição por voucher
          </Button>
        </Box>
      </Alert>

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 3,
          width: "100%",
        }}
      >
        {checkoutTypes.map((option) => {
          const IconComponent = option.icon;
          return (
            <Box
              key={option.type}
              sx={{
                flex: "1 1 50%",
                minWidth: 0,
              }}
            >
              <Card
                sx={{
                  width: "100%",
                  height: "100%",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: 4,
                  },
                }}
              >
                <CardActionArea
                  onClick={() => handleSelectType(option.type)}
                  sx={{ height: "100%", p: 3 }}
                >
                  <CardContent sx={{ textAlign: "center", height: "100%" }}>
                    <Box sx={{ mb: 2 }}>
                      <IconComponent
                        sx={{
                          fontSize: 64,
                          color: `${option.color}.main`,
                          mb: 2,
                        }}
                      />
                    </Box>

                    <Typography variant="h5" component="h2" gutterBottom>
                      {option.title}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 3,
                        wordWrap: "break-word",
                        overflowWrap: "break-word",
                        hyphens: "auto",
                      }}
                    >
                      {option.description}
                    </Typography>

                    <div className="flex justify-center">
                      <ul className="font-[Helvetica] text-base list-disc text-left">
                        {option.features.map((feature, index) => (
                          <li key={index} className="mb-2">
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
