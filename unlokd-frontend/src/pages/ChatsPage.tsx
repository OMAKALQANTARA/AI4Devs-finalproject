import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { createDirectChat, listChats } from '../services/chats';
import type { Chat } from '../services/chats';

export function ChatsPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [query, setQuery] = useState('');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    const loadChats = async () => {
      try {
        const data = await listChats();
        setChats(data);
      } catch (error) {
        setFeedback(
          error instanceof Error ? error.message : 'No se pudieron cargar chats.',
        );
      }
    };
    loadChats();
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.toLowerCase();
    return chats.filter((chat) =>
      (chat.title ?? chat.publicId).toLowerCase().includes(normalized),
    );
  }, [chats, query]);

  const handleCreate = async () => {
    const raw = window.prompt('ID de usuario para chat directo');
    if (!raw) return;
    const contactId = Number(raw);
    if (!Number.isFinite(contactId)) {
      setFeedback('ID inválido');
      return;
    }

    try {
      const chat = await createDirectChat(contactId);
      setChats((prev) => [chat, ...prev.filter((item) => item.id !== chat.id)]);
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : 'No se pudo crear el chat.',
      );
    }
  };

  return (
    <section className="page">
      <header className="page-header">
        <h2>UNLOKD</h2>
        <button
          className="icon-button"
          type="button"
          aria-label="Nuevo chat"
          onClick={handleCreate}
        >
          +
        </button>
      </header>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Buscar conversaciones..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      {feedback && <p className="form-feedback is-error">{feedback}</p>}

      <div className="list">
        {filtered.map((chat) => (
          <Link key={chat.id} to={`/chat/${chat.id}`} className="list-item">
            <div className="avatar">
              {(chat.title ?? 'CH').slice(0, 2).toUpperCase()}
            </div>
            <div className="list-item__body">
              <div className="list-item__title">
                {chat.title ?? `Chat ${chat.publicId.slice(0, 6)}`}
              </div>
              <div className="list-item__subtitle">Chat directo</div>
            </div>
            <div className="list-item__meta">
              <span>{new Date(chat.createdAt).toLocaleTimeString()}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
