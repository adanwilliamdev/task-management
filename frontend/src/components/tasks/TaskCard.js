import React, { useState } from "react";
import { Card, CardContent, Typography, Box, Chip, IconButton, Menu, MenuItem, Divider } from "@mui/material";
import { MoreVert, Edit, Delete, Schedule } from "@mui/icons-material";
import { format, formatDistanceToNow, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";

const PRIORITY_LABEL = { HIGH: "Alta", MEDIUM: "Média", LOW: "Baixa" };
const STATUS_LABEL = { TODO: "A fazer", IN_PROGRESS: "Em andamento", DONE: "Concluído" };

const TaskCard = ({ task, onEdit, onDelete }) => {
  const [anchorEl, setAnchorEl] = useState(null);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "HIGH": return "error";
      case "MEDIUM": return "warning";
      case "LOW": return "success";
      default: return "default";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "TODO": return "warning";
      case "IN_PROGRESS": return "info";
      case "DONE": return "success";
      default: return "default";
    }
  };

  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  const isOverdue = dueDate && task.status !== "DONE" && isPast(dueDate);

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: "1px solid",
        borderColor: isOverdue ? "error.main" : "divider",
        transition: "all 0.2s ease",
        "&:hover": { transform: "translateY(-2px)", boxShadow: "0 8px 20px rgba(28,37,65,0.08)" },
      }}
    >
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Box sx={{ flex: 1, mr: 1 }}>
            <Typography variant="subtitle1" sx={{ mb: 0.5 }}>
              {task.title}
            </Typography>
            {task.description && (
              <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                {task.description}
              </Typography>
            )}
          </Box>
          <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)}>
            <MoreVert fontSize="small" />
          </IconButton>
        </Box>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1 }}>
          <Chip label={PRIORITY_LABEL[task.priority] || "Média"} size="small" color={getPriorityColor(task.priority)} variant="outlined" />
          <Chip label={STATUS_LABEL[task.status] || task.status} size="small" color={getStatusColor(task.status)} />
          {dueDate && (
            <Chip
              icon={<Schedule fontSize="small" />}
              label={format(dueDate, "dd/MM/yyyy")}
              size="small"
              variant="outlined"
              color={isOverdue ? "error" : "default"}
            />
          )}
        </Box>
        {dueDate && (
          <Typography variant="caption" color={isOverdue ? "error.main" : "textSecondary"} sx={{ display: "block", mt: 1, fontWeight: isOverdue ? 600 : 400 }}>
            {isOverdue ? "Atrasada · vencia " : "Vence "}
            {formatDistanceToNow(dueDate, { addSuffix: true, locale: ptBR })}
          </Typography>
        )}
      </CardContent>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        <MenuItem onClick={() => { setAnchorEl(null); onEdit(task); }}>
          <Edit fontSize="small" sx={{ mr: 1 }} /> Editar
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { setAnchorEl(null); onDelete(task.id); }} sx={{ color: "error.main" }}>
          <Delete fontSize="small" sx={{ mr: 1 }} /> Excluir
        </MenuItem>
      </Menu>
    </Card>
  );
};

export default TaskCard;
