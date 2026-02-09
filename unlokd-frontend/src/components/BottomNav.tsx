import { NavLink } from 'react-router-dom';

const links = [
  { to: '/chats', label: 'Chats', icon: '💬' },
  { to: '/contacts', label: 'Contactos', icon: '👥' },
  { to: '/discover', label: 'Descubrir', icon: '✨' },
  { to: '/profile', label: 'Perfil', icon: '👤' },
];

export function BottomNav() {
  return (
    <nav className="bottom-nav">
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) =>
            `bottom-nav__item${isActive ? ' is-active' : ''}`
          }
        >
          <span className="bottom-nav__icon" aria-hidden>
            {link.icon}
          </span>
          <span className="bottom-nav__label">{link.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
