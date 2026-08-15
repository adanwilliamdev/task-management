import React from "react";
import { Box, Typography, Stack } from "@mui/material";

const previewRows = [
  { label: "Redesenhar onboarding", tone: "#F5A623" },
  { label: "Revisar proposta do cliente", tone: "#3F7DD1" },
  { label: "Publicar release notas", tone: "#2FA47C" },
];

// The signature element: a miniature, static preview of the kanban board itself,
// standing in for the product rather than a generic illustration.
const BrandPanel = ({ eyebrow, title, subtitle }) => (
  <Box
    sx={{
      flex: 1,
      display: { xs: "none", md: "flex" },
      flexDirection: "column",
      justifyContent: "space-between",
      p: 6,
      color: "#fff",
      background: "linear-gradient(160deg, #1C2541 0%, #111830 70%)",
      position: "relative",
      overflow: "hidden",
    }}
  >
    <Box>
      <Typography variant="overline" sx={{ letterSpacing: 3, color: "#F5A623", fontWeight: 700 }}>
        RUMO
      </Typography>
      <Typography variant="overline" sx={{ display: "block", opacity: 0.6, mt: 3, letterSpacing: 2 }}>
        {eyebrow}
      </Typography>
      <Typography variant="h4" sx={{ mt: 1, maxWidth: 380 }}>
        {title}
      </Typography>
      <Typography variant="body1" sx={{ mt: 2, opacity: 0.75, maxWidth: 340 }}>
        {subtitle}
      </Typography>
    </Box>

    <Stack spacing={1.5} sx={{ maxWidth: 320 }}>
      {previewRows.map((row) => (
        <Box
          key={row.label}
          sx={{
            display: "flex", alignItems: "center", gap: 1.5,
            bgcolor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 2, px: 2, py: 1.4,
          }}
        >
          <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: row.tone, flexShrink: 0 }} />
          <Typography variant="body2" sx={{ opacity: 0.85 }}>{row.label}</Typography>
        </Box>
      ))}
    </Stack>
  </Box>
);

export default BrandPanel;
