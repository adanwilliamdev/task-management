import React, { createContext, useState, useContext, useEffect } from "react";
import api from "../services/api";
import toast from "react-hot-toast";
import { useAuth } from "./AuthContext";

const TaskContext = createContext();

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) throw new Error("useTasks must be used within TaskProvider");
  return context;
};

export const TaskProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await api.get("/tasks");
      setTasks(response.data);
    } catch (error) {
      toast.error("Não foi possível carregar as tarefas");
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (taskData) => {
    try {
      const response = await api.post("/tasks", taskData);
      setTasks((prev) => [response.data, ...prev]);
      toast.success("Tarefa criada!");
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.message || "Não foi possível criar a tarefa");
      return { success: false };
    }
  };

  const updateTask = async (id, taskData) => {
    try {
      const response = await api.put(`/tasks/${id}`, taskData);
      setTasks((prev) => prev.map((task) => (task.id === id ? response.data : task)));
      toast.success("Tarefa atualizada!");
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.message || "Não foi possível atualizar a tarefa");
      return { success: false };
    }
  };

  const updateTaskStatus = async (id, status) => {
    try {
      const response = await api.patch(`/tasks/${id}/status`, status, {
        headers: { "Content-Type": "application/json" },
      });
      setTasks((prev) => prev.map((task) => (task.id === id ? response.data : task)));
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.message || "Não foi possível atualizar o status");
      return { success: false };
    }
  };

  const deleteTask = async (id) => {
    try {
      await api.delete(`/tasks/${id}`);
      setTasks((prev) => prev.filter((task) => task.id !== id));
      toast.success("Tarefa excluída!");
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.message || "Não foi possível excluir a tarefa");
      return { success: false };
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchTasks();
    } else {
      setTasks([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  return (
    <TaskContext.Provider
      value={{ tasks, loading, fetchTasks, createTask, updateTask, updateTaskStatus, deleteTask }}
    >
      {children}
    </TaskContext.Provider>
  );
};
