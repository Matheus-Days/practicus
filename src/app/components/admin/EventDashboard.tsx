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
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { useAdminContext } from "../../contexts/AdminContext";

export default function EventDashboard() {
  const { selectedEvent, eventDashboardData, loadingDashboard, refreshDashboardData } =
    useAdminContext();
  
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await refreshDashboardData();
    } catch (error) {
      console.error("Erro ao atualizar dados:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

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
      <Box display="flex" alignItems="center" gap={2}>
        <Typography variant="h5" gutterBottom sx={{ flexGrow: 1 }}>
          Painel do evento: {selectedEvent.title}
        </Typography>
        <Button
          onClick={handleRefresh}
          disabled={loadingDashboard || isRefreshing}
          variant="outlined"
          color="primary"
          startIcon={
            <RefreshIcon 
              sx={{ 
                animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' },
                },
              }} 
            />
          }
          sx={{
            '&:hover': {
              backgroundColor: 'primary.light',
              color: 'primary.contrastText',
            },
          }}
        >
          Atualizar dados
        </Button>
      </Box>

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

        {/* Vagas Adquiridas */}
        <Card>
          <CardContent>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Vagas adquiridas
                </Typography>
                <Typography variant="h4" color="secondary.main">
                  {acquiredSlots}
                </Typography>
              </Box>
              <PeopleIcon color="secondary" sx={{ fontSize: 40 }} />
            </Box>
          </CardContent>
        </Card>

        {/* Inscrições Realizadas */}
        <Card>
          <CardContent>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Inscrições realizadas
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

      {/* Ocupação Máxima, Vagas Adquiridas e Inscrições */}
      {totalSlots > 0 && (
        <Box
          display="grid"
          gridTemplateColumns="repeat(auto-fit, minmax(250px, 1fr))"
          gap={3}
        >
          {/* Ocupação Máxima */}
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

          {/* Vagas Adquiridas X Ocupação */}
          <Card>
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                mb={2}
              >
                <Typography variant="h6">Vagas adquiridas X Ocupação</Typography>
                <Chip
                  label={`${((acquiredSlots / totalSlots) * 100).toFixed(1)}%`}
                  color={getStatusColor((acquiredSlots / totalSlots) * 100) as any}
                  variant="outlined"
                />
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min((acquiredSlots / totalSlots) * 100, 100)}
                color={getStatusColor((acquiredSlots / totalSlots) * 100) as any}
                sx={{ height: 10, borderRadius: 5 }}
              />
              <Box display="flex" flexDirection="column" mt={1}>
                <Typography variant="body2" color="textSecondary">
                  {acquiredSlots} de {totalSlots} vagas adquiridas
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {totalSlots - acquiredSlots} vagas não adquiridas
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Inscrições X Ocupação */}
          <Card>
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                mb={2}
              >
                <Typography variant="h6">Inscrições X Ocupação</Typography>
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
                  {totalRegistrations} de {totalSlots} inscrições realizadas
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {availableSlots} inscrições disponíveis
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
}
