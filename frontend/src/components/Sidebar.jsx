import { useState } from "react";

export default function Sidebar({
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  isOpen,
  onClose,
}) {
  const sortedChats = Object.values(chats).sort(
    (a, b) => b.createdAt - a.createdAt
  );

  return (
    <>
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-50
          w-72 bg-slate-950/95 backdrop-blur-md border-r border-white/10
          flex flex-col transition-transform duration-300
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <div className="p-4 border-b border-white/10">
          <button
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-2.5 rounded-lg shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-200 hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {sortedChats.length === 0 ? (
            <p className="text-slate-500 text-sm text-center mt-8 px-2">
              No chats yet. Click "New Chat" to start!
            </p>
          ) : (
            sortedChats.map((chat) => (
              <ChatListItem
                key={chat.id}
                chat={chat}
                isActive={chat.id === activeChatId}
                onSelect={() => {
                  onSelectChat(chat.id);
                  onClose();
                }}
                onDelete={() => onDeleteChat(chat.id)}
              />
            ))
          )}
        </div>

        <div className="p-4 border-t border-white/10 text-center">
          <p className="text-slate-500 text-xs">Built by Muhammad Kashif</p>
          <p className="text-slate-600 text-xs mt-1">BSSE51F23S045 [BSSE 6th SS1]</p>
        </div>
      </aside>
    </>
  );
}

function ChatListItem({ chat, isActive, onSelect, onDelete }) {
  const [showDelete, setShowDelete] = useState(false);

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (window.confirm(`Delete "${chat.title}"?`)) {
      onDelete();
    }
  };

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
      className={`
        group relative px-3 py-2.5 rounded-lg cursor-pointer transition-all
        ${
          isActive
            ? "bg-gradient-to-r from-purple-600/30 to-pink-600/30 border border-purple-500/30"
            : "hover:bg-white/5"
        }
      `}
    >
      <div className="flex items-center gap-2 pr-8">
        <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <p className={`text-sm truncate ${isActive ? "text-white font-semibold" : "text-slate-300"}`}>
          {chat.title}
        </p>
      </div>

      {(showDelete || isActive) && (
        <button
          onClick={handleDeleteClick}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition opacity-0 group-hover:opacity-100"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22m-3 0V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v3" />
          </svg>
        </button>
      )}
    </div>
  );
}