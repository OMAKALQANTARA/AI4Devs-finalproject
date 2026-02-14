import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyProfile, updateMyProfile, uploadAvatar } from '../services/users';
import type { UserProfile } from '../services/users';
import { clearAuthToken } from '../utils/auth';
import { API_BASE_URL } from '../services/api';

const stats = [
  { label: 'Enviados', value: 142 },
  { label: 'Revelados', value: 98 },
  { label: 'Acertijos', value: 37 },
];

const settings = [
  { title: 'Notificaciones', subtitle: 'Push, sonidos, alertas' },
  { title: 'Privacidad y seguridad', subtitle: 'Bloqueos, reportes' },
  { title: 'Apariencia', subtitle: 'Tema, idioma' },
];

export function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [status, setStatus] = useState('');
  const [feedback, setFeedback] = useState('');
  const avatarSrc =
    profile?.avatarUrl && !profile.avatarUrl.startsWith('http')
      ? `${API_BASE_URL}${profile.avatarUrl}`
      : profile?.avatarUrl ?? null;
  const visibleName = displayName || profile?.displayName || 'Tu nombre';
  const initials = (displayName || profile?.displayName || 'JD')
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await getMyProfile();
        setProfile(data);
        setDisplayName(data.displayName ?? '');
        setStatus(data.presenceStatus ?? 'En línea');
      } catch (error) {
        setFeedback(
          error instanceof Error ? error.message : 'No se pudo cargar el perfil.',
        );
      }
    };
    loadProfile();
  }, []);

  const handleSave = async () => {
    setFeedback('');
    try {
      const trimmedName = displayName.trim();
      if (!trimmedName) {
        setFeedback('El nombre visible no puede estar vacío.');
        return;
      }
      const updated = await updateMyProfile({
        displayName: trimmedName,
        presenceStatus: status,
      });
      setProfile((current) => ({
        ...(current ?? updated),
        ...updated,
        displayName: updated.displayName ?? trimmedName,
      }));
      setDisplayName(updated.displayName ?? trimmedName);
      setStatus(updated.presenceStatus ?? status);
      setFeedback('Perfil actualizado.');
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : 'No se pudo actualizar el perfil.',
      );
    }
  };

  const handleLogout = () => {
    clearAuthToken();
    navigate('/auth', { replace: true });
  };

  const handleAvatarChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFeedback('');
    try {
      const updated = await uploadAvatar(file);
      setProfile(updated);
      setFeedback('Avatar actualizado.');
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : 'No se pudo subir el avatar.',
      );
    }
  };

  return (
    <section className="page">
      <div className="profile-header">
        <label className="avatar avatar--large avatar--editable">
          {avatarSrc ? (
            <img src={avatarSrc} alt="Avatar" />
          ) : (
            <span>{initials}</span>
          )}
          <span className="avatar__badge">📷</span>
          <input type="file" accept="image/*" onChange={handleAvatarChange} />
        </label>
        <h2>{visibleName}</h2>
        <p className="profile-handle">@{profile?.username ?? 'usuario'}</p>
        <span className="status-pill">● {status}</span>
      </div>

      <div className="input-field">
        <span className="input-field__label">Nombre visible</span>
        <input
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          placeholder="Tu nombre"
        />
      </div>
      <button className="primary-button" type="button" onClick={handleSave}>
        Guardar cambios
      </button>
      {feedback && <p className="form-feedback is-success">{feedback}</p>}

      <div className="stats-card">
        {stats.map((item) => (
          <div key={item.label} className="stats-card__item">
            <span className="stats-card__value">{item.value}</span>
            <span className="stats-card__label">{item.label}</span>
          </div>
        ))}
      </div>

      <div className="list">
        {settings.map((item) => (
          <div key={item.title} className="list-item">
            <div className="list-item__body">
              <div className="list-item__title">{item.title}</div>
              <div className="list-item__subtitle">{item.subtitle}</div>
            </div>
            <span className="chevron">›</span>
          </div>
        ))}
      </div>

      <div className="premium-card">
        <div>
          <h4>UNLOKD Premium</h4>
          <p>Desbloquea más condiciones</p>
        </div>
        <span className="chevron">›</span>
      </div>

      <button className="ghost-button" type="button" onClick={handleLogout}>
        Cerrar sesión
      </button>
    </section>
  );
}
