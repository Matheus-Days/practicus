"use client";

import { useState, FormEvent } from "react";
import { sendSignInLinkToEmail, Auth } from "firebase/auth";
import {
  Box,
  TextField,
  Button,
  Alert,
  Stack,
} from "@mui/material";
import { Email, Error, CheckCircle } from "@mui/icons-material";

interface EmailLinkLoginProps {
  auth: Auth;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export default function EmailLinkLogin({
  auth,
  onSuccess,
  onError,
}: EmailLinkLoginProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSendSignInLink = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const actionCodeSettings = {
        url: window.location.href,
        handleCodeInApp: true,
      };

      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem("emailForSignIn", email);
      const successMessage =
        "Link de autenticação enviado para seu email! Verifique sua caixa de spams caso não encontre em sua caixa de entrada.";
      setMessage(successMessage);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("Error sending sign-in link:", error);
      const errorMessage = "Erro ao enviar link de autenticação.";
      setMessage(errorMessage);
      
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSendSignInLink}>
      <Stack spacing={3}>
        <TextField
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          fullWidth
          placeholder="seu@email.com"
          disabled={loading}
          InputProps={{
            startAdornment: (
              <Email sx={{ mr: 1, color: "text.secondary" }} />
            ),
          }}
        />

        <Button
          type="submit"
          variant="contained"
          disabled={loading}
          fullWidth
          size="large"
        >
          {loading ? "Enviando..." : "Enviar link de login"}
        </Button>

        {message && (
          <Alert
            severity={message.includes("Erro") ? "error" : "success"}
            icon={message.includes("Erro") ? <Error /> : <CheckCircle />}
          >
            {message}
          </Alert>
        )}
      </Stack>
    </Box>
  );
}

