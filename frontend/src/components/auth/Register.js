import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  Paper, TextField, Button, Typography, Box, Alert, CircularProgress,
  Stepper, Step, StepLabel,
} from "@mui/material";
import BrandPanel from "./BrandPanel";

const Register = () => {
  const navigate = useNavigate();
  const { register, loading } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    username: "", email: "", fullName: "", password: "", confirmPassword: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const validateStep = () => {
    if (activeStep === 0) {
      if (!formData.username || !formData.email || !formData.fullName) {
        setError("Preencha todos os campos");
        return false;
      }
      if (!/\S+@\S+\.\S+/.test(formData.email)) {
        setError("Informe um e-mail válido");
        return false;
      }
      return true;
    }
    if (activeStep === 1) {
      if (formData.password.length < 6) {
        setError("A senha deve ter pelo menos 6 caracteres");
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError("As senhas não coincidem");
        return false;
      }
      return true;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => setActiveStep((prev) => prev - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep()) return;
    const result = await register({
      username: formData.username,
      email: formData.email,
      fullName: formData.fullName,
      password: formData.password,
    });
    if (result.success) {
      navigate("/dashboard");
    } else {
      setError(result.error);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex" }}>
      <BrandPanel
        eyebrow="Comece agora"
        title="Um quadro só seu para tirar as ideias do papel."
        subtitle="Organize, priorize e acompanhe cada tarefa até o fim."
      />
      <Box
        sx={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
          px: 3, py: 6, bgcolor: "background.default",
        }}
      >
        <Paper elevation={0} sx={{ p: { xs: 3, sm: 5 }, width: "100%", maxWidth: 420, border: "1px solid", borderColor: "divider" }}>
          <Typography variant="h6" sx={{ mb: 3 }}>Criar conta</Typography>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            <Step><StepLabel>Perfil</StepLabel></Step>
            <Step><StepLabel>Senha</StepLabel></Step>
          </Stepper>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <form onSubmit={handleSubmit}>
            {activeStep === 0 && (
              <>
                <TextField fullWidth label="Nome completo" name="fullName" value={formData.fullName}
                  onChange={handleChange} required sx={{ mb: 2 }} autoFocus />
                <TextField fullWidth label="Usuário" name="username" value={formData.username}
                  onChange={handleChange} required sx={{ mb: 2 }} />
                <TextField fullWidth label="E-mail" name="email" type="email" value={formData.email}
                  onChange={handleChange} required sx={{ mb: 2 }} />
              </>
            )}
            {activeStep === 1 && (
              <>
                <TextField fullWidth type="password" label="Senha" name="password"
                  value={formData.password} onChange={handleChange} required sx={{ mb: 2 }} autoFocus />
                <TextField fullWidth type="password" label="Confirmar senha" name="confirmPassword"
                  value={formData.confirmPassword} onChange={handleChange} required sx={{ mb: 2 }} />
              </>
            )}
            <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
              {activeStep > 0 && (
                <Button variant="outlined" onClick={handleBack} sx={{ flex: 1, py: 1.4 }}>
                  Voltar
                </Button>
              )}
              {activeStep < 1 ? (
                <Button variant="contained" onClick={handleNext} sx={{ flex: 1, py: 1.4 }}>
                  Avançar
                </Button>
              ) : (
                <Button fullWidth type="submit" variant="contained" size="large"
                  disabled={loading} sx={{ py: 1.4 }}>
                  {loading ? <CircularProgress size={22} color="inherit" /> : "Criar conta"}
                </Button>
              )}
            </Box>
          </form>
          <Box sx={{ textAlign: "center", mt: 3 }}>
            <Typography variant="body2" color="textSecondary">
              Já tem uma conta?{" "}
              <Link to="/login" style={{ color: "#1C2541", fontWeight: 600, textDecoration: "none" }}>Entrar</Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default Register;
