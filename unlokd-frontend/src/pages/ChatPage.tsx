import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getChatDetails } from '../services/chats';
import type { Chat } from '../services/chats';
import { getChatMessages, sendMessage } from '../services/messages';
import type { Message } from '../services/messages';

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
  const [chat, setChat] = useState<Chat | null>(null);
  const [feedback, setFeedback] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (!chatId) return;
    const loadChat = async () => {
      try {
        const data = await getChatDetails(Number(chatId));
        setChat(data);
      } catch (error) {
        setFeedback(
          error instanceof Error ? error.message : 'No se pudo cargar el chat.',
        );
      }
    };
    loadChat();
  }, [chatId]);

  useEffect(() => {
    if (!chatId) return;
    const loadMessages = async () => {
      try {
        const data = await getChatMessages(Number(chatId));
        setMessages(data.messages);
        setNextCursor(data.nextCursor);
      } catch (error) {
        setFeedback(
          error instanceof Error ? error.message : 'No se pudo cargar mensajes.',
        );
      }
    };
    loadMessages();
  }, [chatId]);

  const isOwnMessage = useMemo(() => {
    return (message: Message) => message.senderId === 1;
  }, []);

  const handleLoadMore = async () => {
    if (!chatId || !nextCursor) return;
    try {
      const data = await getChatMessages(Number(chatId), nextCursor);
      setMessages((prev) => [...prev, ...data.messages]);
      setNextCursor(data.nextCursor);
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : 'No se pudo cargar más.',
      );
    }
  };

  const handleSend = async () => {
    if (!chatId || !draft.trim()) return;
    try {
      const created = await sendMessage({
        chatId: Number(chatId),
        contentText: draft.trim(),
      });
      setMessages((prev) => [created, ...prev]);
      setDraft('');
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : 'No se pudo enviar mensaje.',
      );
    }
  };

  return (
    <section className="page chat-page">
      <header className="chat-header">
        <Link to="/chats" className="icon-button" aria-label="Regresar">
          ←
        </Link>
        <div className="chat-header__info">
          <div className="avatar">
            {(chat?.title ?? 'CH').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h3>{chat?.title ?? 'Chat directo'}</h3>
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

      {feedback && <p className="form-feedback is-error">{feedback}</p>}

      <div className="chat-thread">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message message--${
              isOwnMessage(message) ? 'outgoing' : 'incoming'
            }`}
          >
            <p>{message.contentText}</p>
          </div>
        ))}
      </div>

      {nextCursor && (
        <button className="secondary-button" type="button" onClick={handleLoadMore}>
          Cargar más
        </button>
      )}

      <div className="chat-input">
        <button className="icon-button" type="button" aria-label="Agregar">
          +
        </button>
        <input
          type="text"
          placeholder="Escribe un mensaje..."
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <button
          className="icon-button"
          type="button"
          aria-label="Enviar"
          onClick={handleSend}
        >
          ➤
        </button>
      </div>
    </section>
  );
}
