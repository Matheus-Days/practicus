"use client";

import { useState } from "react";
import { useCheckout } from "../../contexts/CheckoutContext";
import Dashboard from "./Dashboard";
import BillingDetails from "./BillingDetails";
import SelectType from "./SelectType";
import VoucherValidation from "./VoucherValidation";
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
  } = useCheckout();

  // Estado para validação do formulário
  const [isFormValid, setIsFormValid] = useState(false);

  // Função para salvar dados do formulário
  const handleSaveRegistration = async () => {
    if (formData && checkout) {
      try {
        // Se já existe uma registration, atualizar; senão, criar nova
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

  // Se não há checkout ou está deletado, mostrar SelectType
  // TODO: verificar se é necessário algo do tipo com checkouts marcados como deletados
  // if (!checkout || checkout.status === "deleted") {
  //   return <SelectType />;
  // }

  // Se o usuário está na etapa de select-type, mostrar SelectType
  if (currentStep === "select-type") {
    return <SelectType />;
  }

  // Se o usuário está na etapa de voucher-validation, mostrar VoucherValidation
  if (currentStep === "voucher-validation") {
    return <VoucherValidation />;
  }

  // Se o usuário está na etapa de billing-details, mostrar BillingDetails
  if (currentStep === "billing-details") {
    return <BillingDetails />;
  }

  // Se o usuário está na etapa de registration-form, mostrar RegistrationForm
  if (currentStep === "registration-form") {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {registration ? "Editar Dados do Participante" : "Dados do Participante"}
        </Typography>
        
        <Card sx={{ boxShadow: 2 }}>
          <CardContent sx={{ p: 3 }}>
            <RegistrationForm
              initialData={formData || {}}
              onDataChange={updateFormData}
              onValidationChange={setIsFormValid}
            />
          </CardContent>
        </Card>
        
        <Box sx={{ display: "flex", gap: 2, justifyContent: "space-between" }}>
          <Button
            variant="outlined"
            onClick={() => setCurrentStep("overview")}
          >
            Voltar
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveRegistration}
            disabled={!isFormValid}
          >
            {registration ? "Atualizar e Continuar" : "Salvar e Continuar"}
          </Button>
        </Box>
      </Box>
    );
  }

  // Caso contrário, mostrar Dashboard (incluindo quando currentStep === "overview")
  return (
    <Dashboard
      onEditBilling={() => setCurrentStep("billing-details")}
      onGoToPayment={() => setCurrentStep("payment")}
      onGoToRegistration={() => setCurrentStep("registration-form")}
    />
  );
} 