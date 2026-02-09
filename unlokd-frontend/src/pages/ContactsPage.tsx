const onlineContacts = [
  { id: 'mg', name: 'María García', status: 'En línea' },
  { id: 'cr', name: 'Carlos Ruiz', status: 'En línea' },
  { id: 'ls', name: 'Laura Sánchez', status: 'En línea' },
];

const offlineContacts = [
  { id: 'al', name: 'Ana López', status: 'Hace 2h' },
  { id: 'pm', name: 'Pedro Martínez', status: 'Hace 1d' },
  { id: 'dt', name: 'Diego Torres', status: 'Hace 30m' },
];

export function ContactsPage() {
  return (
    <section className="page">
      <header className="page-header">
        <h2>Contactos</h2>
        <button
          className="icon-button"
          type="button"
          aria-label="Agregar contacto"
        >
          👤+
        </button>
      </header>

      <div className="search-bar">
        <input type="text" placeholder="Buscar contactos..." />
      </div>

      <h3 className="section-title">En línea — {onlineContacts.length}</h3>
      <div className="list">
        {onlineContacts.map((contact) => (
          <div key={contact.id} className="list-item">
            <div className="avatar">{contact.name.slice(0, 2).toUpperCase()}</div>
            <div className="list-item__body">
              <div className="list-item__title">{contact.name}</div>
              <div className="list-item__subtitle is-online">
                {contact.status}
              </div>
            </div>
            <button className="kebab-button" type="button" aria-label="Opciones">
              ⋮
            </button>
          </div>
        ))}
      </div>

      <h3 className="section-title">Fuera de línea — {offlineContacts.length}</h3>
      <div className="list">
        {offlineContacts.map((contact) => (
          <div key={contact.id} className="list-item">
            <div className="avatar muted">
              {contact.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="list-item__body">
              <div className="list-item__title">{contact.name}</div>
              <div className="list-item__subtitle">{contact.status}</div>
            </div>
            <button className="kebab-button" type="button" aria-label="Opciones">
              ⋮
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
