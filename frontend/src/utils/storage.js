// LocalStorage helper functions for chat sessions

const STORAGE_KEY = "ai_chatbot_sessions";
const ACTIVE_CHAT_KEY = "ai_chatbot_active_id";

// Saari chats load karo
export const loadChats = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (err) {
    console.error("Error loading chats:", err);
    return {};
  }
};

// Saari chats save karo
export const saveChats = (chats) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
  } catch (err) {
    console.error("Error saving chats:", err);
  }
};

// Active chat ID load karo
export const loadActiveChatId = () => {
  return localStorage.getItem(ACTIVE_CHAT_KEY);
};

// Active chat ID save karo
export const saveActiveChatId = (id) => {
  if (id) {
    localStorage.setItem(ACTIVE_CHAT_KEY, id);
  } else {
    localStorage.removeItem(ACTIVE_CHAT_KEY);
  }
};

// Naya chat session banao
export const createNewChat = () => {
  const id = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  return {
    id,
    title: "New Chat",
    messages: [
      {
        role: "assistant",
        content: "Hello! Main tumhara AI assistant hoon. Kuch bhi pucho!",
      },
    ],
    createdAt: Date.now(),
  };
};

// Saari chats delete karo (clear all)
export const clearAllChats = () => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(ACTIVE_CHAT_KEY);
};