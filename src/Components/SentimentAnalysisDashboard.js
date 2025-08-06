import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import "./SentimentAnalysisDashboard.css";
import api from "../api/axios";
import Loader from "./Loader";
import { toast } from "react-toastify";

const SentimentAnalysisDashboard = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [sentiment, setSentiment] = useState(null);
  const [recommendation, setRecommendation] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [chatLogs, setChatLogs] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(sessionId);
  const [showHistorical, setShowHistorical] = useState(false);
  const [sentimentTrends, setSentimentTrends] = useState([]);
  const [emotionBreakdown, setEmotionBreakdown] = useState({});
  const [topics, setTopics] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [sessionStats, setSessionStats] = useState({
    totalMessages: 0,
    averageResponseTime: 0,
    sessionDuration: 0,
    engagementScore: 0
  });

  useEffect(() => {
    console.log("SessionId from params:", sessionId);
    console.log("Selected session:", selectedSession);
    fetchSessions();
    if (selectedSession) {
      fetchSentimentAnalysis();
    }
  }, [selectedSession, sessionId]);

  const fetchSessions = async () => {
    try {
      const response = await api.get("/api/chatlogs/sessions");
      console.log("Sessions response:", response.data);
      
      // Create meaningful session objects with names
      const sessionsWithNames = await Promise.all(
        response.data.map(async (sessionId) => {
          try {
            // Fetch first few messages to create a meaningful name
            const sessionLogsRes = await api.get(`/api/chatlogs/session/${sessionId}`);
            const sessionLogs = sessionLogsRes.data.filter(log => log.sessionId === sessionId);
            
            if (sessionLogs.length > 0) {
              const firstMessage = sessionLogs[0].message;
              const sessionDate = new Date(sessionLogs[0].createdAt);
              
              // Create a meaningful name based on first message and date
              const meaningfulName = generateSessionName(firstMessage, sessionDate, sessionLogs.length);
              
              return {
                id: sessionId,
                name: meaningfulName,
                date: sessionDate,
                messageCount: sessionLogs.length,
                firstMessage: firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : '')
              };
            } else {
              return {
                id: sessionId,
                name: `Session ${sessionId.slice(0, 8)}`,
                date: new Date(),
                messageCount: 0,
                firstMessage: 'No messages'
              };
            }
          } catch (error) {
            console.error("Error fetching session details:", error);
            return {
              id: sessionId,
              name: `Session ${sessionId.slice(0, 8)}`,
              date: new Date(),
              messageCount: 0,
              firstMessage: 'Unable to load'
            };
          }
        })
      );
      
      // Sort by date (newest first)
      sessionsWithNames.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      setSessions(sessionsWithNames);
    } catch (err) {
      console.error("Error fetching sessions:", err);
      // Set some default sessions for testing
      setSessions([{
        id: sessionId || "default-session",
        name: "Current Session",
        date: new Date(),
        messageCount: 0,
        firstMessage: 'No messages'
      }]);
    }
  };

  // Helper function to generate meaningful session names
  const generateSessionName = (firstMessage, date, messageCount) => {
    const dateStr = date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Extract key topics/emotions from first message
    const lowerMessage = firstMessage.toLowerCase();
    let topic = '';
    
    if (lowerMessage.includes('stress') || lowerMessage.includes('anxious') || lowerMessage.includes('anxiety')) {
      topic = '🧠 Stress & Anxiety';
    } else if (lowerMessage.includes('sad') || lowerMessage.includes('depressed') || lowerMessage.includes('depression')) {
      topic = '😢 Mood Support';
    } else if (lowerMessage.includes('relationship') || lowerMessage.includes('partner') || lowerMessage.includes('family')) {
      topic = '💕 Relationships';
    } else if (lowerMessage.includes('work') || lowerMessage.includes('job') || lowerMessage.includes('career')) {
      topic = '💼 Work & Career';
    } else if (lowerMessage.includes('sleep') || lowerMessage.includes('tired') || lowerMessage.includes('insomnia')) {
      topic = '😴 Sleep Issues';
    } else if (lowerMessage.includes('angry') || lowerMessage.includes('frustrated') || lowerMessage.includes('anger')) {
      topic = '😤 Anger Management';
    } else if (lowerMessage.includes('confidence') || lowerMessage.includes('self-esteem') || lowerMessage.includes('worth')) {
      topic = '💪 Self-Confidence';
    } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('help')) {
      topic = '💬 General Chat';
    } else {
      // Use first few words as topic
      const words = firstMessage.split(' ').slice(0, 2).join(' ');
      topic = `💭 ${words.charAt(0).toUpperCase() + words.slice(1)}`;
    }
    
    return `${topic} - ${dateStr} (${messageCount} msgs)`;
  };

  const fetchSentimentAnalysis = async () => {
    if (!selectedSession) {
      setError("No session selected. Please start a chat.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      console.log("🔍 Fetching chat logs for session:", selectedSession);
      const logsRes = await api.get(`/api/chatlogs/session/${selectedSession}`);
      const logs = logsRes.data;
      console.log("📊 Chat logs received for session:", selectedSession, "Count:", logs.length);
      setChatLogs(logs);

      if (logs.length === 0) {
        setError("No chat logs for this session. Please start a chat to generate analysis.");
        setSentiment("N/A");
        setRecommendation("No recommendation available. Please start a conversation first.");
        setLoading(false);
        return;
      }

      // Ensure we only analyze logs from this specific session
      const sessionLogs = logs.filter(log => log.sessionId === selectedSession);
      console.log("✅ Filtered logs for current session:", sessionLogs.length);

      const messages = sessionLogs.map(log => ({
        role: "user",
        content: `${log.message} (Response: ${log.response})`
      }));

      console.log("🤖 Sending messages for analysis:", messages.length, "messages");
      const aiRes = await api.post("/api/openai/sentiment", { messages });
      console.log("🧠 AI analysis response:", aiRes.data);
      setSentiment(aiRes.data.sentiment || "NEUTRAL");
      setRecommendation(aiRes.data.recommendation || "No recommendation available.");

      // Filter out any duplicate entries that might exist from the old double-saving issue
      const uniqueLogs = sessionLogs.filter((log, index, self) => 
        index === self.findIndex(l => 
          l.message === log.message && 
          l.response === log.response && 
          l.createdAt === log.createdAt
        )
      );

      console.log("📈 Processing unique logs:", uniqueLogs.length);

      // Generate sentiment trends and emotion breakdown using OpenAI API
      await generateSentimentTrends(uniqueLogs);
      await generateEmotionBreakdown(uniqueLogs);
      await generateTopics(uniqueLogs);
      calculateSessionStats(uniqueLogs);

    } catch (err) {
      console.error("Error fetching sentiment analysis:", err.response?.data || err.message);
      setError("Failed to load sentiment analysis. Please try again.");
      setSentiment("NEUTRAL");
      setRecommendation("No recommendation available due to error.");
      
      // Set some default data for demonstration
      setChatLogs([
        {
          message: "Hello, I'm feeling a bit anxious today.",
          response: "I understand. Let's talk about what's causing your anxiety.",
          createdAt: new Date().toISOString()
        },
        {
          message: "I've been having trouble sleeping lately.",
          response: "Sleep issues can be challenging. Have you tried any relaxation techniques?",
          createdAt: new Date().toISOString()
        }
      ]);
      
      generateSentimentTrends([
        { message: "Hello, I'm feeling a bit anxious today.", createdAt: new Date().toISOString() },
        { message: "I've been having trouble sleeping lately.", createdAt: new Date().toISOString() }
      ]);
      generateEmotionBreakdown([
        { message: "Hello, I'm feeling a bit anxious today." },
        { message: "I've been having trouble sleeping lately." }
      ]);
      generateTopics([
        { message: "Hello, I'm feeling a bit anxious today." },
        { message: "I've been having trouble sleeping lately." }
      ]);
      calculateSessionStats([
        { message: "Hello, I'm feeling a bit anxious today.", createdAt: new Date().toISOString() },
        { message: "I've been having trouble sleeping lately.", createdAt: new Date().toISOString() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const generateSentimentTrends = async (logs) => {
    try {
      // Ensure we only analyze logs from the current session
      const sessionLogs = logs.filter(log => log.sessionId === selectedSession);
      console.log("📈 Generating sentiment trends for session:", selectedSession, "Logs:", sessionLogs.length);
      
      if (sessionLogs.length === 0) {
        setSentimentTrends([]);
        return;
      }

      // Analyze each message individually for proper trends
      const trends = await Promise.all(sessionLogs.map(async (log, index) => {
        try {
          const response = await api.post("/api/openai/sentiment", { 
            messages: [{ role: "user", content: log.message }] 
          });
          
          // Convert sentiment to numerical value for trending
          let sentimentScore = 0;
          const sentiment = response.data.sentiment?.toUpperCase() || "NEUTRAL";
          
          switch (sentiment) {
            case "POSITIVE":
            case "HAPPY":
            case "JOY":
              sentimentScore = Math.random() * 0.3 + 0.7; // 0.7 to 1.0
              break;
            case "NEGATIVE":
            case "SAD":
            case "ANGRY":
            case "FEAR":
              sentimentScore = Math.random() * 0.3 + 0.1; // 0.1 to 0.4
              break;
            case "NEUTRAL":
            default:
              sentimentScore = Math.random() * 0.2 + 0.4; // 0.4 to 0.6
              break;
          }
          
          return {
            id: index,
            sentiment: sentiment,
            sentimentScore: sentimentScore,
            timestamp: new Date(log.createdAt).toLocaleTimeString(),
            message: log.message.substring(0, 50) + "...",
            x: index,
            y: sentimentScore
          };
        } catch (error) {
          console.error(`Error analyzing message ${index}:`, error);
          // Fallback with simple sentiment analysis
          const lowerMessage = log.message.toLowerCase();
          let sentiment = "NEUTRAL";
          let sentimentScore = 0.5;
          
          if (lowerMessage.includes("happy") || lowerMessage.includes("good") || lowerMessage.includes("great") || lowerMessage.includes("better")) {
            sentiment = "POSITIVE";
            sentimentScore = Math.random() * 0.2 + 0.7;
          } else if (lowerMessage.includes("sad") || lowerMessage.includes("bad") || lowerMessage.includes("worse") || lowerMessage.includes("anxious") || lowerMessage.includes("stress")) {
            sentiment = "NEGATIVE";
            sentimentScore = Math.random() * 0.2 + 0.2;
          }
          
          return {
            id: index,
            sentiment: sentiment,
            sentimentScore: sentimentScore,
            timestamp: new Date(log.createdAt).toLocaleTimeString(),
            message: log.message.substring(0, 50) + "...",
            x: index,
            y: sentimentScore
          };
        }
      }));
      
      console.log("📊 Generated sentiment trends:", trends);
      setSentimentTrends(trends);
    } catch (error) {
      console.error("Error generating sentiment trends:", error);
      // Fallback to simple analysis
      const sessionLogs = logs.filter(log => log.sessionId === selectedSession);
      const trends = sessionLogs.map((log, index) => {
        const lowerMessage = log.message.toLowerCase();
        let sentiment = "NEUTRAL";
        let sentimentScore = 0.5;
        
        if (lowerMessage.includes("happy") || lowerMessage.includes("good") || lowerMessage.includes("great") || lowerMessage.includes("better")) {
          sentiment = "POSITIVE";
          sentimentScore = Math.random() * 0.2 + 0.7;
        } else if (lowerMessage.includes("sad") || lowerMessage.includes("bad") || lowerMessage.includes("worse") || lowerMessage.includes("anxious") || lowerMessage.includes("stress")) {
          sentiment = "NEGATIVE";
          sentimentScore = Math.random() * 0.2 + 0.2;
        }
        
        return {
          id: index,
          sentiment: sentiment,
          sentimentScore: sentimentScore,
          timestamp: new Date(log.createdAt).toLocaleTimeString(),
          message: log.message.substring(0, 50) + "...",
          x: index,
          y: sentimentScore
        };
      });
      setSentimentTrends(trends);
    }
  };

  const generateEmotionBreakdown = async (logs) => {
    try {
      // Ensure we only analyze logs from the current session
      const sessionLogs = logs.filter(log => log.sessionId === selectedSession);
      console.log("😊 Generating emotion breakdown for session:", selectedSession, "Logs:", sessionLogs.length);
      
      if (sessionLogs.length === 0) {
        setEmotionBreakdown({});
        return;
      }

      // Use OpenAI API for emotion analysis
      const messages = sessionLogs.map(log => ({
        role: "user",
        content: log.message
      }));
      
      const response = await api.post("/api/openai/sentiment", { messages });
      const analysis = response.data;
      
      // Convert OpenAI emotion scores to counts
      const emotions = {};
      if (analysis.emotions) {
        Object.entries(analysis.emotions).forEach(([emotion, score]) => {
          if (score > 0.1) { // Only count emotions with significant scores
            emotions[emotion] = Math.round(score * sessionLogs.length);
          }
        });
      }
      
      setEmotionBreakdown(emotions);
    } catch (error) {
      console.error("Error generating emotion breakdown:", error);
      // Fallback to simple analysis
      const sessionLogs = logs.filter(log => log.sessionId === selectedSession);
      const emotions = sessionLogs.reduce((acc, log) => {
        const emotion = "neutral";
        acc[emotion] = (acc[emotion] || 0) + 1;
        return acc;
      }, {});
      setEmotionBreakdown(emotions);
    }
  };

  const generateTopics = async (logs) => {
    try {
      // Ensure we only analyze logs from the current session
      const sessionLogs = logs.filter(log => log.sessionId === selectedSession);
      console.log("🏷️ Generating topics for session:", selectedSession, "Logs:", sessionLogs.length);
      
      if (sessionLogs.length === 0) {
        setTopics([]);
        return;
      }

      // Use OpenAI API for topic analysis
      const messages = sessionLogs.map(log => ({
        role: "user",
        content: log.message
      }));
      
      const response = await api.post("/api/openai/sentiment", { messages });
      const analysis = response.data;
      
      if (analysis.topics && analysis.topics.length > 0) {
        // Convert OpenAI topics to our format
        const topics = analysis.topics.map(topic => ({
          topic: topic.topic,
          count: Math.round(topic.confidence * sessionLogs.length)
        }));
        setTopics(topics);
      } else {
        // Fallback to keyword-based topic detection
        const topicKeywords = {
          'Anxiety': ['anxious', 'worry', 'stress', 'panic', 'fear'],
          'Depression': ['sad', 'depressed', 'hopeless', 'worthless', 'tired'],
          'Sleep': ['sleep', 'insomnia', 'tired', 'rest', 'bed'],
          'Relationships': ['relationship', 'partner', 'family', 'friend', 'love'],
          'Work': ['work', 'job', 'career', 'boss', 'colleague'],
          'Health': ['health', 'sick', 'pain', 'doctor', 'medicine']
        };

        const topicCounts = {};
        sessionLogs.forEach(log => {
          const message = log.message.toLowerCase();
          Object.entries(topicKeywords).forEach(([topic, keywords]) => {
            if (keywords.some(keyword => message.includes(keyword))) {
              topicCounts[topic] = (topicCounts[topic] || 0) + 1;
            }
          });
        });

        const sortedTopics = Object.entries(topicCounts)
          .map(([topic, count]) => ({ topic, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
        
        setTopics(sortedTopics);
      }
    } catch (error) {
      console.error("Error generating topics:", error);
      // Fallback to keyword-based topic detection
      const sessionLogs = logs.filter(log => log.sessionId === selectedSession);
      const topicKeywords = {
        'Anxiety': ['anxious', 'worry', 'stress', 'panic', 'fear'],
        'Depression': ['sad', 'depressed', 'hopeless', 'worthless', 'tired'],
        'Sleep': ['sleep', 'insomnia', 'tired', 'rest', 'bed'],
        'Relationships': ['relationship', 'partner', 'family', 'friend', 'love'],
        'Work': ['work', 'job', 'career', 'boss', 'colleague'],
        'Health': ['health', 'sick', 'pain', 'doctor', 'medicine']
      };

      const topicCounts = {};
      sessionLogs.forEach(log => {
        const message = log.message.toLowerCase();
        Object.entries(topicKeywords).forEach(([topic, keywords]) => {
          if (keywords.some(keyword => message.includes(keyword))) {
            topicCounts[topic] = (topicCounts[topic] || 0) + 1;
          }
        });
      });

      const sortedTopics = Object.entries(topicCounts)
        .map(([topic, count]) => ({ topic, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      setTopics(sortedTopics);
    }
  };

  const calculateSessionStats = (logs) => {
    if (!logs || logs.length === 0) {
      setSessionStats({
        totalMessages: 0,
        averageResponseTime: 0,
        sessionDuration: 0,
        engagementScore: 0
      });
      return;
    }

    const totalMessages = logs.length;
    
    // Calculate session duration more accurately
    let sessionDuration = 0;
    if (logs.length > 1) {
      const firstMessage = new Date(logs[0].createdAt);
      const lastMessage = new Date(logs[logs.length - 1].createdAt);
      sessionDuration = (lastMessage - firstMessage) / 1000 / 60; // Convert to minutes
    }
    
    const averageResponseTime = totalMessages > 0 ? sessionDuration / totalMessages : 0;
    const engagementScore = Math.min(100, (totalMessages / 10) * 100);

    console.log("📊 Session stats calculation for session:", selectedSession, {
      totalMessages,
      sessionDuration: `${sessionDuration.toFixed(2)} minutes`,
      averageResponseTime: `${averageResponseTime.toFixed(2)} minutes`,
      engagementScore: `${engagementScore}%`,
      firstMessage: logs[0]?.createdAt,
      lastMessage: logs[logs.length - 1]?.createdAt
    });

    setSessionStats({
      totalMessages,
      averageResponseTime: Math.round(averageResponseTime * 100) / 100,
      sessionDuration: Math.round(sessionDuration * 100) / 100,
      engagementScore: Math.round(engagementScore)
    });
  };

  // OpenAI API is now used for sentiment and emotion analysis
  // Removed hardcoded functions in favor of AI-powered analysis

  const handleGenerateReport = async () => {
    try {
      console.log("Generating report for session:", selectedSession);
      const response = await api.get(`/api/report/session-report/${selectedSession}`, {
        responseType: 'blob' // Important: Set response type to blob for PDF
      });
      
      console.log("Report response received:", response);
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Serenio_Report_${selectedSession}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("📄 Report generated successfully!");
    } catch (error) {
      console.error("Error generating report:", error);
      if (error.response) {
        console.error("Error response:", error.response.data);
        toast.error(`❌ Failed to generate report: ${error.response.data.message || 'Unknown error'}`);
      } else {
        toast.error("❌ Failed to generate report. Please try again.");
      }
    }
  };

  const getSentimentColor = (sentiment) => {
    const colors = {
      POSITIVE: '#10B981',
      NEGATIVE: '#EF4444',
      NEUTRAL: '#6B7280',
      'N/A': '#9CA3AF'
    };
    return colors[sentiment] || '#6B7280';
  };

  const getEmotionColor = (emotion) => {
    const colors = {
      joy: '#F59E0B',
      sadness: '#3B82F6',
      anger: '#EF4444',
      fear: '#8B5CF6',
      surprise: '#EC4899',
      neutral: '#6B7280'
    };
    return colors[emotion] || '#6B7280';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <Loader size={40} />
          <p className="mt-4 text-gray-600">Analyzing your conversation...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="sentiment-dashboard min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8 font-sans"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <motion.div
        className="welcome-banner bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white p-8 rounded-3xl mb-8 shadow-2xl"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-4xl font-bold mb-3">🧠 Sentiment Analysis Dashboard</h2>
            <p className="text-indigo-100 text-lg">Comprehensive insights from your conversations</p>
                         <p className="text-sm text-indigo-200 mt-2">
               Session ID: {selectedSession} | 
               Messages: {chatLogs.filter(log => log.sessionId === selectedSession).length}
             </p>
          </div>
          <div className="button-container">
            <motion.button
              onClick={() => navigate("/chatbot")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="action-button primary-button"
            >
              <span className="button-icon">💬</span>
              <span className="button-text">Start New Chat</span>
            </motion.button>
            <motion.button
              onClick={() => setShowHistorical(!showHistorical)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="action-button secondary-button"
            >
              <span className="button-icon">📊</span>
              <span className="button-text">{showHistorical ? 'Hide History' : 'View History'}</span>
            </motion.button>
            <motion.button
              onClick={handleGenerateReport}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="action-button success-button"
            >
              <span className="button-icon">📄</span>
              <span className="button-text">Generate Report</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Session Selector */}
      <AnimatePresence>
        {showHistorical && (
          <motion.div
            className="mb-8 bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-2xl font-bold mb-6 text-gray-800">📚 Select Session</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sessions.map((session) => (
                <motion.button
                  key={session.id || session}
                  onClick={() => setSelectedSession(session.id || session)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    selectedSession === (session.id || session)
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-lg'
                      : 'border-gray-200 bg-white/50 text-gray-700 hover:border-indigo-300 hover:bg-indigo-50/50'
                  }`}
                >
                  <div className="font-semibold text-sm mb-2 truncate">
                    {session.name || session}
                  </div>
                  {session.firstMessage && (
                    <div className="text-xs text-gray-500 mb-2 line-clamp-2">
                      "{session.firstMessage}"
                    </div>
                  )}
                  {session.date && (
                    <div className="text-xs text-gray-400">
                      {new Date(session.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <motion.div
          className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-xl mb-8 shadow-lg"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="flex items-center">
            <span className="text-xl mr-3">⚠️</span>
            <div>
              {error} {error.includes("No chat logs") && (
                <button
                  onClick={() => navigate("/chatbot")}
                  className="text-blue-600 underline ml-2 hover:text-blue-800"
                >
                  Start Chat
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Navigation Tabs */}
      <div className="tab-navigation">
        {[
          { id: 'overview', label: 'Overview', icon: '📊' },
          { id: 'trends', label: 'Trends', icon: '📈' },
          { id: 'emotions', label: 'Emotions', icon: '😊' },
          { id: 'topics', label: 'Topics', icon: '🏷️' },
          { id: 'details', label: 'Details', icon: '📋' }
        ].map((tab) => (
          <motion.button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Content based on active tab */}
      <AnimatePresence mode="wait">
        {activeTab === "overview" && (
          <motion.div
            key="overview"
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Sentiment Overview */}
            <motion.div
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-3">
                🎯 Sentiment Overview
              </h3>
              <div className="text-center">
                <motion.div
                  className="w-32 h-32 mx-auto mb-6 rounded-full flex items-center justify-center text-4xl font-bold text-white shadow-lg"
                  style={{ backgroundColor: getSentimentColor(sentiment) }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring" }}
                >
                  {sentiment === 'POSITIVE' ? '😊' : sentiment === 'NEGATIVE' ? '😔' : '😐'}
                </motion.div>
                <h4 className="text-xl font-semibold mb-2 text-gray-800">{sentiment}</h4>
                <p className="text-gray-600">Overall conversation sentiment</p>
              </div>
            </motion.div>

            {/* Session Statistics */}
            <motion.div
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-3">
                📈 Session Statistics
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Messages</span>
                  <span className="font-bold text-indigo-600">{sessionStats.totalMessages}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Session Duration</span>
                  <span className="font-bold text-indigo-600">{sessionStats.sessionDuration} min</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Engagement Score</span>
                  <span className="font-bold text-indigo-600">{sessionStats.engagementScore}%</span>
                </div>
              </div>
            </motion.div>

            {/* Recommendations */}
            <motion.div
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-3">
                💡 Recommendations
              </h3>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4">
                <p className="text-gray-700 leading-relaxed">{recommendation}</p>
              </div>
            </motion.div>
          </motion.div>
        )}

        {activeTab === "trends" && (
          <motion.div
            key="trends"
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-3">
              📈 Sentiment Trends
            </h3>
            
            {sentimentTrends.length > 0 ? (
              <>
                {/* Visual Trend Chart */}
                <div className="mb-8 p-6 bg-gray-50 rounded-xl">
                  <h4 className="text-lg font-semibold mb-4 text-gray-700">Mood Progression</h4>
                  <div className="relative h-40 bg-white rounded-lg p-4 border">
                    <svg width="100%" height="100%" viewBox="0 0 400 120" className="overflow-visible">
                      {/* Grid lines */}
                      <defs>
                        <pattern id="grid" width="40" height="24" patternUnits="userSpaceOnUse">
                          <path d="M 40 0 L 0 0 0 24" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#grid)" />
                      
                      {/* Y-axis labels */}
                      <text x="5" y="15" fontSize="10" fill="#6b7280">Positive</text>
                      <text x="5" y="65" fontSize="10" fill="#6b7280">Neutral</text>
                      <text x="5" y="115" fontSize="10" fill="#6b7280">Negative</text>
                      
                      {/* Trend line */}
                      {sentimentTrends.length > 1 && (
                        <polyline
                          points={sentimentTrends.map((trend, index) => 
                            `${50 + (index * (300 / (sentimentTrends.length - 1)))},${120 - (trend.sentimentScore * 100)}`
                          ).join(' ')}
                          fill="none"
                          stroke="#3B82F6"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />
                      )}
                      
                      {/* Data points */}
                      {sentimentTrends.map((trend, index) => (
                        <g key={trend.id}>
                          <circle
                            cx={50 + (index * (300 / Math.max(sentimentTrends.length - 1, 1)))}
                            cy={120 - (trend.sentimentScore * 100)}
                            r="4"
                            fill={getSentimentColor(trend.sentiment)}
                            stroke="white"
                            strokeWidth="2"
                          />
                          <text
                            x={50 + (index * (300 / Math.max(sentimentTrends.length - 1, 1)))}
                            y={135}
                            fontSize="8"
                            fill="#6b7280"
                            textAnchor="middle"
                          >
                            {index + 1}
                          </text>
                        </g>
                      ))}
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500 mt-2 text-center">
                    Message progression from start (1) to end ({sentimentTrends.length}) of conversation
                  </p>
                </div>

                {/* Detailed List */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-700">Message Details</h4>
                  {sentimentTrends.map((trend, index) => (
                    <motion.div
                      key={trend.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: getSentimentColor(trend.sentiment) }}
                          />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{trend.message}</p>
                          <p className="text-sm text-gray-500">{trend.timestamp}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-gray-700">{trend.sentiment}</span>
                        <p className="text-xs text-gray-500">
                          Score: {(trend.sentimentScore * 100).toFixed(0)}%
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No sentiment data available for this session.</p>
                <p className="text-sm">Start a conversation to see mood trends.</p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "emotions" && (
          <motion.div
            key="emotions"
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-3">
              😊 Emotion Breakdown
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(emotionBreakdown).map(([emotion, count], index) => (
                <motion.div
                  key={emotion}
                  className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 text-center"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div
                    className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-2xl"
                    style={{ backgroundColor: getEmotionColor(emotion) + '20' }}
                  >
                    {emotion === 'joy' ? '😊' : emotion === 'sadness' ? '😔' : 
                     emotion === 'anger' ? '😠' : emotion === 'fear' ? '😨' : 
                     emotion === 'surprise' ? '😲' : '😐'}
                  </div>
                  <h4 className="font-semibold text-gray-800 capitalize">{emotion}</h4>
                  <p className="text-2xl font-bold text-indigo-600">{count}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === "topics" && (
          <motion.div
            key="topics"
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-3">
              🏷️ Discussion Topics
            </h3>
            <div className="space-y-4">
              {topics.map((topic, index) => (
                <motion.div
                  key={topic.topic}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <span className="font-semibold text-gray-800">{topic.topic}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full"
                        style={{ width: `${(topic.count / Math.max(...topics.map(t => t.count))) * 100}%` }}
                      />
                    </div>
                    <span className="font-bold text-indigo-600">{topic.count}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === "details" && (
          <motion.div
            key="details"
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-3">
              📋 Conversation Details
            </h3>
                         <div className="space-y-4 max-h-96 overflow-y-auto">
               {chatLogs
                 .filter(log => log.sessionId === selectedSession)
                 .map((log, index) => (
                   <motion.div
                     key={index}
                     className="bg-gray-50 rounded-xl p-4"
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: index * 0.05 }}
                   >
                     <div className="mb-2">
                       <span className="font-semibold text-indigo-600">You:</span>
                       <p className="text-gray-800 ml-2">{log.message}</p>
                     </div>
                     <div>
                       <span className="font-semibold text-purple-600">AI:</span>
                       <p className="text-gray-700 ml-2">{log.response}</p>
                     </div>
                     <p className="text-xs text-gray-500 mt-2">
                       {new Date(log.createdAt).toLocaleString()}
                     </p>
                   </motion.div>
                 ))}
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SentimentAnalysisDashboard;
