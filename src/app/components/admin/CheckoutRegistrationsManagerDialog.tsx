"use client";

import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { Close, Edit, Cancel } from "@mui/icons-material";
import { CheckoutData } from "@/app/types/checkout";
import { useAdminContext } from "@/app/contexts/AdminContext";
import RegistrationForm from "@/app/components/RegistrationForm";
import { RegistrationFormData, RegistrationStatus } from "@/app/api/registrations/registration.types";
import { useRegistrationAPI } from "@/app/hooks/registrationAPI";
import { RegistrationData } from "@/app/hooks/registrationAPI";

type Props = {
  open: boolean;
  onClose: () => void;
  checkout: CheckoutData;
};

function statusColor(status: RegistrationStatus) {
  switch (status) {
    case "ok":
      return "success" as const;
    case "pending":
      return "warning" as const;
    case "cancelled":
      return "error" as const;
    default:
      return "default" as const;
  }
}

export default function CheckoutRegistrationsManagerDialog({ open, onClose, checkout }: Props) {
  const { eventRegistrations, updateRegistrationStatus, showNotification } = useAdminContext();
  const { updateRegistrationById } = useRegistrationAPI();

  const registrations = useMemo(() => {
    return eventRegistrations
      .filter((r) => r.checkoutId === checkout.id)
      .sort((a, b) => {
        const aDate = (a.createdAt as any)?.toDate ? (a.createdAt as any).toDate().getTime() : new Date(a.createdAt as any).getTime();
        const bDate = (b.createdAt as any)?.toDate ? (b.createdAt as any).toDate().getTime() : new Date(b.createdAt as any).getTime();
        return bDate - aDate;
      });
  }, [eventRegistrations, checkout.id]);

  const [editing, setEditing] = useState<RegistrationData | null>(null);
  const [formData, setFormData] = useState<Partial<RegistrationFormData>>({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const closeEdit = () => {
    setEditing(null);
    setFormData({});
    setIsFormValid(false);
    setSaving(false);
    setLocalError(null);
  };

  const handleEdit = (reg: RegistrationData) => {
    setEditing(reg);
    setFormData({
      fullName: reg.fullName,
      email: reg.email,
      phone: reg.phone,
      cpf: reg.cpf,
      isPhoneWhatsapp: reg.isPhoneWhatsapp,
      credentialName: reg.credentialName,
      occupation: reg.occupation,
      useImage: reg.useImage,
      howDidYouHearAboutUs: reg.howDidYouHearAboutUs,
      howDidYouHearAboutUsOther: reg.howDidYouHearAboutUsOther,
    });
    setLocalError(null);
  };

  const handleSave = async () => {
    if (!editing) return;
    try {
      setSaving(true);
      setLocalError(null);
      const payload = formData as RegistrationFormData;
      await updateRegistrationById(editing.id, payload);
      showNotification("Inscrição atualizada com sucesso!", "success");
      closeEdit();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao atualizar inscrição";
      setLocalError(msg);
      showNotification(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelRegistration = async (reg: RegistrationData) => {
    try {
      await updateRegistrationStatus(reg.id, "cancelled");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao cancelar inscrição";
      showNotification(msg, "error");
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h6">Inscrições desta compra</Typography>
              <Typography variant="body2" color="text.secondary">
                ID da aquisição: <span style={{ fontFamily: "monospace" }}>{checkout.id}</span>
              </Typography>
            </Box>
            <IconButton onClick={onClose}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Stack spacing={2}>
            <Alert severity="info">
              Aqui você pode <strong>cancelar</strong> e <strong>editar</strong> inscrições vinculadas a esta compra.
              A criação de novas inscrições por admin será habilitada no passo de migração do modelo (V2).
            </Alert>

            <Divider />

            {registrations.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Nenhuma inscrição encontrada para esta aquisição.
              </Typography>
            ) : (
              <Stack spacing={1.5}>
                {registrations.map((reg) => (
                  <Box
                    key={reg.id}
                    sx={{
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 1,
                      p: 2,
                      display: "flex",
                      flexDirection: { xs: "column", sm: "row" },
                      justifyContent: "space-between",
                      gap: 2,
                    }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle2" sx={{ wordBreak: "break-word" }}>
                        {reg.fullName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ wordBreak: "break-word" }}>
                        {reg.email || "-"} • {reg.phone || "-"}
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        <Chip label={reg.status} color={statusColor(reg.status)} size="small" variant="outlined" />
                      </Box>
                    </Box>

                    <Box sx={{ display: "flex", gap: 1, alignItems: "center", justifyContent: "flex-end" }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Edit />}
                        onClick={() => handleEdit(reg)}
                      >
                        Editar
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<Cancel />}
                        onClick={() => handleCancelRegistration(reg)}
                        disabled={reg.status === "cancelled" || reg.status === "invalid"}
                      >
                        Cancelar
                      </Button>
                    </Box>
                  </Box>
                ))}
              </Stack>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} variant="outlined">
            Fechar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!editing} onClose={closeEdit} maxWidth="md" fullWidth>
        <DialogTitle>Editar inscrição</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {localError ? <Alert severity="error">{localError}</Alert> : null}
            <RegistrationForm
              initialData={formData}
              onDataChange={setFormData}
              onValidationChange={setIsFormValid}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeEdit} variant="outlined" disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} variant="contained" disabled={saving || !isFormValid}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

