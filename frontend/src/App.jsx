import { useState, useRef, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import {
  loadChats,
  saveChats,
  loadActiveChatId,
  saveActiveChatId,
  createNewChat,
} from "./utils/storage";
import { sendChatMessage, generateChatTitle } from "./utils/api";

const MAX_CHARS = 2000;

export default function App() {
  const [chats, setChats] = useState({});
  const [activeChatId, setActiveChatId] = useState(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const savedChats = loadChats();
    const savedActiveId = loadActiveChatId();

    if (Object.keys(savedChats).length === 0) {
      const newChat = createNewChat();
      const initialChats = { [newChat.id]: newChat };
      setChats(initialChats);
      setActiveChatId(newChat.id);
      saveChats(initialChats);
      saveActiveChatId(newChat.id);
    } else {
      setChats(savedChats);
      if (savedActiveId && savedChats[savedActiveId]) {
        setActiveChatId(savedActiveId);
      } else {
        const firstChatId = Object.keys(savedChats)[0];
        setActiveChatId(firstChatId);
        saveActiveChatId(firstChatId);
      }
    }
  }, []);

  useEffect(() => {
    if (Object.keys(chats).length > 0) {
      saveChats(chats);
    }
  }, [chats]);

  useEffect(() => {
    if (activeChatId) {
      saveActiveChatId(activeChatId);
    }
  }, [activeChatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats, activeChatId, loading]);

  const activeChat = chats[activeChatId];
  const messages = activeChat?.messages || [];

  const validateInput = () => {
    const trimmed = input.trim();
    if (!trimmed) return "Message empty nahi ho sakti.";
    if (trimmed.length < 2) return "Message thori chhoti hai (minimum 2 characters).";
    if (trimmed.length > MAX_CHARS) return `Message ${MAX_CHARS} characters se zyada nahi ho sakti.`;
    return null;
  };

  const handleNewChat = () => {
    const newChat = createNewChat();
    setChats((prev) => ({ ...prev, [newChat.id]: newChat }));
    setActiveChatId(newChat.id);
    setError("");
    setInput("");
  };

  const handleSelectChat = (chatId) => {
    setActiveChatId(chatId);
    setError("");
  };

  const handleDeleteChat = (chatId) => {
    setChats((prev) => {
      const updated = { ...prev };
      delete updated[chatId];
      if (chatId === activeChatId) {
        const remainingIds = Object.keys(updated);
        if (remainingIds.length > 0) {
          setActiveChatId(remainingIds[0]);
        } else {
          const newChat = createNewChat();
          updated[newChat.id] = newChat;
          setActiveChatId(newChat.id);
        }
      }
      return updated;
    });
  };

  const sendMessage = async () => {
    const validationError = validateInput();
    if (validationError) {
      setError(validationError);
      return;
    }

    const userMessage = input.trim();
    setError("");
    setInput("");

    const userMsg = { role: "user", content: userMessage };
    const updatedMessages = [...messages, userMsg];

    setChats((prev) => ({
      ...prev,
      [activeChatId]: { ...prev[activeChatId], messages: updatedMessages },
    }));

    setLoading(true);

    try {
      const conversationMessages = updatedMessages.filter(
        (m, idx) => !(idx === 0 && m.role === "assistant" && m.content.includes("tumhara AI assistant"))
      );

      const botReply = await sendChatMessage(conversationMessages);
      const botMsg = { role: "assistant", content: botReply };
      const finalMessages = [...updatedMessages, botMsg];
      const isFirstUserMessage = updatedMessages.filter(m => m.role === "user").length === 1;

      setChats((prev) => ({
        ...prev,
        [activeChatId]: { ...prev[activeChatId], messages: finalMessages },
      }));

      if (isFirstUserMessage && activeChat.title === "New Chat") {
        const title = await generateChatTitle(userMessage);
        setChats((prev) => ({
          ...prev,
          [activeChatId]: { ...prev[activeChatId], title: title },
        }));
      }
    } catch (err) {
      let errorMessage = "Something went wrong. Please try again.";
      if (err.code === "ECONNABORTED") {
        errorMessage = "Request timed out. Server slow ho sakta hai.";
      } else if (err.response?.data?.detail) {
        errorMessage = typeof err.response.data.detail === "string"
          ? err.response.data.detail
          : "Validation error. Apna input check karo.";
      } else if (err.message === "Network Error") {
        errorMessage = "Backend server se connect nahi ho pa raha.";
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-screen flex bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-md border-b border-white/10 p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 hover:bg-white/10 rounded-lg transition"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-xl flex-shrink-0">
                🤖
              </div>
              <div className="min-w-0">
                <h1 className="text-white font-bold text-lg sm:text-xl truncate">
                  {activeChat?.title || "AI Chatbot"}
                </h1>
                <p className="text-slate-400 text-xs">Powered by Groq + LLaMA 3.3</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4">
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] sm:max-w-[70%] px-4 py-3 rounded-2xl ${
                    msg.role === "user"
                      ? "bg-purple-600 text-white rounded-br-sm"
                      : "bg-white/10 text-slate-50 backdrop-blur-sm border border-white/10 rounded-bl-sm"
                  }`}
                >
                  <p className={`whitespace-pre-wrap break-words text-sm sm:text-base ${
                    msg.role === "assistant" ? "font-medium leading-relaxed" : ""
                  }`}>
                    {msg.content}
                  </p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white/10 backdrop-blur-sm border border-white/10 px-4 py-3 rounded-2xl rounded-bl-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </main>

        {error && (
          <div className="max-w-4xl mx-auto w-full px-4 pb-2">
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-2 rounded-lg text-sm">
              ⚠️ {error}
            </div>
          </div>
        )}

        <footer className="sticky bottom-0 z-30 bg-slate-900/80 backdrop-blur-md border-t border-white/10 p-4 shadow-lg">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-2 items-end">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                placeholder="Apna message type karo... (Enter to send, Shift+Enter for new line)"
                className="flex-1 bg-white/10 text-white placeholder-slate-400 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none disabled:opacity-50 text-sm sm:text-base"
                rows="2"
                maxLength={MAX_CHARS}
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 hover:from-cyan-600 hover:via-purple-600 hover:to-pink-600 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-bold px-5 py-3 rounded-xl shadow-lg shadow-purple-500/40 hover:shadow-purple-500/60 transition-all duration-200 hover:scale-105 disabled:hover:scale-100 flex items-center justify-center min-w-[60px]"
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </div>
            <div className="text-xs text-slate-400 mt-2 px-2 text-right">
              <span>{input.length} / {MAX_CHARS}</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}