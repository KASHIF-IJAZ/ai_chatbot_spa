import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

// Backend ko message bhejo aur reply lo
export const sendChatMessage = async (messages) => {
  const { data } = await axios.post(
    `${API_URL}/api/chat`,
    { messages },
    { timeout: 30000 },
  );
  return data.bot_reply;
};

// Pehle message se title generate karo
export const generateChatTitle = async (firstMessage) => {
  try {
    const { data } = await axios.post(
      `${API_URL}/api/generate-title`,
      { first_message: firstMessage },
      { timeout: 15000 },
    );
    return data.title;
  } catch (err) {
    // Fallback: first 30 chars
    return firstMessage.length > 30
      ? firstMessage.substring(0, 30) + "..."
      : firstMessage;
  }
};
