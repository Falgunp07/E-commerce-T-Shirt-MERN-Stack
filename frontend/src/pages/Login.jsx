import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { FiLogIn } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { validateEmail, validatePassword } from '../utils/validation';

export default function Login() {
  const { user, loading: authLoading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!authLoading && user) return <Navigate to="/profile" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    const emailError = validateEmail(form.email);
    const passwordError = validatePassword(form.password);
    if (emailError || passwordError) {
      setError(emailError || passwordError);
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await login(form);
      navigate(location.state?.from || '/profile', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-[72vh] items-center justify-center px-4 py-12">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Account</div>
        <h1 className="mt-2 text-3xl font-black text-brand-ink">Sign in</h1>
        <div className="mt-6 space-y-4">
          <label className="block text-sm font-semibold text-brand-ink">
            Email
            <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal outline-none focus:border-brand-ink focus:bg-white" />
          </label>
          <label className="block text-sm font-semibold text-brand-ink">
            Password
            <input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal outline-none focus:border-brand-ink focus:bg-white" />
          </label>
        </div>
        {error && <p className="mt-4 text-sm font-semibold text-red-500">{error}</p>}
        <button type="submit" disabled={submitting} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-black px-5 py-3.5 text-sm font-semibold text-white disabled:opacity-60">
          <FiLogIn />
          {submitting ? 'Signing in...' : 'Sign in'}
        </button>
        <p className="mt-5 text-center text-sm text-slate-600">
          New to ThreadLab? <Link to="/register" className="font-semibold text-brand-ink">Create an account</Link>
        </p>
      </form>
    </main>
  );
}
