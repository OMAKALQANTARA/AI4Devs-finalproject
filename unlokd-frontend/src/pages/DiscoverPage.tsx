const cards = [
  {
    title: 'Desafío de la semana',
    description: 'Envía un mensaje con acertijo y gana insignias especiales.',
    action: 'Participar',
  },
];

const conditionTypes = [
  { title: 'Acertijos creativos', description: 'Haz que tus amigos piensen.' },
  { title: 'Cápsulas del tiempo', description: 'Programa mensajes especiales.' },
  { title: 'Mensajes secretos', description: 'Protege confesiones con claves.' },
  { title: 'Verificación biométrica', description: 'Solo tú puedes leerlos.' },
];

export function DiscoverPage() {
  return (
    <section className="page">
      <header className="page-header page-header--stacked">
        <h2>Descubrir</h2>
        <p className="page-subtitle">Ideas para mensajes inolvidables</p>
      </header>

      <div className="highlight-card">
        <div className="highlight-card__icon">⚡</div>
        <div>
          <h3>{cards[0].title}</h3>
          <p>{cards[0].description}</p>
        </div>
        <button className="secondary-button" type="button">
          {cards[0].action}
        </button>
      </div>

      <h3 className="section-title">Tipos de condición</h3>
      <div className="grid">
        {conditionTypes.map((item) => (
          <div key={item.title} className="grid-card">
            <h4>{item.title}</h4>
            <p>{item.description}</p>
          </div>
        ))}
      </div>

      <h3 className="section-title">Tendencias</h3>
      <div className="list">
        <div className="list-item">
          <div className="trend-icon">📈</div>
          <div className="list-item__body">
            <div className="list-item__title">San Valentín sorpresa</div>
            <div className="list-item__subtitle">2.4k usos esta semana</div>
          </div>
          <span className="badge is-rank">#1</span>
        </div>
      </div>
    </section>
  );
}
