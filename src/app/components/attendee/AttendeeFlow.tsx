"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { User } from "firebase/auth";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import {
  ConfirmationNumber,
  ShoppingCart,
  ArrowBack,
  Edit,
  Download,
  Cancel,
  Save,
  PlayArrow,
} from "@mui/icons-material";
import { useFirebase } from "@/app/hooks/firebase";
import AuthCard from "@/app/components/AuthCard";
import UserSessionBanner from "@/app/components/UserSessionBanner";
import RegistrationForm from "@/app/components/RegistrationForm";
import { AttendeeProvider, useAttendee } from "@/app/contexts/AttendeeContext";
import { useVoucherAPI } from "@/app/hooks/voucherAPI";
import { RegistrationFormData } from "@/app/api/registrations/registration.types";
import { useRegistrationAPI } from "@/app/hooks/registrationAPI";
import { useRegistrationPDF } from "@/app/hooks/useRegistrationPDF";
import { useCopyJSON } from "@/app/hooks/useCopyJSON";
import RegistrationStatusCard from "./RegistrationStatusCard";
import VoucherValidationStep, {
  type VoucherValidationState,
} from "./VoucherValidationStep";

type AttendeeFlowProps = {
  eventId: string;
};

type Screen = "landing" | "voucher" | "form" | "summary" | "closed-notice";

function AttendeeFlowInner({ eventId }: { eventId: string }) {
  const { auth } = useFirebase();
  const searchParams = useSearchParams();

  const { user, event, registration, loading } = useAttendee();

  const { validateVoucher, createVoucherCheckout } = useVoucherAPI();
  const { updateRegistrationStatus, updateRegistrationById } =
    useRegistrationAPI();
  const { generateRegistrationPDF } = useRegistrationPDF();
  const { copyJSON } = useCopyJSON();

  const [screen, setScreen] = useState<Screen>("landing");

  const [voucherCode, setVoucherCode] = useState("");
  const [voucherValidation, setVoucherValidation] =
    useState<VoucherValidationState>("idle");
  const [voucherError, setVoucherError] = useState<string>("");
  const [showVoucherLoginGate, setShowVoucherLoginGate] = useState(false);

  const [formData, setFormData] = useState<Partial<RegistrationFormData>>({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<
    Partial<RegistrationFormData>
  >({});
  const [editIsValid, setEditIsValid] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info";
  }>({ open: false, message: "", severity: "info" });

  const eventStatus = event?.status;
  const isOpen = eventStatus === "open";
  const isClosed = eventStatus === "closed";
  const isCanceled = eventStatus === "canceled";

  const compraHref = useMemo(() => `/evento/${eventId}/compra`, [eventId]);

  useEffect(() => {
    const handleKeyDown = async (event: KeyboardEvent) => {
      if (event.ctrlKey && event.altKey && event.key === "h") {
        event.preventDefault();

        if (registration) {
          try {
            await copyJSON(registration);
            console.log("Registration copiado para o clipboard!");
          } catch (error) {
            console.error("Erro ao copiar registration:", error);
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [registration, copyJSON]);

  // Roteamento determinístico das telas iniciais do fluxo de inscrição.
  useEffect(() => {
    if (!event || loading) return;
    if (registration) {
      setScreen("summary");
      return;
    }
    if (event.status === "open") {
      setScreen((current) =>
        current === "form" || current === "voucher" ? current : "voucher"
      );
      return;
    }
    setScreen("closed-notice");
  }, [event, registration, loading]);

  // Prefill voucher via query param quando entrar na tela de voucher
  useEffect(() => {
    if (screen !== "voucher") return;
    const voucherFromUrl = searchParams.get("voucher");
    if (voucherFromUrl && !voucherCode) {
      setVoucherCode(voucherFromUrl);
      void (async () => {
        setVoucherValidation("validating");
        try {
          await validateVoucher(voucherFromUrl);
          setVoucherValidation("valid");
          setVoucherError("");
        } catch (e) {
          setVoucherValidation("invalid");
          setVoucherError(e instanceof Error ? e.message : "Voucher inválido");
        }
      })();
    }
  }, [screen, searchParams, voucherCode, validateVoucher]);

  const canStartNewRegistration = isOpen;

  const handleValidateVoucher = async () => {
    const code = voucherCode.trim();
    if (!code) return;
    setVoucherValidation("validating");
    setVoucherError("");
    try {
      await validateVoucher(code);
      setVoucherValidation("valid");
    } catch (e) {
      setVoucherValidation("invalid");
      const msg = e instanceof Error ? e.message : "Voucher inválido";
      setVoucherError(msg);
    }
  };

  const handleSubmitRegistration = async () => {
    if (!user) return;
    if (voucherValidation !== "valid") return;
    if (!isFormValid) return;
    const code = voucherCode.trim();
    if (!code) return;

    try {
      setSubmitting(true);
      const registrationPayload: RegistrationFormData = {
        fullName: formData.fullName || "",
        email: formData.email || "",
        phone: formData.phone || "",
        cpf: formData.cpf || "",
        isPhoneWhatsapp: formData.isPhoneWhatsapp || false,
        credentialName: formData.credentialName || formData.fullName || "",
        occupation: formData.occupation || "",
        useImage: formData.useImage || false,
        howDidYouHearAboutUs: formData.howDidYouHearAboutUs || "",
        howDidYouHearAboutUsOther: formData.howDidYouHearAboutUsOther || "",
      };

      await createVoucherCheckout(code, {
        voucher: code,
        eventId,
        userId: user.uid,
        registration: registrationPayload,
      });

      setSnackbar({
        open: true,
        severity: "success",
        message: "Inscrição realizada com sucesso!",
      });
      setScreen("summary");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao criar inscrição";
      setSnackbar({ open: true, severity: "error", message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelRegistration = async () => {
    if (!registration) return;
    try {
      setSubmitting(true);
      await updateRegistrationStatus(registration.id, "cancelled");
      setSnackbar({
        open: true,
        severity: "success",
        message: "Inscrição cancelada com sucesso.",
      });
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Erro ao cancelar a inscrição";
      setSnackbar({ open: true, severity: "error", message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadReceipt = async () => {
    if (!registration) return;
    try {
      const result = await generateRegistrationPDF(registration, eventId);
      if (!result) throw new Error("Erro ao gerar comprovante");
      const { blob, eventName } = result;
      const fileName = `Comprovante_${eventName.replace(/[^a-zA-Z0-9]/g, "_")}_${registration.fullName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSnackbar({
        open: true,
        severity: "success",
        message: "Comprovante baixado com sucesso!",
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao gerar comprovante";
      setSnackbar({ open: true, severity: "error", message: msg });
    }
  };

  // Gate: evento inexistente no Firestore (ainda carregando ou não encontrado)
  if (loading && !event) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <Stack spacing={2} alignItems="center">
          <CircularProgress />
          <Typography variant="body2" color="text.secondary">
            Carregando dados do evento...
          </Typography>
        </Stack>
      </Box>
    );
  }
  if (!event) {
    return (
      <Alert severity="error">
        <AlertTitle>Evento não encontrado</AlertTitle>
        <Typography variant="body2">
          Não foi possível localizar este evento.
        </Typography>
      </Alert>
    );
  }

  // Screens
  if (screen === "voucher") {
    return (
      <Stack spacing={3}>
        {user ? <UserSessionBanner auth={auth} user={user} /> : null}

        <Alert severity="info" sx={{ maxWidth: 560, mx: "auto", width: "100%" }}>
          Não tem um voucher?
          <Box sx={{ mt: 1 }}>
            <Button
              component={Link}
              href={compraHref}
              variant="outlined"
              size="small"
              sx={{ textTransform: "none" }}
            >
              Comprar ingressos
            </Button>
          </Box>
        </Alert>

        <VoucherValidationStep
          value={voucherCode}
          onChange={(v) => {
            setVoucherCode(v);
            setVoucherValidation("idle");
            setVoucherError("");
          }}
          validationState={voucherValidation}
          errorMessage={voucherError}
          submitting={submitting}
          onValidate={handleValidateVoucher}
          onAdvance={() => {
            if (!user) {
              setShowVoucherLoginGate(true);
              return;
            }
            setShowVoucherLoginGate(false);
            setScreen("form");
          }}
          loginGate={
            !user && showVoucherLoginGate ? (
              <AuthCard
                auth={auth}
                title="Autenticação"
                description="Seu voucher já foi validado. Faça login para preencher seus dados e finalizar a inscrição."
                onAuthSuccess={() => {
                  setShowVoucherLoginGate(false);
                  setSnackbar({
                    open: true,
                    severity: "success",
                    message: "Autenticado com sucesso! Continue seu cadastro.",
                  });
                  setScreen("form");
                }}
              />
            ) : null
          }
        />
      </Stack>
    );
  }

  if (screen === "form") {
    if (!canStartNewRegistration) {
      return (
        <Alert severity="info">
          <AlertTitle>Inscrições indisponíveis</AlertTitle>
          <Typography variant="body2">
            {isCanceled
              ? "Este evento foi cancelado. Não é possível realizar novas inscrições."
              : "As inscrições para este evento estão encerradas. Não é possível realizar novas inscrições."}
          </Typography>
        </Alert>
      );
    }

    if (!user) {
      return (
        <Stack spacing={2}>
          <AuthCard
            auth={auth}
            title="Entrar para se inscrever"
            description="Faça login/crie sua conta para prosseguir."
            onAuthSuccess={() =>
              setSnackbar({
                open: true,
                severity: "success",
                message: "Autenticado com sucesso!",
              })
            }
          />
          <Box display="flex" justifyContent="center">
            <Button
              variant="outlined"
              onClick={() => setScreen("voucher")}
              startIcon={<ArrowBack />}
            >
              Voltar
            </Button>
          </Box>
        </Stack>
      );
    }

    return (
      <Stack spacing={3}>
        <UserSessionBanner auth={auth} user={user} />
        <Box>
          <Typography variant="h5" gutterBottom>
            Dados do participante
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Preencha seus dados para concluir a inscrição.
          </Typography>
        </Box>

        <Card sx={{ boxShadow: 2 }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <RegistrationForm
              initialData={formData}
              onDataChange={setFormData}
              onValidationChange={setIsFormValid}
            />
          </CardContent>
        </Card>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <Button
            variant="outlined"
            onClick={() => setScreen("voucher")}
            disabled={submitting}
            startIcon={<ArrowBack />}
          >
            Voltar
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleSubmitRegistration}
            disabled={
              submitting || !isFormValid || voucherValidation !== "valid"
            }
            startIcon={
              submitting ? (
                <CircularProgress size={20} />
              ) : (
                <ConfirmationNumber />
              )
            }
          >
            {submitting ? "Processando..." : "Confirmar inscrição"}
          </Button>
        </Stack>
      </Stack>
    );
  }

  if (screen === "summary") {
    if (!user) {
      return (
        <AuthCard
          auth={auth}
          title="Acessar minha inscrição"
          description="Faça login para visualizar sua inscrição."
        />
      );
    }

    if (!registration) {
      return (
        <Stack spacing={2}>
          <UserSessionBanner auth={auth} user={user} />
          <Alert severity="info">
            <AlertTitle>Nenhuma inscrição encontrada</AlertTitle>
            <Typography variant="body2">
              Não encontramos nenhuma inscrição para este usuário neste evento.
            </Typography>
          </Alert>

          {canStartNewRegistration ? (
            <Button
              variant="contained"
              onClick={() => setScreen("voucher")}
              startIcon={<PlayArrow />}
            >
              Iniciar inscrição
            </Button>
          ) : (
            <Button
              variant="outlined"
              onClick={() => setScreen("closed-notice")}
              startIcon={<ArrowBack />}
            >
              Voltar
            </Button>
          )}
        </Stack>
      );
    }

    const handleOpenEdit = () => {
      setEditError(null);
      setEditIsValid(false);
      setEditFormData({
        fullName: registration.fullName,
        email: registration.email,
        phone: registration.phone,
        cpf: registration.cpf,
        isPhoneWhatsapp: registration.isPhoneWhatsapp,
        credentialName: registration.credentialName,
        occupation: registration.occupation,
        useImage: registration.useImage,
        howDidYouHearAboutUs: registration.howDidYouHearAboutUs,
        howDidYouHearAboutUsOther: registration.howDidYouHearAboutUsOther,
      });
      setEditOpen(true);
    };

    const handleSaveEdit = async () => {
      try {
        setEditError(null);
        setEditSaving(true);
        const data = editFormData as RegistrationFormData;
        const processed: RegistrationFormData = {
          ...data,
          fullName: data.fullName?.toUpperCase() || "",
          credentialName: data.credentialName?.toUpperCase() || "",
          occupation: data.occupation?.toUpperCase() || "",
          howDidYouHearAboutUs: data.howDidYouHearAboutUs?.toUpperCase() || "",
          howDidYouHearAboutUsOther:
            data.howDidYouHearAboutUsOther?.toUpperCase() || "",
        };
        await updateRegistrationById(registration.id, processed);
        setEditOpen(false);
        setSnackbar({
          open: true,
          severity: "success",
          message: "Dados atualizados com sucesso!",
        });
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : "Erro ao atualizar inscrição";
        setEditError(msg);
      } finally {
        setEditSaving(false);
      }
    };

    return (
      <Stack spacing={2}>
        <UserSessionBanner auth={auth} user={user} />

        <RegistrationStatusCard status={registration.status} />

        <Card variant="outlined">
          <CardContent>
            <Stack spacing={1}>
              <Typography variant="body2">
                <strong>Nome:</strong> {registration.fullName}
              </Typography>
              <Typography variant="body2">
                <strong>Email:</strong> {registration.email || "-"}
              </Typography>
              <Typography variant="body2">
                <strong>Telefone:</strong> {registration.phone || "-"}
              </Typography>
              <Typography variant="body2">
                <strong>Nome para crachá:</strong>{" "}
                {registration.credentialName || "-"}
              </Typography>
            </Stack>
          </CardContent>
        </Card>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <Button
            variant="outlined"
            onClick={handleOpenEdit}
            disabled={submitting}
            startIcon={<Edit />}
          >
            Editar meus dados
          </Button>
          <Button
            variant="contained"
            onClick={handleDownloadReceipt}
            disabled={submitting}
            startIcon={<Download />}
          >
            Gerar comprovante
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={handleCancelRegistration}
            disabled={
              submitting ||
              registration.status === "cancelled" ||
              registration.status === "invalid"
            }
            startIcon={<Cancel />}
          >
            Cancelar inscrição
          </Button>
        </Stack>

        <Dialog
          open={editOpen}
          onClose={() => setEditOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Editar meus dados</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              {editError ? <Alert severity="error">{editError}</Alert> : null}
              <RegistrationForm
                initialData={editFormData}
                onDataChange={setEditFormData}
                onValidationChange={setEditIsValid}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              variant="outlined"
              onClick={() => setEditOpen(false)}
              disabled={editSaving}
              startIcon={<Cancel />}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              onClick={handleSaveEdit}
              disabled={editSaving || !editIsValid}
              startIcon={editSaving ? <CircularProgress size={18} /> : <Save />}
            >
              {editSaving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogActions>
        </Dialog>
      </Stack>
    );
  }

  if (screen === "closed-notice") {
    return (
      <Stack spacing={3}>
        {user ? <UserSessionBanner auth={auth} user={user} /> : null}

        <Alert severity={isCanceled ? "error" : "info"}>
          <AlertTitle>
            {isCanceled ? "Evento cancelado" : "Inscrições encerradas"}
          </AlertTitle>
          {user ? (
            <Typography variant="body2">
              {isCanceled
                ? "Este evento foi cancelado e não aceita novas inscrições."
                : "Este evento não aceita novas inscrições no momento."}
            </Typography>
          ) : (
            <Typography variant="body2">
              {isCanceled
                ? "Este evento foi cancelado e não aceita novas inscrições. Pessoas já inscritas podem fazer login para verificar sua inscrição."
                : "Este evento não recebe novas inscrições. Pessoas já inscritas podem fazer login para acompanhar sua inscrição e emitir declarações."}
            </Typography>
          )}
        </Alert>

        {!user ? (
          <AuthCard
            auth={auth}
            title="Acompanhar minha inscrição"
            description="Se você já está inscrito(a), faça login para consultar sua inscrição e emitir declarações."
            onAuthSuccess={() =>
              setSnackbar({
                open: true,
                severity: "success",
                message: "Autenticado com sucesso!",
              })
            }
          />
        ) : null}
      </Stack>
    );
  }

  // landing
  const isCheckingRegistration = Boolean(user) && loading;

  return (
    <Stack spacing={3}>
      {isCanceled ? (
        <Alert severity="error">
          <AlertTitle>Evento cancelado</AlertTitle>
          <Typography variant="body2">
            Este evento foi cancelado. Você ainda pode fazer login para
            verificar se já possui inscrição.
          </Typography>
        </Alert>
      ) : isClosed ? (
        <Alert severity="info">
          <AlertTitle>Inscrições encerradas</AlertTitle>
          <Typography variant="body2">
            As inscrições para este evento estão encerradas. Você ainda pode
            fazer login para acessar sua inscrição.
          </Typography>
        </Alert>
      ) : null}

      {user ? <UserSessionBanner auth={auth} user={user} /> : null}

      {isCheckingRegistration ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
          <Stack spacing={1} alignItems="center">
            <CircularProgress size={24} />
            <Typography variant="body2" color="text.secondary">
              Verificando sua inscrição...
            </Typography>
          </Stack>
        </Box>
      ) : user && registration ? null : (
        <Box>
          <Typography variant="h6" gutterBottom>
            Opções
          </Typography>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              gap: 2,
              width: "100%",
            }}
          >
            <Card sx={{ flex: "1 1 50%" }}>
              <CardActionArea
                onClick={() => setScreen("voucher")}
                disabled={!canStartNewRegistration}
              >
                <CardContent>
                  <Stack spacing={1}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <ConfirmationNumber color="primary" />
                      <Typography variant="h6">
                        Inscrever-se com voucher
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Use um voucher para se inscrever (sem compra).
                    </Typography>
                    {!canStartNewRegistration ? (
                      <Typography variant="caption" color="text.secondary">
                        Indisponível porque o evento não está com inscrições
                        abertas.
                      </Typography>
                    ) : null}
                  </Stack>
                </CardContent>
              </CardActionArea>
            </Card>

            <Card sx={{ flex: "1 1 50%" }}>
              <CardActionArea component={Link} href={compraHref}>
                <CardContent>
                  <Stack spacing={1}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <ShoppingCart color="primary" />
                      <Typography variant="h6">Comprar ingressos</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Ir para o fluxo de compra (checkout).
                    </Typography>
                  </Stack>
                </CardContent>
              </CardActionArea>
            </Card>
          </Box>
        </Box>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Stack>
  );
}

export default function AttendeeFlow({ eventId }: AttendeeFlowProps) {
  const { auth } = useFirebase();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsub();
  }, [auth]);

  if (authLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <Stack spacing={2} alignItems="center">
          <CircularProgress />
          <Typography variant="body2" color="text.secondary">
            Carregando autenticação...
          </Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <AttendeeProvider user={user} eventId={eventId}>
      <AttendeeFlowInner eventId={eventId} />
    </AttendeeProvider>
  );
}
