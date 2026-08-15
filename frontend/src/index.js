import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#1C2541", light: "#3A4A73", dark: "#111830", contrastText: "#fff" },
    secondary: { main: "#F5A623" },
    success: { main: "#2FA47C" },
    warning: { main: "#F5A623" },
    info: { main: "#3F7DD1" },
    error: { main: "#E0553F" },
    background: { default: "#F5F6FA", paper: "#FFFFFF" },
    text: { primary: "#1B1F27", secondary: "#636B7A" },
    divider: "#E6E8F0",
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
    h4: { fontFamily: '"Manrope", sans-serif', fontWeight: 800, letterSpacing: "-0.02em" },
    h5: { fontFamily: '"Manrope", sans-serif', fontWeight: 700, letterSpacing: "-0.01em" },
    h6: { fontFamily: '"Manrope", sans-serif', fontWeight: 700 },
    subtitle1: { fontFamily: '"Manrope", sans-serif', fontWeight: 600 },
    button: { fontFamily: '"Manrope", sans-serif' },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 14, transition: "all 0.2s ease" },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 10, textTransform: "none", fontWeight: 600 },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600 },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: "none" },
      },
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
