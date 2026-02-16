import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SegmentedTabs } from '../components/SegmentedTabs';
import { loginUser, registerUser } from '../services/auth';
import { setAuthToken } from '../utils/auth';

type Mode = 'login' | 'signup';

const tabOptions = [
  { id: 'login' as const, label: 'Iniciar sesión' },
  { id: 'signup' as const, label: 'Registrarse' },
];

export function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('login');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    passwordConfirm: '',
  });

  const ctaLabel = useMemo(
    () => (mode === 'login' ? 'Entrar' : 'Crear cuenta'),
    [mode],
  );

  const handleChange = (name: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email)) {
        setError('Ingresa un email válido.');
        return;
      }
      if (form.password.length < 8) {
        setError('La contraseña debe tener al menos 8 caracteres.');
        return;
      }
      if (mode === 'signup') {
        if (!form.fullName.trim()) {
          setError('Ingresa tu nombre completo.');
          return;
        }
        if (form.password !== form.passwordConfirm) {
          setError('Las contraseñas no coinciden.');
          return;
        }
      }

      if (mode === 'login') {
        const response = await loginUser({
          email: form.email,
          password: form.password,
        });
        const token = response.accessToken ?? response.token;
        if (token) {
          setAuthToken(token);
        }
        setSuccess('Inicio de sesión exitoso.');
        navigate('/chats', { replace: true });
      } else {
        await registerUser({
          fullName: form.fullName,
          email: form.email,
          password: form.password,
          passwordConfirm: form.passwordConfirm,
        });
        setSuccess('Cuenta creada. Ya puedes iniciar sesión.');
        setMode('login');
      }
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : 'No se pudo completar la solicitud.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-hero">
        <div className="auth-logo">
          <span className="auth-logo__icon">🔒</span>
        </div>
        <h1 className="auth-title">UNLOKD</h1>
        <p className="auth-subtitle">Mensajes que se merecen</p>
      </div>

      <SegmentedTabs options={tabOptions} value={mode} onChange={setMode} />

      <form className="auth-form" onSubmit={handleSubmit}>
        {mode === 'signup' && (
          <label className="input-field">
            <span className="input-field__label">Nombre completo</span>
            <input
              type="text"
              placeholder="Nombre Apellido"
              value={form.fullName}
              onChange={(event) => handleChange('fullName', event.target.value)}
              required
            />
          </label>
        )}

        <label className="input-field">
          <span className="input-field__label">Email</span>
          <input
            type="email"
            placeholder="nombre@email.com"
            value={form.email}
            onChange={(event) => handleChange('email', event.target.value)}
            required
          />
        </label>

        <label className="input-field">
          <span className="input-field__label">Contraseña</span>
          <input
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={(event) => handleChange('password', event.target.value)}
            required
          />
        </label>

        {mode === 'signup' && (
          <label className="input-field">
            <span className="input-field__label">Confirmar contraseña</span>
            <input
              type="password"
              placeholder="••••••••"
              value={form.passwordConfirm}
              onChange={(event) =>
                handleChange('passwordConfirm', event.target.value)
              }
              required
            />
          </label>
        )}

        {error && <p className="form-feedback is-error">{error}</p>}
        {success && <p className="form-feedback is-success">{success}</p>}

        <button className="primary-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Procesando...' : ctaLabel}
          <span aria-hidden> →</span>
        </button>
      </form>

      {mode === 'signup' && (
        <div className="auth-tip">
          ✨ Crea mensajes con condiciones: acertijos, contraseñas, fechas
          especiales y más.
        </div>
      )}
    </section>
  );
}
