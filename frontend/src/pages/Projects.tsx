import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Modal } from '../components/Modal';
import { TextArea, TextField } from '../components/Field';
import { useToast } from '../components/Toast';
import * as projectsApi from '../api/projects';
import { getErrorMessage } from '../api/client';
import { ROLE_LABEL } from '../lib/roles';
import type { Project } from '../types';

export default function Projects() {
  const toast = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setProjects(await projectsApi.listProjects());
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function closeModal() {
    setOpen(false);
    setName('');
    setDescription('');
    setFormError('');
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setFormError('');
    try {
      const created = await projectsApi.createProject({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      setProjects((cur) => [created, ...cur]);
      toast.success('Projeto criado.');
      closeModal();
    } catch (err) {
      setFormError(getErrorMessage(err, 'Não foi possível criar o projeto.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl tracking-wide uppercase">Projetos</h1>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="bg-amber-400 px-4 py-2 font-medium text-board-950 transition-colors hover:bg-amber-300"
        >
          + Novo projeto
        </button>
      </div>

      {error && (
        <div role="alert" className="mb-4 flex items-center justify-between gap-4 border border-rust-500/30 bg-rust-500/10 p-3 text-sm text-rust-300">
          <span>{error}</span>
          <button type="button" onClick={() => void load()} className="shrink-0 underline">
            Tentar novamente
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Carregando projetos">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse border border-board-700 bg-board-800" />
          ))}
        </div>
      ) : projects.length === 0 && !error ? (
        <div className="border border-dashed border-board-700 px-4 py-16 text-center">
          <p className="font-display text-xl tracking-wide uppercase">Nenhum projeto ainda</p>
          <p className="mt-1 text-sm text-ink-500">
            Crie um projeto para organizar tarefas com outras pessoas, atribuir responsáveis e comentar.
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <li key={p.id}>
              <Link
                to={`/projects/${p.id}`}
                className="block h-full border border-board-700 border-t-2 border-t-amber-400 bg-board-800 p-4 transition-colors hover:bg-board-700"
              >
                <h2 className="font-display text-xl tracking-wide uppercase">{p.name}</h2>
                {p.description && <p className="mt-1 line-clamp-2 text-sm text-ink-300">{p.description}</p>}
                <p className="mt-3 font-mono text-xs text-ink-500">
                  {ROLE_LABEL[p.myRole]} · {p.memberCount} {p.memberCount === 1 ? 'membro' : 'membros'}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {open && (
        <Modal titleId="project-modal-title" onClose={saving ? () => {} : closeModal}>
          <h2 id="project-modal-title" className="mb-4 font-display text-xl tracking-wide uppercase">
            Novo projeto
          </h2>
          <form onSubmit={handleCreate} className="space-y-3">
            <TextField label="Nome" value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} autoFocus />
            <TextArea label="Descrição" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={500} />
            {formError && (
              <p role="alert" className="text-sm text-rust-400">
                {formError}
              </p>
            )}
            <div className="flex justify-end gap-4 pt-2">
              <button type="button" onClick={closeModal} disabled={saving} className="px-2 py-2 text-ink-300 hover:text-ink-100 disabled:opacity-50">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving || !name.trim()}
                className="bg-amber-400 px-4 py-2 font-medium text-board-950 hover:bg-amber-300 disabled:opacity-50"
              >
                {saving ? 'Criando…' : 'Criar'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </Layout>
  );
}
