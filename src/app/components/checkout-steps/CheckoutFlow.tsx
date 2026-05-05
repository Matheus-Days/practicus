"use client";

import { useState } from "react";
import { useBuyer } from "../../contexts/BuyerContext";
import Dashboard from "./Dashboard";
import BillingDetails from "./BillingDetails";
import SelectType from "./SelectType";
import CommonPayment from "./CommonPayment";
import RegistrationForm from "../RegistrationForm";
import { Box, Typography, Button, Card, CardContent } from "@mui/material";
import { RegistrationFormData } from "../../api/registrations/registration.types";

export default function CheckoutFlow() {
  const { 
    checkout, 
    currentStep, 
    setCurrentStep, 
    formData, 
    updateFormData, 
    createRegistration, 
    updateRegistration,
    registration 
  } = useBuyer();

  const [isFormValid, setIsFormValid] = useState(false);

  const handleSaveRegistration = async () => {
    if (formData && checkout) {
      try {
        if (registration) {
          await updateRegistration(formData);
        } else {
          await createRegistration(formData as RegistrationFormData);
        }
      } catch (error) {
        console.error("Erro ao salvar inscrição:", error);
        alert("Erro ao salvar inscrição. Tente novamente.");
      }
    }
  };

  if (currentStep === "select-type") {
    return <SelectType />;
  }

  if (currentStep === "billing-details") {
    return <BillingDetails />;
  }

  if (currentStep === "registration-form") {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom
          sx={{ 
            fontSize: { xs: "1.75rem", sm: "2.125rem" },
            textAlign: { xs: "center", sm: "left" }
          }}
        >
          {registration ? "Editar dados do participante" : "Dados da inscrição"}
        </Typography>
        
        <Card sx={{ boxShadow: 2 }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <RegistrationForm
              initialData={formData || {}}
              onDataChange={updateFormData}
              onValidationChange={setIsFormValid}
            />
          </CardContent>
        </Card>
        
        <Box sx={{ 
          display: "flex", 
          gap: 2, 
          justifyContent: "space-between",
          flexDirection: { xs: "column", sm: "row" }
        }}>
          <Button
            variant="outlined"
            onClick={() => setCurrentStep("overview")}
            sx={{ 
              width: { xs: "100%", sm: "auto" },
              minWidth: { sm: "auto" }
            }}
          >
            Voltar
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveRegistration}
            disabled={!isFormValid}
            sx={{ 
              width: { xs: "100%", sm: "auto" },
              minWidth: { sm: "auto" }
            }}
          >
            {registration ? "Atualizar e Continuar" : "Salvar e Continuar"}
          </Button>
        </Box>
      </Box>
    );
  }

  // Se o usuário está na etapa de payment, mostrar CommonPayment
  if (currentStep === "payment") {
    return <CommonPayment />;
  }

  // Caso contrário, mostrar Dashboard (incluindo quando currentStep === "overview")
  return (
    <Dashboard />
  );
} 