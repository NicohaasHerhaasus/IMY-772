import { useState, useRef, useEffect, useCallback } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import ReactMarkdown from "react-markdown";
import "./Chatbot.css";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

async function tryGetAuthToken(): Promise<{ token: string } | { error: string }> {
  try {
    const session = await fetchAuthSession({ forceRefresh: true });
    const token =
      session.tokens?.accessToken?.toString() ?? session.tokens?.idToken?.toString();
    if (!token) {
      return { error: "Authentication token is required. Please sign in again." };
    }
    return { token };
  } catch {
    return { error: "Could not load your session. Please sign in again." };
  }
}

interface Message {
  role: "user" | "assistant";
  text: string;
}

type Status = "idle" | "loading" | "error";

const WELCOME_MESSAGE: Message = {
  role: "assistant",
  text: "Hello! I'm the AMR Surveillance Dashboard Assistant. I can help you with dashboard features, data uploads, and AMR concepts. What would you like to know?",
};

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorText, setErrorText] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  };

  const handleSend = useCallback(async () => {
    const question = input.trim();
    if (!question || status === "loading") return;

    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setStatus("loading");
    setErrorText(null);

    try {
      const auth = await tryGetAuthToken();
      if ("error" in auth) {
        setErrorText(auth.error);
        setStatus("error");
        return;
      }

      const res = await fetch(`${API_BASE}/api/admin/chatbot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ question }),
      });

      const json = await res.json();

      if (!res.ok) {
        const message =
          json.details?.[0] ?? json.message ?? "Something went wrong. Please try again.";
        setErrorText(message);
        setStatus("error");
        return;
      }

      setMessages((prev) => [...prev, { role: "assistant", text: json.data.answer }]);
      setStatus("idle");
    } catch {
      setErrorText("Could not reach the server. Please check your connection and try again.");
      setStatus("error");
    }
  }, [input, status]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDismissError = () => {
    setStatus("idle");
    setErrorText(null);
  };

  return (
    <div className="chatbot-page">
      <h1 className="chatbot-page__title">AMR Assistant</h1>
      <p className="chatbot-page__subtitle">
        Ask questions about the dashboard, data management, or AMR concepts.
      </p>

      <div className="chatbot-card">
        {/* Message list */}
        <div className="chatbot-messages" role="log" aria-live="polite" aria-label="Chat messages">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`chatbot-message chatbot-message--${msg.role}`}
              style={{ animationDelay: `${i * 30}ms` }}
            >
              {msg.role === "assistant" && (
                <div className="chatbot-message__avatar" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} width={16} height={16}>
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4M12 8h.01" />
                  </svg>
                </div>
              )}
              <div className="chatbot-message__bubble">
                {msg.role === "assistant" ? (
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                ) : (
                  msg.text
                )}
              </div>
            </div>
          ))}

          {status === "loading" && (
            <div className="chatbot-message chatbot-message--assistant">
              <div className="chatbot-message__avatar" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} width={16} height={16}>
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4M12 8h.01" />
                </svg>
              </div>
              <div className="chatbot-message__bubble chatbot-message__bubble--typing">
                <span className="chatbot-typing-dot" />
                <span className="chatbot-typing-dot" />
                <span className="chatbot-typing-dot" />
              </div>
            </div>
          )}

          {status === "error" && errorText && (
            <div className="chatbot-error" role="alert">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={15} height={15}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{errorText}</span>
              <button
                className="chatbot-error__dismiss"
                onClick={handleDismissError}
                aria-label="Dismiss error"
              >
                ✕
              </button>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Divider */}
        <div className="chatbot-divider" />

        {/* Input row */}
        <div className="chatbot-input-row">
          <textarea
            ref={textareaRef}
            className="chatbot-input"
            placeholder="Ask about the dashboard or AMR concepts…"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              autoResize();
            }}
            onKeyDown={handleKeyDown}
            disabled={status === "loading"}
            rows={1}
            aria-label="Chat input"
          />
          <button
            className="chatbot-send-btn"
            onClick={handleSend}
            disabled={!input.trim() || status === "loading"}
            aria-label="Send message"
          >
            {status === "loading" ? (
              <span className="chatbot-send-spinner" />
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} width={18} height={18}>
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            )}
          </button>
        </div>

        <p className="chatbot-disclaimer">
          Responses are limited to AMR Surveillance Dashboard topics only.
        </p>
      </div>
    </div>
  );
}
