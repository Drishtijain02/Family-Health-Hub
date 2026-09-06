import { useEffect, useState } from "react";
import "./AIChatbot.css";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function AIChatbot() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
  const openChatbot = () => setIsOpen(true);

  window.addEventListener("open-health-ai", openChatbot);

  return () => {
    window.removeEventListener("open-health-ai", openChatbot);
  };
}, []);

  const sendMessage = async () => {
    if (!message.trim() || loading) return;

    const userMessage = message.trim();

    setMessage("");

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: userMessage,
      },
    ]);

    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/ai/chat",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: userMessage,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Something went wrong"
        );
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.response,
        },
      ]);
    } catch (error) {
      console.error("Chatbot error:", error);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I couldn't process your question.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {isOpen && (
        <div className="ai-chat-window">
          <div className="ai-chat-header">
            <div>
              <h3>AI Health Assistant</h3>
              <span>
                Here to help with your health questions
              </span>
            </div>

            <button
              type="button"
              className="ai-close-btn"
              onClick={() => setIsOpen(false)}
            >
              ×
            </button>
          </div>

          <div className="ai-chat-messages">
            {messages.length === 0 && (
              <div className="ai-welcome">
                <div className="ai-welcome-icon">🤖</div>

                <h4>
                  Hi! I'm your AI Health Assistant
                </h4>

                <p>
                  Ask me questions about health, medical
                  reports, medicines, symptoms, or general
                  wellness.
                </p>
              </div>
            )}

            {messages.map((msg, index) => (
              <div
                key={index}
                className={
                  msg.role === "user"
                    ? "ai-message user-message"
                    : "ai-message assistant-message"
                }
              >
                <div className="message-role">
                  {msg.role === "user"
                    ? "You"
                    : "AI Assistant"}
                </div>

                <div className="message-content">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))}

            {loading && (
              <div className="ai-message assistant-message">
                <div className="message-role">
                  AI Assistant
                </div>

                <div className="message-content">
                  Thinking...
                </div>
              </div>
            )}
          </div>

          <div className="ai-chat-input">
            <input
              type="text"
              value={message}
              placeholder="Ask a health question..."
              onChange={(e) =>
                setMessage(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  sendMessage();
                }
              }}
            />

            <button
              type="button"
              onClick={sendMessage}
              disabled={loading}
            >
              Send
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        className={`ai-floating-button ${
          isOpen ? "chat-open" : ""
        }`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Open Health AI"
      >
        {isOpen ? "×" : "🤖"}
      </button>
    </>
  );
}

export default AIChatbot;