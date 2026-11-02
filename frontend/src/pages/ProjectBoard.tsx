import { Navigate, useParams } from 'react-router-dom';
import Tasks from './Tasks';

/** O `key` força um novo estado ao trocar de projeto (ex.: /projects/1 → /projects/2). */
export default function ProjectBoard() {
  const { projectId } = useParams<{ projectId: string }>();
  const id = Number(projectId);
  if (!Number.isInteger(id) || id <= 0) return <Navigate to="/projects" replace />;
  return <Tasks key={id} projectId={id} />;
}
