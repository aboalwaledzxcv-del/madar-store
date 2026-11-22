import { useState } from 'react';
import { ShieldCheck, UserCheck, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { tr } from '../i18n';

export default function AuthModal() {
  const { lang, authOpen, setAuthOpen, login, register, toast } = useStore();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  if (!authOpen) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === 'login') await login(email, password);
      else await register(name, email, password);
    } catch (err) {
      toast((err as Error).message, 'err');
    } finally {
      setBusy(false);
    }
  };

  const quickDemo = async (demoEmail: string, demoPass: string) => {
    setBusy(true);
    try {
      await login(demoEmail, demoPass);
    } catch (err) {
      toast((err as Error).message, 'err');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={() => setAuthOpen(false)}>
      <div className="auth-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close" aria-label="Close" onClick={() => setAuthOpen(false)}>
          <X size={20} />
        </button>

        <div className="auth-logo">
          <span>MADAR<small>.</small></span>
        </div>

        <h2>{mode === 'login' ? tr(lang, 'authTitleSignIn') : tr(lang, 'authTitleRegister')}</h2>

        <form onSubmit={submit} className="auth-form">
          {mode === 'register' && (
            <label>
              <span>{tr(lang, 'name')}</span>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
          )}
          <label>
            <span>{tr(lang, 'email')}</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label>
            <span>{tr(lang, 'password')}</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </label>

          <button type="submit" className="btn-amz-primary full" disabled={busy}>
            {mode === 'login' ? tr(lang, 'signIn') : tr(lang, 'authTitleRegister')}
          </button>
        </form>

        <div className="demo-box">
          <button
            id="btn-demo-customer"
            type="button"
            className="btn-demo"
            disabled={busy}
            onClick={() => void quickDemo('customer@madar.store', 'Amazon123!')}
          >
            <UserCheck size={16} />
            <span>{tr(lang, 'demoCustomer')}</span>
          </button>
          <button
            id="btn-demo-admin"
            type="button"
            className="btn-demo admin"
            disabled={busy}
            onClick={() => void quickDemo('admin@madar.store', 'Admin123!')}
          >
            <ShieldCheck size={16} />
            <span>{tr(lang, 'demoAdmin')}</span>
          </button>
        </div>

        <button
          type="button"
          className="auth-switch"
          onClick={() => setMode((m) => (m === 'login' ? 'register' : 'login'))}
        >
          {mode === 'login' ? tr(lang, 'switchRegister') : tr(lang, 'switchLogin')}
        </button>
      </div>
    </div>
  );
}
