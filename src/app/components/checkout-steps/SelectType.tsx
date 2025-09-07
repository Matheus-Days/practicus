"use client";

import { useCheckout } from "../../contexts/CheckoutContext";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Chip,
  ChipOwnProps,
} from "@mui/material";
import {
  ShoppingCart as ShoppingCartIcon,
  ConfirmationNumber as VoucherIcon,
} from "@mui/icons-material";

export default function SelectType() {
  const { setCheckoutType, setCurrentStep } = useCheckout();

  const handleSelectType = (type: "acquire" | "voucher") => {
    setCheckoutType(type);

    if (type === "acquire") {
      setCurrentStep("billing-details");
    } else {
      setCurrentStep("voucher-validation");
    }
  };

  const checkoutTypes: { color: ChipOwnProps["color"]; features: string[]; [key: string]: any }[] =
    [
      {
        type: "acquire" as const,
        title: "Adquirir inscrição",
        description: "Comprar uma ou mais inscrições",
        icon: ShoppingCartIcon,
        color: "primary",
        features: [
          "Inscreva-se ou adquira para outros",
          "Pessoas físicas ou jurídicas",
          "Inscrições liberadas após aprovação",
        ],
      },
      {
        type: "voucher" as const,
        title: "Usar voucher",
        description: "Alguém já reservou minha vaga e quero me inscrever",
        icon: VoucherIcon,
        color: "secondary" as const,
        features: [
          "Sem custos adicionais",
          "Código de voucher",
          "Validação instantânea",
        ],
      },
    ];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box sx={{ textAlign: "center", mb: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Como você gostaria de se inscrever?
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Escolha a opção que melhor se adequa à sua situação
        </Typography>
      </Box>

      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' },
        gap: 3,
        width: '100%'
      }}>
        {checkoutTypes.map((option) => {
          const IconComponent = option.icon;
          return (
            <Box 
              key={option.type}
              sx={{ 
                flex: '1 1 50%',
                minWidth: 0
              }}
            >
              <Card
                sx={{
                  width: '100%',
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
                  <CardContent sx={{ textAlign: "center" }}>
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
                      variant="body1"
                      color="text.secondary"
                      sx={{ 
                        mb: 3,
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word',
                        hyphens: 'auto'
                      }}
                    >
                      {option.description}
                    </Typography>

                    <Box
                      sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                    >
                      {option.features.map((feature, index) => (
                        <Chip
                          key={index}
                          label={feature}
                          size="small"
                          variant="outlined"
                          color={option.color}
                          sx={{ alignSelf: "center" }}
                        />
                      ))}
                    </Box>
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
