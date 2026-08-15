import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useTasks } from "../../contexts/TaskContext";
import {
  AppBar, Toolbar, Typography, Container, Grid, Box, Chip, IconButton,
  Fab, Paper, Avatar, TextField, InputAdornment, LinearProgress, Skeleton, Tooltip,
} from "@mui/material";
import { Logout, Add, Search, TaskAlt } from "@mui/icons-material";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import TaskCard from "./TaskCard";
import TaskForm from "./TaskForm";

const columns = [
  { id: "TODO", title: "A fazer", icon: "📝" },
  { id: "IN_PROGRESS", title: "Em andamento", icon: "🔄" },
  { id: "DONE", title: "Concluído", icon: "✅" },
];

const initials = (name = "") =>
  name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { tasks, loading, updateTaskStatus, deleteTask } = useTasks();
  const [openTaskForm, setOpenTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [search, setSearch] = useState("");

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    const { draggableId, destination, source } = result;
    if (destination.droppableId === source.droppableId) return;
    await updateTaskStatus(draggableId, destination.droppableId);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setOpenTaskForm(true);
  };

  const handleDeleteTask = async (id) => {
    if (window.confirm("Tem certeza que deseja excluir esta tarefa?")) {
      await deleteTask(id);
    }
  };

  const filteredTasks = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return tasks;
    return tasks.filter(
      (task) =>
        task.title?.toLowerCase().includes(term) ||
        task.description?.toLowerCase().includes(term)
    );
  }, [tasks, search]);

  const getTasksByStatus = (status) => filteredTasks.filter((task) => task.status === status);

  const completion = tasks.length
    ? Math.round((tasks.filter((t) => t.status === "DONE").length / tasks.length) * 100)
    : 0;

  return (
    <Box sx={{ flexGrow: 1, minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
        <Toolbar>
          <TaskAlt sx={{ color: "secondary.main", mr: 1 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Rumo
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main", fontSize: 14 }}>
              {initials(user?.fullName || user?.username || "?")}
            </Avatar>
            <Typography variant="body2" sx={{ display: { xs: "none", sm: "block" } }}>
              {user?.fullName || user?.username}
            </Typography>
            <Tooltip title="Sair">
              <IconButton onClick={handleLogout} size="small" color="error">
                <Logout fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center", justifyContent: "space-between", mb: 3 }}>
          <Box>
            <Typography variant="h4">Seu quadro</Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
              {tasks.length === 0
                ? "Nenhuma tarefa por aqui ainda"
                : `${tasks.length} tarefa${tasks.length > 1 ? "s" : ""} · ${completion}% concluído`}
            </Typography>
          </Box>
          <TextField
            size="small"
            placeholder="Buscar tarefas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: 260, bgcolor: "background.paper" }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" color="disabled" />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {tasks.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <LinearProgress
              variant="determinate"
              value={completion}
              sx={{ height: 8, borderRadius: 4, bgcolor: "divider", "& .MuiLinearProgress-bar": { borderRadius: 4, bgcolor: "success.main" } }}
            />
          </Box>
        )}

        <DragDropContext onDragEnd={handleDragEnd}>
          <Grid container spacing={3}>
            {columns.map((column) => {
              const columnTasks = getTasksByStatus(column.id);
              return (
                <Grid item xs={12} md={4} key={column.id}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: "#F0F1F6", borderRadius: 3, minHeight: 420 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                      <Typography variant="subtitle1">
                        {column.icon} {column.title}
                      </Typography>
                      <Chip label={columnTasks.length} size="small" sx={{ bgcolor: "background.paper", fontWeight: 700 }} />
                    </Box>

                    {loading ? (
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        {[1, 2].map((n) => (
                          <Skeleton key={n} variant="rounded" height={110} sx={{ borderRadius: 2 }} />
                        ))}
                      </Box>
                    ) : (
                      <Droppable droppableId={column.id}>
                        {(provided, snapshot) => (
                          <Box
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            sx={{
                              minHeight: 200,
                              bgcolor: snapshot.isDraggingOver ? "rgba(28, 37, 65, 0.06)" : "transparent",
                              borderRadius: 2,
                              transition: "background-color 0.2s ease",
                              p: 0.5,
                            }}
                          >
                            {columnTasks.length === 0 && !snapshot.isDraggingOver && (
                              <Box sx={{ textAlign: "center", py: 4, color: "text.secondary" }}>
                                <Typography variant="body2">
                                  {search ? "Nenhum resultado aqui" : "Nada por aqui"}
                                </Typography>
                              </Box>
                            )}
                            {columnTasks.map((task, index) => (
                              <Draggable key={task.id} draggableId={task.id} index={index}>
                                {(provided, snapshot) => (
                                  <Box
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    sx={{ mb: 2, opacity: snapshot.isDragging ? 0.85 : 1 }}
                                  >
                                    <TaskCard task={task} onEdit={handleEditTask} onDelete={handleDeleteTask} />
                                  </Box>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </Box>
                        )}
                      </Droppable>
                    )}
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </DragDropContext>
      </Container>

      <Fab
        color="secondary"
        sx={{ position: "fixed", bottom: 24, right: 24, color: "#1B1F27" }}
        onClick={() => { setEditingTask(null); setOpenTaskForm(true); }}
      >
        <Add />
      </Fab>

      <TaskForm open={openTaskForm} onClose={() => { setOpenTaskForm(false); setEditingTask(null); }} task={editingTask} />
    </Box>
  );
};

export default Dashboard;
