import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { deleteChat, listChats } from '../services/chats';
import type { Chat } from '../services/chats';

export function ChatsPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [query, setQuery] = useState('');
  const [feedback, setFeedback] = useState('');
  const [pendingDelete, setPendingDelete] = useState<Chat | null>(null);

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

  const handleDeleteChat = (chat: Chat) => {
    setPendingDelete(chat);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteChat(pendingDelete.id);
      setChats((prev) => prev.filter((item) => item.id !== pendingDelete.id));
      setPendingDelete(null);
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : 'No se pudo eliminar el chat.',
      );
    }
  };

  return (
    <section className="page">
      <header className="page-header">
        <h2>UNLOKD</h2>
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
              {(chat.peerDisplayName ?? chat.title ?? 'CH')
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div className="list-item__body">
              <div className="list-item__title">
                {chat.peerDisplayName ??
                  chat.title ??
                  (chat.type === 'DIRECT'
                    ? 'Chat directo'
                    : `Chat ${chat.publicId.slice(0, 6)}`)}
              </div>
              <div className="list-item__subtitle">
                {chat.type === 'DIRECT' ? 'Chat directo' : 'Chat grupal'}
              </div>
            </div>
            <div className="list-item__meta">
              <span>{new Date(chat.createdAt).toLocaleTimeString()}</span>
            </div>
            <button
              className="kebab-button"
              type="button"
              aria-label="Eliminar chat"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                handleDeleteChat(chat);
              }}
            >
              🗑️
            </button>
          </Link>
        ))}
      </div>

      {pendingDelete && (
        <div
          className="modal-backdrop"
          onClick={() => setPendingDelete(null)}
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-chat-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="modal__header">
              <h3 id="delete-chat-title">Eliminar chat</h3>
              <button
                className="icon-button"
                type="button"
                aria-label="Cerrar"
                onClick={() => setPendingDelete(null)}
              >
                ✕
              </button>
            </header>
            <div className="modal__body">
              <p>¿Eliminar este chat?</p>
              <div className="modal__actions">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => setPendingDelete(null)}
                >
                  Cancelar
                </button>
                <button
                  className="primary-button"
                  type="button"
                  onClick={handleConfirmDelete}
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
