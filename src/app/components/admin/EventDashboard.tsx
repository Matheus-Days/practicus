"use client";

import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Chip,
  Button,
} from "@mui/material";
import {
  People as PeopleIcon,
  ShoppingCart as ShoppingCartIcon,
  CheckCircle as CheckCircleIcon,
  Description as DescriptionIcon,
  Payments as PaymentsIcon,
} from "@mui/icons-material";
import { useAdminContext } from "../../contexts/AdminContext";

export default function EventDashboard() {
  const {
    selectedEvent,
    eventDashboardData,
    loadingDashboard,
  } = useAdminContext();

  if (!selectedEvent || !eventDashboardData) {
    return null;
  }

  if (loadingDashboard) {
    return (
      <Box sx={{ width: "100%", mb: 3 }}>
        <LinearProgress />
      </Box>
    );
  }

  const {
    totalSlots,
    pendingCheckouts,
    completedCheckouts,
    totalRegistrations,
    totalAmountInCheckouts,
    registrationPercentage,
    acquiredSlots,
  } = eventDashboardData;

  const getStatusColor = (percentage: number) => {
    if (percentage >= 75) return "error";
    if (percentage >= 50) return "warning";
    return "success";
  };

  const availableSlots =
    totalSlots - totalRegistrations >= 0 ? totalSlots - totalRegistrations : 0;

  return (
    <Box display="flex" flexDirection="column" gap={3} sx={{ mb: 3 }}>
      <Typography variant="h5" gutterBottom>
        Painel do evento: {selectedEvent.title}
      </Typography>

      {/* Primeira linha: Cards sobre checkouts */}
      <Box
        display="grid"
        gridTemplateColumns="repeat(auto-fit, minmax(250px, 1fr))"
        gap={3}
      >
        {/* Checkouts Pendentes */}
        <Card>
          <CardContent>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Aquisições pendentes
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {pendingCheckouts}
                </Typography>
              </Box>
              <ShoppingCartIcon color="warning" sx={{ fontSize: 40 }} />
            </Box>
          </CardContent>
        </Card>

        {/* Checkouts Concluídos */}
        <Card>
          <CardContent>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Aquisições concluídas
                </Typography>
                <Typography variant="h4" color="success.main">
                  {completedCheckouts}
                </Typography>
              </Box>
              <CheckCircleIcon color="success" sx={{ fontSize: 40 }} />
            </Box>
          </CardContent>
        </Card>
        {/* Total de inscrições (pendentes ou pagas) */}
        <Card>
          <CardContent>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Ingressos adquiridos (pendentes ou pagos)
                </Typography>
                <Typography variant="h4" color="primary.main">
                  {totalAmountInCheckouts}
                </Typography>
              </Box>
              <PeopleIcon color="primary" sx={{ fontSize: 40 }} />
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Segunda linha: Cards sobre registrations */}
      <Box
        display="grid"
        gridTemplateColumns="repeat(auto-fit, minmax(250px, 1fr))"
        gap={3}
      >
        {/* Ocupação máxima */}
        <Card>
          <CardContent>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Ocupação máxima
                </Typography>
                <Typography variant="h4">{totalSlots || "∞"}</Typography>
              </Box>
              <PeopleIcon color="primary" sx={{ fontSize: 40 }} />
            </Box>
          </CardContent>
        </Card>
        {/* Inscrições pagas */}
        <Card>
          <CardContent>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Inscrições pagas
                </Typography>
                <Typography variant="h4" color="success.main">
                  {acquiredSlots}
                </Typography>
              </Box>
              <PaymentsIcon color="success" sx={{ fontSize: 40 }} />
            </Box>
          </CardContent>
        </Card>

        {/* Inscrições preenchidas */}
        <Card>
          <CardContent>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Inscrições preenchidas
                </Typography>
                <Typography variant="h4" color="info.main">
                  {totalRegistrations}
                </Typography>
              </Box>
              <DescriptionIcon color="info" sx={{ fontSize: 40 }} />
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Terceira linha: Ocupação máxima e cards de porcentagens e progresso */}
      {totalSlots > 0 && (
        <Box
          display="grid"
          gridTemplateColumns="repeat(auto-fit, minmax(250px, 1fr))"
          gap={3}
        >
          {/* Vagas Adquiridas X Ocupação */}
          <Card>
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                mb={2}
              >
                <Typography variant="h6">
                  Inscrições pagas X Ocupação
                </Typography>
                <Chip
                  label={`${((acquiredSlots / totalSlots) * 100).toFixed(1)}%`}
                  color={
                    getStatusColor((acquiredSlots / totalSlots) * 100) as any
                  }
                  variant="outlined"
                />
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min((acquiredSlots / totalSlots) * 100, 100)}
                color={
                  getStatusColor((acquiredSlots / totalSlots) * 100) as any
                }
                sx={{ height: 10, borderRadius: 5 }}
              />
              <Box display="flex" flexDirection="column" mt={1}>
                <Typography variant="body2" color="textSecondary">
                  {acquiredSlots} inscrições pagas de {totalSlots} vagas
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {totalSlots - acquiredSlots} vagas não reservadas para
                  inscrições pagas
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Inscrições preenchidas X Ocupação */}
          <Card>
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                mb={2}
              >
                <Typography variant="h6">
                  Inscrições preenchidas X Ocupação
                </Typography>
                <Chip
                  label={`${registrationPercentage.toFixed(1)}%`}
                  color={getStatusColor(registrationPercentage) as any}
                  variant="outlined"
                />
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min(registrationPercentage, 100)}
                color={getStatusColor(registrationPercentage) as any}
                sx={{ height: 10, borderRadius: 5 }}
              />
              <Box display="flex" flexDirection="column" mt={1}>
                <Typography variant="body2" color="textSecondary">
                  {totalRegistrations} inscrições preenchidas de {totalSlots}{" "}
                  vagas
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {availableSlots} vagas sem inscrições preenchidas
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Ingressos X Ocupação */}
          <Card>
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                mb={2}
              >
                <Typography variant="h6">
                  Ingressos adquiridos X Ocupação
                </Typography>
                <Chip
                  label={`${((totalAmountInCheckouts / totalSlots) * 100).toFixed(1)}%`}
                  color={getStatusColor((totalAmountInCheckouts / totalSlots) * 100) as any}
                  variant="outlined"
                />
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min((totalAmountInCheckouts / totalSlots) * 100, 100)}
                color={getStatusColor((totalAmountInCheckouts / totalSlots) * 100) as any}
                sx={{ height: 10, borderRadius: 5 }}
              />
              <Box display="flex" flexDirection="column" mt={1}>
                <Typography variant="body2" color="textSecondary">
                  {totalAmountInCheckouts} ingressos para {totalSlots} vagas
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {totalSlots - totalAmountInCheckouts} vagas sem ingressos
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
}
