"use client";

import { ReactNode } from "react";
import { Auth } from "firebase/auth";
import { Box, Card, CardContent, Container, Stack, Typography } from "@mui/material";
import EmailPasswordLogin from "./EmailPasswordLogin";

type Props = {
  auth: Auth;
  title: string;
  description?: string;
  onAuthSuccess?: () => void;
  footer?: ReactNode;
};

export default function AuthCard({
  auth,
  title,
  description,
  onAuthSuccess,
  footer,
}: Props) {
  return (
    <Container maxWidth="md">
      <Card variant="outlined">
        <CardContent sx={{ p: 4 }}>
          <Stack spacing={3}>
            <Box textAlign="center">
              <Typography variant="h5" component="h3" gutterBottom>
                {title}
              </Typography>
              {description && (
                <Typography variant="body2" color="text.secondary">
                  {description}
                </Typography>
              )}
            </Box>

            <EmailPasswordLogin auth={auth} onSuccess={onAuthSuccess} />

            {footer ? <Box>{footer}</Box> : null}
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}

