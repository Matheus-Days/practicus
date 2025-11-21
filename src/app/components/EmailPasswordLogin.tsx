"use client";

import { useState, FormEvent } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { Auth } from "firebase/auth";
import {
  Box,
  TextField,
  Button,
  Alert,
  Stack,
  Typography,
  Link,
} from "@mui/material";
import { Person, Lock, Error, CheckCircle } from "@mui/icons-material";

interface EmailPasswordLoginProps {
  auth: Auth;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export default function EmailPasswordLogin({
  auth,
  onSuccess,
  onError,
}: EmailPasswordLoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
        setMessage("Conta criada com sucesso!");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        setMessage("Login realizado com sucesso!");
      }
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("Error authenticating:", error);
      
      let errorMessage = "Erro ao autenticar";
      
      switch (error.code) {
        case "auth/user-not-found":
          errorMessage = "Usuário não encontrado";
          break;
        case "auth/wrong-password":
          errorMessage = "Senha incorreta";
          break;
        case "auth/invalid-email":
          errorMessage = "Usuário inválido";
          break;
        case "auth/user-disabled":
          errorMessage = "Esta conta foi desabilitada";
          break;
        case "auth/email-already-in-use":
          errorMessage = "Este usuário já está em uso";
          break;
        case "auth/weak-password":
          errorMessage = "A senha é muito fraca. Use pelo menos 6 caracteres";
          break;
        case "auth/invalid-credential":
          errorMessage = "Credenciais inválidas";
          break;
        default:
          errorMessage = error.message || "Erro ao autenticar";
      }
      
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Stack spacing={3}>
        <TextField
          id="email"
          label="Usuário"
          type="text"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          fullWidth
          placeholder="nome de usuário"
          disabled={loading}
          InputProps={{
            startAdornment: (
              <Person sx={{ mr: 1, color: "text.secondary" }} />
            ),
          }}
        />

        <TextField
          id="password"
          label="Senha"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          fullWidth
          disabled={loading}
          placeholder={isSignUp ? "Mínimo 6 caracteres" : "Digite sua senha"}
          InputProps={{
            startAdornment: (
              <Lock sx={{ mr: 1, color: "text.secondary" }} />
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
          {loading
            ? "Processando..."
            : isSignUp
            ? "Criar conta"
            : "Entrar"}
        </Button>

        <Box textAlign="center">
          <Typography variant="body2" color="text.secondary">
            {isSignUp ? "Já tem uma conta?" : "Não tem uma conta?"}{" "}
            <Link
              component="button"
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setMessage("");
                setPassword("");
              }}
              sx={{ textTransform: "none", cursor: "pointer" }}
            >
              {isSignUp ? "Fazer login" : "Criar conta"}
            </Link>
          </Typography>
        </Box>

        {message && (
          <Alert
            severity={message.includes("Erro") || message.includes("incorreta") || message.includes("inválid") ? "error" : "success"}
            icon={
              message.includes("Erro") || message.includes("incorreta") || message.includes("inválid") ? (
                <Error />
              ) : (
                <CheckCircle />
              )
            }
          >
            {message}
          </Alert>
        )}
      </Stack>
    </Box>
  );
}

