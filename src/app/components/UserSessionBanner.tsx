"use client";

import { User } from "firebase/auth";
import { Auth } from "firebase/auth";
import { Alert, Box, Button, Typography } from "@mui/material";

type Props = {
  auth: Auth;
  user: User;
  label?: string;
};

export default function UserSessionBanner({ auth, user, label }: Props) {
  return (
    <Alert
      severity="success"
      sx={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        "& .MuiAlert-message": {
          flex: 1,
        },
      }}
    >
      <Box
        sx={{
          width: "100%",
          display: "flex",
          gap: 2,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography variant="body2">
          Autenticado com:&nbsp;
          <strong>{user.email}</strong>
        </Typography>
        <Button
          variant="outlined"
          color="inherit"
          onClick={() => auth.signOut()}
          sx={{ textTransform: "none" }}
        >
          Sair
        </Button>
      </Box>
    </Alert>
  );
}
