import { Link } from 'react-router-dom';

const chats = [
  {
    id: 'mg',
    name: 'María García',
    status: 'Ahora',
    preview: 'Mensaje protegido con acertijo',
    badge: 2,
  },
  {
    id: 'cr',
    name: 'Carlos Ruiz',
    status: '12:30',
    preview: 'Se revelará el 14 de febrero',
    badge: 1,
  },
  {
    id: 'fm',
    name: 'Familia',
    status: '11:15',
    preview: '¡La fiesta será increíble!',
    badge: 0,
  },
  {
    id: 'al',
    name: 'Ana López',
    status: 'Ayer',
    preview: 'Necesitas la contraseña',
    badge: 1,
  },
  {
    id: 'pm',
    name: 'Pedro Martínez',
    status: 'Ayer',
    preview: 'Mensaje revelado',
    badge: 0,
  },
];

export function ChatsPage() {
  return (
    <section className="page">
      <header className="page-header">
        <h2>UNLOKD</h2>
        <button className="icon-button" type="button" aria-label="Nuevo chat">
          +
        </button>
      </header>

      <div className="search-bar">
        <input type="text" placeholder="Buscar conversaciones..." />
      </div>

      <div className="list">
        {chats.map((chat) => (
          <Link key={chat.id} to={`/chat/${chat.id}`} className="list-item">
            <div className="avatar">{chat.name.slice(0, 2).toUpperCase()}</div>
            <div className="list-item__body">
              <div className="list-item__title">{chat.name}</div>
              <div className="list-item__subtitle">{chat.preview}</div>
            </div>
            <div className="list-item__meta">
              <span>{chat.status}</span>
              {chat.badge > 0 && (
                <span className="badge">{chat.badge}</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
