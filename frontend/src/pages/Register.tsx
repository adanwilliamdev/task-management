import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../api/client';
import { Field, fieldClass } from '../components/Field';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('As senhas não conferem.');
      return;
    }
    setLoading(true);
    try {
      await register(username.trim(), email.trim(), password);
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
          <Field label="Usuário" hint="3 a 50 caracteres: letras, números, ponto, hífen e underline.">
            {(id) => (
              <input
                id={id}
                className={fieldClass}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                minLength={3}
                maxLength={50}
                pattern="[A-Za-z0-9._\-]+"
                title="Letras, números, ponto, hífen e underline"
                autoComplete="username"
                required
                autoFocus
              />
            )}
          </Field>
          <Field label="Email">
            {(id) => (
              <input
                id={id}
                type="email"
                className={fieldClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={120}
                autoComplete="email"
                required
              />
            )}
          </Field>
          <Field label="Senha" hint="Mínimo de 6 caracteres.">
            {(id) => (
              <input
                id={id}
                type="password"
                className={fieldClass}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                maxLength={72}
                autoComplete="new-password"
                required
              />
            )}
          </Field>
          <Field label="Confirmar senha">
            {(id) => (
              <input
                id={id}
                type="password"
                className={fieldClass}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
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
