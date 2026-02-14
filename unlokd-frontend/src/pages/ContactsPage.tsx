import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { addContactByEmail, deleteContact, listContacts } from '../services/contacts';
import type { Contact } from '../services/contacts';
import { createDirectChat } from '../services/chats';

export function ContactsPage() {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [query, setQuery] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [emailDraft, setEmailDraft] = useState('');
  const [modalFeedback, setModalFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Contact | null>(null);

  useEffect(() => {
    const loadContacts = async () => {
      try {
        const data = await listContacts();
        setContacts(data);
      } catch (error) {
        setFeedback(
          error instanceof Error ? error.message : 'No se pudieron cargar contactos.',
        );
      }
    };
    loadContacts();
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.toLowerCase();
    return contacts.filter((contact) =>
      `${contact.displayName} ${contact.email}`.toLowerCase().includes(normalized),
    );
  }, [contacts, query]);

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setModalFeedback('');
    setEmailDraft('');
  };

  const handleCloseModal = () => {
    if (isSubmitting) return;
    setIsModalOpen(false);
    setModalFeedback('');
  };

  const handleAddContact = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!emailDraft.trim()) {
      setModalFeedback('Ingresa un email válido.');
      return;
    }
    try {
      setIsSubmitting(true);
      const created = await addContactByEmail({ email: emailDraft.trim() });
      setContacts((prev) => {
        const next = prev.filter((item) => item.id !== created.id);
        return [created, ...next];
      });
      setFeedback('');
      setIsModalOpen(false);
      setEmailDraft('');
    } catch (error) {
      setModalFeedback(
        error instanceof Error ? error.message : 'No se pudo agregar contacto.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartChat = async (contact: Contact) => {
    try {
      const chat = await createDirectChat(contact.contactUserId);
      navigate(`/chat/${chat.id}`);
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : 'No se pudo abrir el chat.',
      );
    }
  };

  const handleDeleteContact = (contact: Contact) => {
    setPendingDelete(contact);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteContact(pendingDelete.contactUserId);
      setContacts((prev) => prev.filter((item) => item.id !== pendingDelete.id));
      setPendingDelete(null);
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : 'No se pudo eliminar el contacto.',
      );
    }
  };

  return (
    <section className="page">
      <header className="page-header">
        <h2>Contactos</h2>
        <button
          className="icon-button"
          type="button"
          aria-label="Agregar contacto"
          onClick={handleOpenModal}
        >
          👤+
        </button>
      </header>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Buscar contactos..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      {feedback && <p className="form-feedback is-error">{feedback}</p>}

      <div className="list">
        {filtered.map((contact) => (
          <div key={contact.id} className="list-item">
            {(() => {
              const normalized = (contact.presenceStatus ?? '').toLowerCase();
              const isOnline =
                normalized.length > 0 &&
                normalized !== 'offline' &&
                normalized !== 'desconectado';
              const statusLabel = isOnline ? 'En línea' : 'Desconectado';

              return (
                <>
                  <div className={`avatar ${isOnline ? '' : 'muted'}`}>
                    {contact.displayName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="list-item__body">
                    <div className="list-item__title">{contact.displayName}</div>
                    <div
                      className={`list-item__subtitle ${
                        isOnline ? 'is-online' : ''
                      }`}
                    >
                      {statusLabel}
                    </div>
                  </div>
                </>
              );
            })()}
            <button
              className="kebab-button"
              type="button"
              aria-label="Iniciar chat"
              onClick={() => handleStartChat(contact)}
            >
              💬
            </button>
            <button
              className="kebab-button"
              type="button"
              aria-label="Eliminar contacto"
              onClick={() => handleDeleteContact(contact)}
            >
              🗑️
            </button>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="modal-backdrop" onClick={handleCloseModal}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-contact-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="modal__header">
              <h3 id="add-contact-title">Agregar contacto</h3>
              <button
                className="icon-button"
                type="button"
                aria-label="Cerrar"
                onClick={handleCloseModal}
              >
                ✕
              </button>
            </header>
            <form className="modal__body" onSubmit={handleAddContact}>
              <label className="input-field">
                <span className="input-field__label">Email</span>
                <input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={emailDraft}
                  onChange={(event) => setEmailDraft(event.target.value)}
                  required
                />
              </label>
              {modalFeedback && (
                <p className="form-feedback is-error">{modalFeedback}</p>
              )}
              <div className="modal__actions">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button
                  className="primary-button"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Agregando...' : 'Agregar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {pendingDelete && (
        <div
          className="modal-backdrop"
          onClick={() => setPendingDelete(null)}
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-contact-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="modal__header">
              <h3 id="delete-contact-title">Eliminar contacto</h3>
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
              <p>
                ¿Eliminar a {pendingDelete.displayName} y sus chats asociados?
              </p>
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
