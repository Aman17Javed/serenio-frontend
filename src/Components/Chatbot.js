import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import "./Chatbot.css";
import api from "../api/axios";
import Loader from "./Loader";
import { v4 as uuidv4 } from "uuid";
import { useNavigate } from "react-router-dom";
import RealTimeSentiment from "./RealTimeSentiment";

const analyzeSentiment = (text) => {
  const lowerText = text.toLowerCase();
  if (lowerText.includes("happy") || lowerText.includes("great") || lowerText.includes("good")) {
    return "Positive";
  } else if (lowerText.includes("sad") || lowerText.includes("bad") || lowerText.includes("why")) {
    return "Negative";
  }
  return "Neutral";
};

const messageVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const Chatbot = () => {
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState(() => {
    const existing = localStorage.getItem("serenioSessionId");
    if (existing) return existing;
    const newId = uuidv4();
    localStorage.setItem("serenioSessionId", newId);
    return newId;
  });
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [showSentiment, setShowSentiment] = useState(false);
  const chatMessagesRef = useRef(null);

  useEffect(() => {
    const loadInitial = async () => {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setMessages([
        {
          sender: "bot",
          name: "Serenio AI",
          text: "Hello Aman! I'm Serenio AI, your personal assistant. How can I help you today?",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          sentiment: null,
        },
      ]);
      setPageLoading(false);
    };
    loadInitial();
  }, []);

  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userSentiment = analyzeSentiment(input);
    const userMessage = {
      sender: "user",
      name: "Aman",
      text: input,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      sentiment: userSentiment,
    };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      // Save user message to backend
      await api.post("/api/chatlogs", {
        sessionId,
        message: input,
        response: "", // Will be updated with bot response
      });

      // Simulate bot response (replace with actual API call if needed)
      const res = await api.post("/api/chatbot/message", { message: input, sessionId });
      const botReply = {
        sender: "bot",
        name: "Serenio AI",
        text: res.data.botReply || "Sorry, I didn't understand that.",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        sentiment: null,
      };

      // Update chat log with bot response
      await api.patch(`/api/chatlogs/${sessionId}/last`, {
        response: botReply.text,
      });

      setMessages((prev) => [...prev, botReply]);
    } catch (err) {
      const errorReply = {
        sender: "bot",
        name: "Serenio AI",
        text: "I'm having trouble connecting right now. Please try again.",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        sentiment: null,
      };
      setMessages((prev) => [...prev, errorReply]);
    } finally {
      setLoading(false);
      setInput("");
    }
  };

  const handleEndChat = () => {
    navigate(`/sentimentAnalysisDashboard/${sessionId}`);
  };

  const handleClearChat = () => {
    // Generate new session ID
    const newSessionId = uuidv4();
    setSessionId(newSessionId);
    localStorage.setItem("serenioSessionId", newSessionId);
    
    // Clear messages and reset to initial state
    setMessages([
      {
        sender: "bot",
        name: "Serenio AI",
        text: "Hello! I'm Serenio AI, your personal assistant. How can I help you today?",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        sentiment: null,
      },
    ]);
    
    // Hide sentiment analysis
    setShowSentiment(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (pageLoading) {
    return (
      <div className="chatbot-container">
        <div className="loading-screen">
          <Loader size={60} />
          <p>Initializing Serenio AI...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chatbot-container">
      {/* Real-time Sentiment Analysis */}
      <RealTimeSentiment 
        messages={messages} 
        isVisible={showSentiment && messages.length > 1}
      />
      
      <div className="chatbot-header">
        <div className="chatbot-title">
          <h2>Serenio AI</h2>
          <p>Your Personal Mental Health Assistant</p>
        </div>
        <div className="chatbot-actions">
          <motion.button
            onClick={() => setShowSentiment(!showSentiment)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`sentiment-toggle-btn ${showSentiment ? 'active' : ''}`}
            title="Toggle Sentiment Analysis"
          >
            📊
          </motion.button>
          <motion.button
            onClick={handleClearChat}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="clear-chat-btn"
            title="Clear Chat & Start New Session"
          >
            Clear Chat
          </motion.button>
          <motion.button
            onClick={handleEndChat}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="end-chat-btn"
            title="End Chat & View Analysis"
          >
            End Chat
          </motion.button>
        </div>
      </div>

      <div className="chatbot-messages" ref={chatMessagesRef}>
        {messages.map((message, index) => (
          <motion.div
            key={index}
            className={`message ${message.sender}`}
            variants={messageVariants}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.3 }}
          >
            <div className="message-content">
              <div className="message-header">
                <span className="message-name">{message.name}</span>
                <span className="message-time">{message.time}</span>
              </div>
              <div className="message-text">{message.text}</div>
              {message.sentiment && (
                <div className="message-sentiment">
                  <span className={`sentiment-badge ${message.sentiment.toLowerCase()}`}>
                    {message.sentiment}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        ))}
        {loading && (
          <motion.div
            className="message bot"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <div className="chatbot-input">
        <div className="input-container">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message here..."
            rows="1"
            className="message-input"
          />
          <motion.button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="send-button"
          >
            ➤
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;