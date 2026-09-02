import { useState, useCallback } from "react";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  citations?: { documentTitle: string; relevanceScore: number; excerpt: string }[];
  timestamp: Date;
}

export function useAiChat(initialMessages: ChatMessage[] = []) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [loading, setLoading]   = useState(false);

  const addMessage = useCallback((role: ChatMessage["role"], content: string, citations?: ChatMessage["citations"]) => {
    const msg: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
      role, content, citations, timestamp: new Date(),
    };
    setMessages(p => [...p, msg]);
    return msg;
  }, []);

  const clear = useCallback(() => setMessages([]), []);
  return { messages, loading, setLoading, addMessage, clear };
}
