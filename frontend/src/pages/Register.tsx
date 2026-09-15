import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../api/client';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(username, email, password);
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
          <p className="mt-1 font-mono text-xs tracking-wide text-ink-500">NOVO CADASTRO</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-ink-300">Usuário</label>
            <input
              className="w-full border border-board-700 bg-board-900 px-3 py-2 text-ink-100 outline-none focus:border-amber-400"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              minLength={3}
              required
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-ink-300">Email</label>
            <input
              type="email"
              className="w-full border border-board-700 bg-board-900 px-3 py-2 text-ink-100 outline-none focus:border-amber-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-ink-300">Senha</label>
            <input
              type="password"
              className="w-full border border-board-700 bg-board-900 px-3 py-2 text-ink-100 outline-none focus:border-amber-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>
          {error && <p className="text-sm text-rust-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-400 py-2 font-medium text-board-950 transition-colors hover:bg-amber-300 disabled:opacity-50"
          >
            {loading ? 'Criando…' : 'Criar conta'}
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-ink-500">
          Já tem conta?{' '}
          <Link to="/login" className="text-amber-400 hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
