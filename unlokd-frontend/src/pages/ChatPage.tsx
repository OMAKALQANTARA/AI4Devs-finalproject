import { Link, useParams } from 'react-router-dom';

const messages = [
  { id: 1, type: 'incoming', text: '¡Hola! Tengo algo especial para ti 🎁' },
  { id: 2, type: 'outgoing', text: '¡Cuéntame! 😍' },
  {
    id: 3,
    type: 'locked',
    title: 'Mensaje bloqueado',
    text: '¿Qué tiene llaves pero no puede abrir puertas?',
    action: 'Intentar desbloquear',
  },
  {
    id: 4,
    type: 'locked',
    title: 'Mensaje bloqueado',
    text: 'Se revelará el 14 de Feb, 2025',
    action: 'Intentar desbloquear',
  },
  { id: 5, type: 'outgoing', text: '¡Me encanta este juego! 😍' },
  {
    id: 6,
    type: 'locked',
    title: 'Mensaje bloqueado',
    text: 'Protegido con contraseña',
    action: 'Intentar desbloquear',
  },
  {
    id: 7,
    type: 'revealed',
    text: '¡Sorpresa! Reservé una cena para los dos este viernes.',
  },
];

export function ChatPage() {
  const { chatId } = useParams();

  return (
    <section className="page chat-page">
      <header className="chat-header">
        <Link to="/chats" className="icon-button" aria-label="Regresar">
          ←
        </Link>
        <div className="chat-header__info">
          <div className="avatar">MG</div>
          <div>
            <h3>María García</h3>
            <p className="is-online">En línea</p>
          </div>
        </div>
        <div className="chat-header__actions">
          <button className="icon-button" type="button" aria-label="Llamar">
            📞
          </button>
          <button className="icon-button" type="button" aria-label="Video">
            🎥
          </button>
        </div>
      </header>

      <div className="chat-thread">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message message--${message.type}`}
          >
            {'title' in message && (
              <p className="message__title">{message.title}</p>
            )}
            <p>{message.text}</p>
            {'action' in message && (
              <button className="message__action" type="button">
                {message.action}
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="chat-input">
        <button className="icon-button" type="button" aria-label="Agregar">
          +
        </button>
        <input
          type="text"
          placeholder={`Escribe un mensaje...${chatId ? '' : ''}`}
        />
        <button className="icon-button" type="button" aria-label="Enviar">
          ➤
        </button>
      </div>
    </section>
  );
}
