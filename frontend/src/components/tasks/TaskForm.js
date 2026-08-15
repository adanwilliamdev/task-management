import React, { useState, useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  FormControl, InputLabel, Select, MenuItem, Box, IconButton, Typography, Divider,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { ptBR } from "date-fns/locale";
import { useTasks } from "../../contexts/TaskContext";
import { format } from "date-fns";

const TaskForm = ({ open, onClose, task }) => {
  const { createTask, updateTask } = useTasks();
  const [formData, setFormData] = useState({
    title: "", description: "", status: "TODO", priority: "MEDIUM", dueDate: null,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || "",
        description: task.description || "",
        status: task.status || "TODO",
        priority: task.priority || "MEDIUM",
        dueDate: task.dueDate ? new Date(task.dueDate) : null,
      });
    } else {
      setFormData({ title: "", description: "", status: "TODO", priority: "MEDIUM", dueDate: null });
    }
    setErrors({});
  }, [task, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      setErrors({ title: "O título é obrigatório" });
      return;
    }
    const data = {
      ...formData,
      dueDate: formData.dueDate ? format(formData.dueDate, "yyyy-MM-dd'T'HH:mm:ss.SSS") : null,
    };
    const result = task ? await updateTask(task.id, data) : await createTask(data);
    if (result.success) onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1 }}>
          <Typography variant="h5" component="span">{task ? "Editar tarefa" : "Nova tarefa"}</Typography>
          <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          <TextField fullWidth label="Título" name="title" value={formData.title} onChange={handleChange}
            error={!!errors.title} helperText={errors.title} required sx={{ mb: 2 }} autoFocus />
          <TextField fullWidth label="Descrição" name="description" value={formData.description}
            onChange={handleChange} multiline rows={3} sx={{ mb: 2 }} />
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 2 }}>
            <FormControl sx={{ flex: 1, minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select name="status" value={formData.status} onChange={handleChange} label="Status">
                <MenuItem value="TODO">A fazer</MenuItem>
                <MenuItem value="IN_PROGRESS">Em andamento</MenuItem>
                <MenuItem value="DONE">Concluído</MenuItem>
              </Select>
            </FormControl>
            <FormControl sx={{ flex: 1, minWidth: 120 }}>
              <InputLabel>Prioridade</InputLabel>
              <Select name="priority" value={formData.priority} onChange={handleChange} label="Prioridade">
                <MenuItem value="LOW">Baixa</MenuItem>
                <MenuItem value="MEDIUM">Média</MenuItem>
                <MenuItem value="HIGH">Alta</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <DatePicker label="Data de vencimento" value={formData.dueDate} onChange={(date) => setFormData((prev) => ({ ...prev, dueDate: date }))}
            slotProps={{ textField: { fullWidth: true } }} />
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button onClick={onClose} variant="outlined" sx={{ px: 3 }}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained" sx={{ px: 3 }}>
            {task ? "Salvar" : "Criar"}
          </Button>
        </DialogActions>
      </LocalizationProvider>
    </Dialog>
  );
};

export default TaskForm;
