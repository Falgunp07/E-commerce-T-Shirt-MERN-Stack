import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { FiLogIn, FiLock } from 'react-icons/fi';
import { SignIn } from '@clerk/react';
import { useAuth } from '../context/AuthContext';
import { validateEmail, validatePassword } from '../utils/validation';

const HAS_CLERK = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

export default function Login() {
  const { user, loading: authLoading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [useLocal, setUseLocal] = useState(!HAS_CLERK);
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

  function fillDemoCustomer() {
    setForm({ email: 'james.miller@gmail.com', password: 'user123' });
    setUseLocal(true);
  }

  return (
    <main className="flex min-h-[72vh] flex-col items-center justify-center px-4 py-12">
      {HAS_CLERK && !useLocal ? (
        <div className="flex flex-col items-center">
          <div className="w-full max-w-md overflow-hidden rounded-3xl shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
            <SignIn
              routing="path"
              path="/login"
              signUpUrl="/register"
              fallbackRedirectUrl="/profile"
            />
          </div>
          <button
            type="button"
            onClick={() => setUseLocal(true)}
            className="mt-6 text-xs font-semibold text-slate-500 hover:text-brand-ink transition underline"
          >
            Or sign in with demo password account
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Account</div>
            {HAS_CLERK && (
              <button
                type="button"
                onClick={() => setUseLocal(false)}
                className="text-xs font-semibold text-brand-pink hover:underline"
              >
                Use Clerk / Google Login
              </button>
            )}
          </div>
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
          <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
            <button type="button" onClick={fillDemoCustomer} className="text-brand-ink font-semibold hover:underline">
              Fill Demo Customer
            </button>
            <Link to="/admin/login" className="text-slate-500 hover:text-brand-ink flex items-center gap-1">
              <FiLock /> Admin portal
            </Link>
          </div>
          <p className="mt-5 text-center text-sm text-slate-600">
            New to ThreadLab? <Link to="/register" className="font-semibold text-brand-ink">Create an account</Link>
          </p>
        </form>
      )}
    </main>
  );
}
