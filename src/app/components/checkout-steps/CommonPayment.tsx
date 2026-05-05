"use client";

import { Box, Typography, Button, Card, CardContent } from "@mui/material";
import {
  ContactMail as ContactIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";
import { PrismicNextLink } from "@prismicio/next";
import { useBuyer } from "../../contexts/BuyerContext";

export default function CommonPayment() {
  const { setCurrentStep } = useBuyer();
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        sx={{
          fontSize: { xs: "1.75rem", sm: "2.125rem" },
          textAlign: { xs: "center", sm: "left" },
        }}
      >
        Pagamento
      </Typography>

      <Card sx={{ boxShadow: 2 }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 3,
              alignItems: "center",
              textAlign: "center",
            }}
          >
            <Typography
              variant="body1"
              sx={{
                fontSize: "1.125rem",
                lineHeight: 1.6,
                color: "text.secondary",
              }}
            >
              Para efetuar pagamento com PIX ou cartão, entre em contato com a
              equipe da Practicus através de uma das formas de contato
              disponíveis em:
            </Typography>

            <PrismicNextLink
              field={{
                url: "/contato",
                link_type: "Document",
              }}
            >
              <Button
                variant="contained"
                size="large"
                startIcon={<ContactIcon />}
                sx={{
                  px: 4,
                  py: 1.5,
                  fontSize: "1rem",
                  fontWeight: 600,
                  borderRadius: 2,
                  textTransform: "none",
                  boxShadow: 2,
                  "&:hover": {
                    boxShadow: 4,
                  },
                }}
              >
                Página de Contato
              </Button>
            </PrismicNextLink>
          </Box>
        </CardContent>
      </Card>

      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-start",
          width: "100%",
        }}
      >
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => setCurrentStep("overview")}
        >
          Voltar ao painel da inscrição
        </Button>
      </Box>
    </Box>
  );
}
