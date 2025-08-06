import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import "./Chatbot.css";
import api from "../api/axios";
import Loader from "./Loader";
import { v4 as uuidv4 } from "uuid";
import { useNavigate } from "react-router-dom";
import RealTimeSentiment from "./RealTimeSentiment";

const analyzeSentiment = async (text) => {
  try {
    const response = await api.post("/api/openai/sentiment", {
      messages: [{ role: "user", content: text }]
    });
    const analysis = response.data;
    return analysis.sentiment || "NEUTRAL";
  } catch (error) {
    console.error("Error analyzing sentiment:", error);
    // Fallback to simple analysis
    const lowerText = text.toLowerCase();
    if (lowerText.includes("happy") || lowerText.includes("great") || lowerText.includes("good")) {
      return "POSITIVE";
    } else if (lowerText.includes("sad") || lowerText.includes("bad") || lowerText.includes("why")) {
      return "NEGATIVE";
    }
    return "NEUTRAL";
  }
};

const messageVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const Chatbot = () => {
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState(() => {
    // Always create a new session ID when the chatbot component loads
    const newId = uuidv4();
    localStorage.setItem("serenioSessionId", newId);
    console.log("🆕 New chat session created:", newId);
    return newId;
  });
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [showSentiment, setShowSentiment] = useState(false);
  const [endingChat, setEndingChat] = useState(false);
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
    
    // Clear input immediately after capturing the message
    const currentInput = input;
    setInput("");
    
    // Add user message immediately with loading state
    const userMessage = {
      sender: "user",
      name: "Aman",
      text: currentInput,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      sentiment: null, // Will be updated after analysis
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    // Analyze sentiment using OpenAI API
    const userSentiment = await analyzeSentiment(currentInput);
    
    // Update the user message with sentiment
    setMessages((prev) => 
      prev.map((msg, index) => 
        index === prev.length - 1 && msg.sender === "user" 
          ? { ...msg, sentiment: userSentiment }
          : msg
      )
    );

    try {
      // Send message to chatbot API (which will save to database)
      const res = await api.post("/api/chatbot/message", { message: currentInput, sessionId });
      const botReply = {
        sender: "bot",
        name: "Serenio AI",
        text: res.data.botReply || "Sorry, I didn't understand that.",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        sentiment: null,
      };

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
    }
  };

  const handleEndChat = async () => {
    console.log("🔚 Ending chat session:", sessionId);
    setEndingChat(true);
    
    // Show analysis loading for a moment
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Clear the session ID from localStorage to ensure a fresh session next time
    localStorage.removeItem("serenioSessionId");
    navigate(`/sentimentAnalysisDashboard/${sessionId}`);
  };

  const handleClearChat = () => {
    // Generate new session ID
    const newSessionId = uuidv4();
    setSessionId(newSessionId);
    localStorage.setItem("serenioSessionId", newSessionId);
    console.log("🔄 New session created after clear chat:", newSessionId);
    
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

  if (endingChat) {
    return (
      <div className="chatbot-container">
        <div className="loading-screen">
          <Loader size={60} />
          <p>Analyzing your conversation...</p>
          <p className="analysis-subtitle">Preparing your sentiment analysis report</p>
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
          <motion.button
            onClick={handleEndChat}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="end-chat-button"
            title="End Chat & View Analysis"
          >
            End Chat
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;