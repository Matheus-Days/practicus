"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Box,
  Chip,
  IconButton,
  Tooltip,
  LinearProgress,
  Alert,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
} from "@mui/icons-material";
import { useAdminContext } from "../../contexts/AdminContext";
import { EventData } from "../../types/events";
import EditEventDialog from "./EditEventDialog";
import CreateEventDialog from "./CreateEventDialog";

export default function EventsList() {
  const {
    events,
    loadingEvents,
    error,
    navigateToEventDetails,
    refreshEvents,
  } = useAdminContext();

  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedEventForEdit, setSelectedEventForEdit] =
    useState<EventData | null>(null);

  const getStatusDisplay = (status?: string) => {
    switch (status) {
      case "open":
        return { text: "Inscrições abertas", color: "success" as const };
      case "closed":
        return { text: "Inscrições encerradas", color: "warning" as const };
      case "canceled":
        return { text: "Cancelado", color: "error" as const };
      default:
        return { text: "Desconhecido", color: "default" as const };
    }
  };

  const handleViewEvent = (event: EventData) => {
    navigateToEventDetails(event);
  };

  const handleEditEvent = (event: EventData) => {
    setSelectedEventForEdit(event);
    setShowEditDialog(true);
  };

  const handleEventUpdated = (updatedEvent: EventData) => {
    refreshEvents();
  };

  const handleEventCreated = () => {
    refreshEvents();
  };

  if (loadingEvents) {
    return (
      <Box sx={{ width: "100%" }}>
        <LinearProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
        <Button onClick={refreshEvents} sx={{ ml: 2 }}>
          Tentar novamente
        </Button>
      </Alert>
    );
  }

  return (
    <>
      <Card>
        <CardContent>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={3}
          >
            <Box>
              <Typography variant="h5" gutterBottom>
                Gerenciar Eventos
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {events.length} evento{events.length !== 1 ? "s" : ""}{" "}
                encontrado{events.length !== 1 ? "s" : ""}
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowCreateDialog(true)}
            >
              Adicionar Evento
            </Button>
          </Box>

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold" }}>Título</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Data</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Local</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Participantes</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                  <TableCell align="center" sx={{ fontWeight: "bold" }}>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {events.map((event) => {
                  const statusDisplay = getStatusDisplay(event.status);
                  return (
                    <TableRow key={event.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {event.title}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="textSecondary">
                          {event.eventDate || "-"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="textSecondary">
                          {event.eventLocal || "-"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {event.maxParticipants || "∞"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={statusDisplay.text}
                          color={statusDisplay.color}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box display="flex" gap={1} justifyContent="center">
                          <Tooltip title="Visualizar detalhes">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleViewEvent(event)}
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Editar evento">
                            <IconButton
                              size="small"
                              color="info"
                              onClick={() => handleEditEvent(event)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Excluir evento">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => {
                                /* TODO: Implementar exclusão */
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {events.length === 0 && (
            <Box textAlign="center" py={4}>
              <Typography variant="body1" color="textSecondary">
                Nenhum evento encontrado.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      <EditEventDialog
        open={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        event={selectedEventForEdit}
        onEventUpdated={handleEventUpdated}
      />

      <CreateEventDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onEventCreated={handleEventCreated}
      />
    </>
  );
}
