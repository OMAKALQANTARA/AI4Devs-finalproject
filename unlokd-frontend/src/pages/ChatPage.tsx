import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getChatDetails } from '../services/chats';
import type { Chat } from '../services/chats';
import { getChatMessages, sendMessage } from '../services/messages';
import type { Message } from '../services/messages';
import { getAuthUserId, getValidAuthToken } from '../utils/auth';
import { API_BASE_URL } from '../services/api';
import { io, type Socket } from 'socket.io-client';

export function ChatPage() {
  const { chatId } = useParams();
  const [chat, setChat] = useState<Chat | null>(null);
  const contactName = useMemo(() => {
    if (!chat) return null;
    if (chat.type !== 'DIRECT') {
      return chat.title;
    }
    if (chat.peerDisplayName) {
      return chat.peerDisplayName;
    }
    const currentUserId = getAuthUserId();
    if (!currentUserId || !chat.members?.length) {
      return null;
    }
    const peer = chat.members.find((member) => member.userId !== currentUserId);
    return peer?.displayName ?? null;
  }, [chat]);

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

  useEffect(() => {
    if (!chatId) return;
    const token = getValidAuthToken();
    if (!token) return;

    const socketBaseUrl =
      import.meta.env.VITE_WS_BASE_URL ?? API_BASE_URL;
    const socket: Socket = io(socketBaseUrl, {
      auth: { token },
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      socket.emit('joinChat', { chatId: Number(chatId) });
    });

    socket.on('newMessage', (payload: any) => {
      const incomingId = payload?.messageId ?? payload?.id;
      if (!incomingId || payload?.chatId !== Number(chatId)) return;
      const incoming: Message = {
        id: incomingId,
        chatId: payload.chatId,
        senderId: payload.senderId,
        contentType: payload.contentType,
        contentText: payload.contentText,
        visibilityType: payload.visibilityType,
        status: payload.status,
        createdAt: payload.createdAt,
      };

      const currentUserId = getAuthUserId();
      setMessages((prev) => {
        if (prev.some((item) => item.id === incoming.id)) {
          return prev;
        }
        if (currentUserId !== null && incoming.senderId === currentUserId) {
          return prev;
        }
        return [incoming, ...prev];
      });
    });

    return () => {
      socket.emit('leaveChat', { chatId: Number(chatId) });
      socket.disconnect();
    };
  }, [chatId]);

  const isOwnMessage = useMemo(() => {
    const currentUserId = getAuthUserId();
    return (message: Message) =>
      currentUserId !== null && message.senderId === currentUserId;
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
      setMessages((prev) => {
        if (prev.some((item) => item.id === created.id)) {
          return prev;
        }
        return [created, ...prev];
      });
      setDraft('');
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : 'No se pudo enviar mensaje.',
      );
    }
  };

  return (
    <section className="page chat-page">
      <header className="chat-header chat-header--sticky">
        <Link to="/chats" className="icon-button" aria-label="Regresar">
          ❮
        </Link>
        <div className="chat-header__info">
          <div className="avatar">
            {(contactName ?? 'CH').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h3>
              {contactName ??
                (chat?.type === 'GROUP' ? 'Chat grupal' : 'Chat directo')}
            </h3>
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
        <input
          type="text"
          placeholder="Escribe un mensaje..."
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              handleSend();
            }
          }}
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
