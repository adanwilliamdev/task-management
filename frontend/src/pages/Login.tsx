import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../api/client';
import { Field, fieldClass } from '../components/Field';

export default function Login() {
  const { login, sessionExpired } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/tasks');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-board-950 px-4 text-ink-100">
      <div className="w-full max-w-sm border-t-4 border-amber-400 bg-board-800 p-8">
        <div className="mb-7 text-center">
          <h1 className="font-display text-3xl tracking-wide uppercase">
            Task<span className="text-amber-400">Flow</span>
          </h1>
          <p className="mt-1 font-mono text-xs tracking-wide text-ink-500">TERMINAL DE ACESSO</p>
        </div>
        {sessionExpired && !error && (
          <p role="status" className="mb-4 border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-300">
            Sua sessão expirou. Entre novamente para continuar.
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Usuário">
            {(id) => (
              <input
                id={id}
                className={fieldClass}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
                autoFocus
              />
            )}
          </Field>
          <Field label="Senha">
            {(id) => (
              <input
                id={id}
                type="password"
                className={fieldClass}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            )}
          </Field>
          {error && (
            <p role="alert" className="text-sm text-rust-400">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-400 py-2 font-medium text-board-950 transition-colors hover:bg-amber-300 disabled:opacity-50"
          >
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-ink-500">
          Não tem conta?{' '}
          <Link to="/register" className="text-amber-400 hover:underline">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  );
}
