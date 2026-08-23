import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const formatTime = (value) => {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('en', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
};

const sameMessage = (left, right) => {
  if (!left || !right) return false;

  if (left._id && right._id && left._id === right._id) {
    return true;
  }

  if (left.conversationId !== right.conversationId) {
    return false;
  }

  if (left.sender !== right.sender) {
    return false;
  }

  if (left.text !== right.text) {
    return false;
  }

  const leftTime = new Date(left.createdAt || 0).getTime();
  const rightTime = new Date(right.createdAt || 0).getTime();

  return Math.abs(leftTime - rightTime) < 5000;
};

const getMessageStatusLabel = (status) => {
  if (!status) return 'Sent';

  return status.charAt(0).toUpperCase() + status.slice(1);
};

export default function Messages() {
  const { user } = useAuth();
  const { socket } = useSocket();

  const navigate = useNavigate();
  const location = useLocation();

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(
    location.state?.openChat?._id || null
  );

  const [threadMessages, setThreadMessages] = useState([]);
  const [lastMessageByConversation, setLastMessageByConversation] = useState({});

  const [unreadByConversation, setUnreadByConversation] = useState(() => {
    const stored = localStorage.getItem('messagesUnread');

    return stored ? JSON.parse(stored) : {};
  });

  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [typingUserId, setTypingUserId] = useState(null);

  const getConversationPartner = (conversation) => {
    if (!conversation || !user?._id) return null;

    return (
      conversation.members.find(
        (member) => member._id !== user._id
      ) ||
      conversation.members[0] ||
      null
    );
  };

  const activeConversation = useMemo(
    () =>
      conversations.find(
        (conversation) =>
          conversation._id === selectedConversationId
      ) || null,
    [conversations, selectedConversationId]
  );

  const activePartner = getConversationPartner(activeConversation);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
  }, [selectedConversationId, threadMessages, typingUserId]);

  useEffect(() => {
    localStorage.setItem(
      'messagesUnread',
      JSON.stringify(unreadByConversation)
    );
  }, [unreadByConversation]);

  const sortConversations = (list) => {
    return [...list].sort((a, b) => {
      const aMessage = lastMessageByConversation[a._id];
      const bMessage = lastMessageByConversation[b._id];

      const aTime = aMessage?.createdAt
        ? new Date(aMessage.createdAt).getTime()
        : 0;

      const bTime = bMessage?.createdAt
        ? new Date(bMessage.createdAt).getTime()
        : 0;

      return bTime - aTime;
    });
  };

  const fetchConversations = async () => {
    if (!user?._id) return;

    try {
      const res = await api.get(
        `/messages/conversation/${user._id}`
      );

      const list = res.data || [];
      const lastMessages = {};

      await Promise.all(
        list.map(async (conversation) => {
          try {
            const messagesRes = await api.get(
              `/messages/message/${conversation._id}`
            );

            const messages = messagesRes.data || [];

            lastMessages[conversation._id] =
              messages[messages.length - 1] || null;
          } catch (err) {
            console.error(
              'Failed to load preview message:',
              err
            );

            lastMessages[conversation._id] = null;
          }
        })
      );

      setLastMessageByConversation(lastMessages);

      const sortedList = [...list].sort((a, b) => {
        const aMessage = lastMessages[a._id];
        const bMessage = lastMessages[b._id];

        const aTime = aMessage?.createdAt
          ? new Date(aMessage.createdAt).getTime()
          : 0;

        const bTime = bMessage?.createdAt
          ? new Date(bMessage.createdAt).getTime()
          : 0;

        return bTime - aTime;
      });

      setConversations(sortedList);

      if (!selectedConversationId && list.length > 0) {
        setSelectedConversationId(list[0]._id);
      }
    } catch (err) {
      console.error(
        'Failed to fetch conversations:',
        err
      );
    } finally {
      setLoading(false);
    }
  };

  const updateSeenForThread = async (messages) => {
    if (!messages?.length || !socket || !user?._id) {
      return;
    }

    const pending = messages.filter(
      (message) =>
        message.sender !== user._id &&
        message.status !== 'seen'
    );

    if (!pending.length) return;

    for (const message of pending) {
      try {
        const response = await api.patch(
          `/messages/message/${message._id}/status`,
          {
            status: 'seen',
          }
        );

        socket.emit('markSeen', {
          messageId: message._id,
          conversationId:
            message.conversationId ||
            selectedConversationId,
          userId: user._id,
          status: response.data?.status || 'seen',
        });

        setThreadMessages((prev) =>
          prev.map((item) =>
            item._id === message._id
              ? {
                ...item,
                status: 'seen',
              }
              : item
          )
        );
      } catch (err) {
        console.error(
          'Failed to mark message seen:',
          err
        );
      }
    }
  };

  const fetchThread = async (conversationId) => {
    if (!conversationId) return;

    try {
      const res = await api.get(
        `/messages/message/${conversationId}`
      );

      const messages = res.data || [];

      setThreadMessages(messages);

      setUnreadByConversation((prev) => ({
        ...prev,
        [conversationId]: 0,
      }));

      if (socket && user?._id) {
        socket.emit('markRead', {
          conversationId,
          userId: user._id,
        });
      }

      await updateSeenForThread(messages);
    } catch (err) {
      console.error(
        'Failed to fetch thread:',
        err
      );

      setThreadMessages([]);
    }
  };

  useEffect(() => {
    if (!user?._id) return;

    fetchConversations();
  }, [user?._id]);

  useEffect(() => {
    if (selectedConversationId) {
      fetchThread(selectedConversationId);
    }
  }, [selectedConversationId]);

  const handleTypingStatus = (isTyping) => {
    if (
      !socket ||
      !selectedConversationId ||
      !activePartner?._id ||
      !user?._id
    ) {
      return;
    }

    socket.emit(
      isTyping ? 'typing' : 'stopTyping',
      {
        conversationId: selectedConversationId,
        senderId: user._id,
        receiverId: activePartner._id,
      }
    );
  };

  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (message) => {
      const conversationId = message?.conversationId;

      if (!conversationId) return;

      if (message.sender !== user?._id) {
        socket.emit('markDelivered', {
          messageId: message._id,
          conversationId,
          userId: user?._id,
          status: 'delivered',
        });
      }

      setLastMessageByConversation((prev) => ({
        ...prev,
        [conversationId]: {
          _id: message._id,
          text: message.text,
          sender: message.sender,
          createdAt:
            message.createdAt ||
            new Date().toISOString(),
        },
      }));

      setThreadMessages((prev) => {
        const alreadyExists = prev.some(
          (item) => sameMessage(item, message)
        );

        const nextMessages = alreadyExists
          ? prev
          : [...prev, message];

        if (
          selectedConversationId === conversationId &&
          message.sender !== user?._id
        ) {
          const unsent = nextMessages.filter(
            (item) =>
              item.sender !== user?._id &&
              item.status !== 'seen'
          );

          if (unsent.length) {
            Promise.resolve().then(() =>
              updateSeenForThread(unsent)
            );
          }
        }

        return nextMessages;
      });

      if (
        selectedConversationId !== conversationId
      ) {
        setUnreadByConversation((prev) => ({
          ...prev,
          [conversationId]:
            (prev[conversationId] || 0) + 1,
        }));
      }
    };

    const handleTyping = ({
      conversationId,
      senderId,
      isTyping,
    }) => {
      if (!conversationId || !senderId) return;

      const partnerId =
        getConversationPartner(
          activeConversation
        )?._id;

      if (
        partnerId &&
        partnerId === senderId &&
        selectedConversationId === conversationId
      ) {
        setTypingUserId(
          isTyping ? senderId : null
        );
      }
    };

    const handleMessageStatus = ({
      messageId,
      senderId,
      status,
    }) => {
      if (!messageId || !senderId) return;

      setThreadMessages((prev) =>
        prev.map((message) => {
          if (message._id !== messageId) {
            return message;
          }

          return {
            ...message,
            status,
          };
        })
      );

      setLastMessageByConversation((prev) => {
        const conversationId =
          Object.keys(prev).find((key) => {
            const item = prev[key];

            return (
              item?._id === messageId ||
              item?.messageId === messageId
            );
          });

        if (!conversationId) return prev;

        return {
          ...prev,
          [conversationId]: {
            ...prev[conversationId],
            status,
          },
        };
      });
    };

    const handleMessageSent = (savedMessage) => {
      setThreadMessages((prev) =>
        prev.map((message) => {
          if (
            message._id?.startsWith('temp-') &&
            message.text === savedMessage.text &&
            message.sender === savedMessage.sender
          ) {
            return {
              ...savedMessage,
              status:
                savedMessage.status || 'sent',
            };
          }

          return message;
        })
      );
    };

    socket.on(
      'receiveMessage',
      handleReceiveMessage
    );

    socket.on(
      'userTyping',
      handleTyping
    );

    socket.on(
      'messageStatus',
      handleMessageStatus
    );

    socket.on(
      'messageSent',
      handleMessageSent
    );

    return () => {
      socket.off(
        'receiveMessage',
        handleReceiveMessage
      );

      socket.off(
        'userTyping',
        handleTyping
      );

      socket.off(
        'messageStatus',
        handleMessageStatus
      );

      socket.off(
        'messageSent',
        handleMessageSent
      );
    };
  }, [
    socket,
    selectedConversationId,
    activeConversation,
    user?._id,
  ]);

  const handleSendMessage = async (event) => {
    event.preventDefault();

    const trimmed = draft.trim();

    if (
      !trimmed ||
      !selectedConversationId ||
      !user?._id
    ) {
      return;
    }

    const receiver = activePartner?._id;

    const optimisticMessage = {
      _id: `temp-${Date.now()}`,
      conversationId: selectedConversationId,
      sender: user._id,
      text: trimmed,
      createdAt: new Date().toISOString(),
    };

    setThreadMessages((prev) => {
      if (
        prev.some((item) =>
          sameMessage(
            item,
            optimisticMessage
          )
        )
      ) {
        return prev;
      }

      return [
        ...prev,
        optimisticMessage,
      ];
    });

    setLastMessageByConversation((prev) => ({
      ...prev,
      [selectedConversationId]: {
        _id: optimisticMessage._id,
        text: trimmed,
        sender: user._id,
        createdAt:
          optimisticMessage.createdAt,
      },
    }));

    setConversations((prev) =>
      sortConversations(prev)
    );

    setDraft('');

    handleTypingStatus(false);

    if (socket) {
      socket.emit('sendMessage', {
        conversationId:
          selectedConversationId,
        sender: user._id,
        receiverId: receiver,
        text: trimmed,
      });

      return;
    }

    try {
      await api.post(
        '/messages/message',
        {
          conversationId:
            selectedConversationId,
          text: trimmed,
        }
      );
    } catch (err) {
      console.error(
        'Failed to send message:',
        err
      );
    }
  };

  const renderAvatar = (
    userInfo,
    className = 'w-11 h-11'
  ) => {
    if (!userInfo) {
      return (
        <div
          className={`${className} rounded-full bg-zinc-800 text-xs font-bold flex items-center justify-center text-white`}
        >
          U
        </div>
      );
    }

    if (userInfo.profilePic) {
      return (
        <div
          className={`${className} rounded-full overflow-hidden bg-zinc-800 border border-zinc-700`}
        >
          <img
            src={userInfo.profilePic}
            alt={
              userInfo.username || 'User'
            }
            className="w-full h-full object-cover"
          />
        </div>
      );
    }

    return (
      <div
        className={`${className} rounded-full bg-zinc-800 text-xs font-bold flex items-center justify-center text-white border border-zinc-700`}
      >
        {(
          userInfo.username ||
          userInfo.name ||
          'U'
        )
          .charAt(0)
          .toUpperCase()}
      </div>
    );
  };

  const totalUnread = Object.values(
    unreadByConversation
  ).reduce(
    (sum, count) =>
      sum + Number(count || 0),
    0
  );

  return (
    <div className="flex h-screen h-[100dvh] w-full bg-black text-white overflow-hidden selection:bg-zinc-800">

      <aside className={`w-full md:w-[350px] lg:w-[380px] xl:w-[390px] flex-shrink-0 border-r border-zinc-800 flex flex-col h-full bg-black ${selectedConversationId ? 'hidden md:flex' : 'flex'}`}>

        <div className="flex items-center justify-between border-b border-zinc-800/80 px-6 py-4 h-[73px] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-white font-sans">
              Messages
            </h1>
            {totalUnread > 0 && (
              <span className="flex items-center justify-center bg-blue-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                {totalUnread}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-zinc-300">
            <button type="button" className="p-1 hover:text-white transition cursor-pointer" title="New Message">
              <svg aria-label="New message" fill="currentColor" height="24" width="24" viewBox="0 0 24 24">
                <path d="M12.202 3.203a.5.5 0 0 0-.304.577l.635 3.178A.5.5 0 0 0 13.02 7.3l2.584-1.293a.5.5 0 0 0 .157-.706l-2.868-4.015a.5.5 0 0 0-.691-.083ZM21.707 1.293a1 1 0 0 0-1.414 0l-12.5 12.5a1 1 0 0 0-.263.464l-1.5 5a1 1 0 0 0 1.237 1.237l5-1.5a1 1 0 0 0 .464-.263l12.5-12.5a1 1 0 0 0 0-1.414l-3.536-3.536Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-6 text-center text-sm text-zinc-500">
              Loading conversations...
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-sm text-zinc-500">
              No conversations yet.
            </div>
          ) : (
            conversations.map((conversation) => {
              const partner = getConversationPartner(conversation);
              const preview = lastMessageByConversation[conversation._id];
              const isActive = activeConversation?._id === conversation._id;
              const unreadCount = unreadByConversation[conversation._id] || 0;

              return (
                <button
                  type="button"
                  key={conversation._id}
                  onClick={() => setSelectedConversationId(conversation._id)}
                  className={`flex w-full items-center gap-3.5 px-5 py-3.5 text-left transition-colors duration-150 border-b border-zinc-900/40 cursor-pointer ${isActive ? 'bg-zinc-800/70' : 'hover:bg-zinc-900/60'
                    }`}
                >
                  {renderAvatar(partner, 'w-14 h-14')}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className={`truncate text-sm ${unreadCount > 0 ? 'font-bold text-white' : 'font-semibold text-zinc-100'}`}>
                        {partner?.username || partner?.name || 'User'}
                      </span>
                      {preview?.createdAt && (
                        <span className="text-[11px] text-zinc-500 flex-shrink-0">
                          {formatTime(preview.createdAt)}
                        </span>
                      )}
                    </div>

                    <div className="mt-1 flex items-center justify-between gap-2">
                      <div className={`min-w-0 truncate text-xs ${unreadCount > 0 ? 'font-semibold text-white' : 'text-zinc-400'}`}>
                        {preview ? (
                          <>
                            <span>
                              {preview.sender === user?._id ? 'You: ' : ''}
                            </span>
                            {preview.text}
                          </>
                        ) : (
                          'Start a conversation'
                        )}
                      </div>

                      {unreadCount > 0 && (
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      <main className={`flex-1 flex flex-col h-full bg-black min-w-0 ${!selectedConversationId ? 'hidden md:flex' : 'flex'}`}>
        {activeConversation && activePartner ? (
          <>
            <header className="flex items-center justify-between border-b border-zinc-800/80 px-5 py-3.5 h-[73px] flex-shrink-0 bg-black z-10">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => setSelectedConversationId(null)}
                  className="md:hidden p-1 text-zinc-300 hover:text-white transition cursor-pointer -ml-1"
                  aria-label="Back to conversations"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                </button>

                <Link
                  to={`/profile/${activePartner.username}`}
                  className="flex items-center gap-3 min-w-0 group"
                >
                  {renderAvatar(activePartner, 'w-11 h-11')}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate group-hover:opacity-80 transition">
                      {activePartner.username || activePartner.name || 'User'}
                    </p>
                    <p className="text-xs text-zinc-400 truncate">
                      {typingUserId === activePartner._id
                        ? 'typing...'
                        : activePartner.name || 'Instagram user'}
                    </p>
                  </div>
                </Link>
              </div>

              <div className="flex items-center gap-4 text-white">
                <Link
                  to={`/profile/${activePartner.username}`}
                  className="text-zinc-400 hover:text-white p-1 transition"
                  title="View Profile"
                >
                  <svg aria-label="Conversation information" fill="currentColor" height="24" width="24" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" fill="none" r="10" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                    <line fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" x1="12" x2="12" y1="8" y2="12" />
                    <circle cx="12" cy="16" r="1" />
                  </svg>
                </Link>
              </div>
            </header>

            <div className="flex-1 flex flex-col overflow-hidden bg-black">
              <div className="flex-1 space-y-3 overflow-y-auto px-5 py-6">

                <div className="flex flex-col items-center justify-center my-6 text-center">
                  {renderAvatar(activePartner, 'w-20 h-20')}
                  <h2 className="text-base font-bold text-white mt-3">
                    {activePartner.name || activePartner.username}
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {activePartner.username} · Instagram
                  </p>
                  <Link
                    to={`/profile/${activePartner.username}`}
                    className="mt-3 px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white transition cursor-pointer"
                  >
                    View profile
                  </Link>
                </div>

                {threadMessages.length === 0 ? (
                  <div className="mt-6 text-center text-xs text-zinc-500">
                    No messages yet. Say hello!
                  </div>
                ) : (
                  threadMessages.map((message, index) => {
                    const isMine =
                      message.sender === user?._id ||
                      message.sender?._id === user?._id;

                    const status = message.status || 'sent';

                    return (
                      <div
                        key={
                          message._id ||
                          `${message.createdAt}-${index}`
                        }
                        className={`flex w-full ${isMine ? 'justify-end' : 'justify-start'
                          }`}
                      >
                        <div
                          className={`max-w-[75%] md:max-w-[65%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${isMine
                              ? 'bg-[#3797f0] text-white rounded-tr-sm'
                              : 'bg-zinc-800 text-zinc-100 border border-zinc-700/50 rounded-tl-sm'
                            }`}
                        >
                          <div className="break-words">{message.text}</div>

                          <div className="flex items-center justify-end gap-1.5 mt-1">
                            {message.createdAt && (
                              <span
                                className={`text-[10px] ${isMine ? 'text-blue-100/80' : 'text-zinc-400'
                                  }`}
                              >
                                {formatTime(message.createdAt)}
                              </span>
                            )}
                            {isMine && (
                              <span className="text-[10px] text-blue-100/90 font-medium">
                                · {getMessageStatusLabel(status)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                {typingUserId === activePartner._id && (
                  <div className="flex justify-start">
                    <div className="bg-zinc-800 border border-zinc-700/50 rounded-2xl rounded-tl-sm px-4 py-3 text-xs text-zinc-400 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 bg-black border-t border-zinc-800/80">
                <form
                  onSubmit={handleSendMessage}
                  className="flex items-center gap-3 rounded-full border border-zinc-700/80 bg-zinc-900/90 px-4 py-2 focus-within:border-zinc-500 transition-colors"
                >
                  <input
                    type="text"
                    value={draft}
                    onChange={(event) => {
                      setDraft(event.target.value);

                      handleTypingStatus(
                        Boolean(event.target.value.trim())
                      );

                      if (typingTimeoutRef.current) {
                        clearTimeout(typingTimeoutRef.current);
                      }

                      typingTimeoutRef.current = setTimeout(
                        () => handleTypingStatus(false),
                        1200
                      );
                    }}
                    onBlur={() => handleTypingStatus(false)}
                    placeholder="Message..."
                    className="flex-1 bg-transparent text-sm text-white placeholder-zinc-500 outline-none py-1"
                  />

                  <button
                    type="submit"
                    disabled={!draft.trim()}
                    className="text-sm font-semibold text-blue-500 hover:text-white disabled:opacity-40 disabled:hover:text-blue-500 transition-colors cursor-pointer disabled:cursor-default px-1"
                  >
                    Send
                  </button>
                </form>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center bg-black">
            <div className="w-24 h-24 rounded-full border-2 border-white flex items-center justify-center mb-4">
              <svg aria-label="Direct" fill="currentColor" height="48" width="48" viewBox="0 0 24 24">
                <path d="M12.003 2.001a9.705 9.705 0 1 1 0 19.4 10.876 10.876 0 0 1-2.895-.384.798.798 0 0 0-.533.04l-1.984.876a.801.801 0 0 1-1.123-.708l-.054-1.78a.806.806 0 0 0-.27-.569 9.49 9.49 0 0 1-3.14-7.175 9.65 9.65 0 0 1 10-9.7Z" fill="none" stroke="currentColor" strokeMiterlimit="10" strokeWidth="1.739" />
                <path d="M17.79 10.132a.659.659 0 0 0-.962-.873l-2.556 2.05a.63.63 0 0 1-.758.002L11.06 9.47a1.576 1.576 0 0 0-2.277.42l-2.567 3.98a.659.659 0 0 0 .961.873l2.556-2.05a.63.63 0 0 1 .759-.002l2.452 1.84a1.576 1.576 0 0 0 2.278-.42Z" fillRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-xl font-medium text-white mb-1">Your messages</h2>
            <p className="text-sm text-zinc-400 max-w-xs">
              Send a message to start a chat.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}