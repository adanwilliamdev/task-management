import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  Paper, TextField, Button, Typography, Box, Alert, CircularProgress,
} from "@mui/material";
import { TaskAlt } from "@mui/icons-material";
import BrandPanel from "./BrandPanel";

const Login = () => {
  const navigate = useNavigate();
  const { login, loading } = useAuth();
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(formData.username, formData.password);
    if (result.success) {
      navigate("/dashboard");
    } else {
      setError(result.error);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex" }}>
      <BrandPanel
        eyebrow="Bem-vindo de volta"
        title="Continue de onde parou."
        subtitle="Seu quadro, suas prioridades, sempre à mão."
      />
      <Box
        sx={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
          px: 3, py: 6, bgcolor: "background.default",
        }}
      >
        <Paper elevation={0} sx={{ p: { xs: 3, sm: 5 }, width: "100%", maxWidth: 420, border: "1px solid", borderColor: "divider" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 4 }}>
            <TaskAlt sx={{ color: "secondary.main", fontSize: 28 }} />
            <Typography variant="h6">Entrar</Typography>
          </Box>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth label="Usuário" name="username" value={formData.username}
              onChange={handleChange} required sx={{ mb: 2 }} autoFocus
            />
            <TextField
              fullWidth type="password" label="Senha" name="password"
              value={formData.password} onChange={handleChange} required sx={{ mb: 3 }}
            />
            <Button
              fullWidth type="submit" variant="contained" size="large"
              disabled={loading} sx={{ py: 1.4 }}
            >
              {loading ? <CircularProgress size={22} color="inherit" /> : "Entrar"}
            </Button>
          </form>
          <Box sx={{ textAlign: "center", mt: 3 }}>
            <Typography variant="body2" color="textSecondary">
              Ainda não tem conta?{" "}
              <Link to="/register" style={{ color: "#1C2541", fontWeight: 600, textDecoration: "none" }}>Criar conta</Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default Login;
