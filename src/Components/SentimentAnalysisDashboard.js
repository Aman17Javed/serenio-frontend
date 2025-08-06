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
      setSessions(response.data);
    } catch (err) {
      console.error("Error fetching sessions:", err);
      // Set some default sessions for testing
      setSessions([sessionId || "default-session"]);
    }
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
      console.log("Fetching chat logs for session:", selectedSession);
      const logsRes = await api.get(`/api/chatlogs/session/${selectedSession}`);
      const logs = logsRes.data;
      console.log("Chat logs received:", logs);
      setChatLogs(logs);

      if (logs.length === 0) {
        setError("No chat logs for this session. Please start a chat to generate analysis.");
        setSentiment("N/A");
        setRecommendation("No recommendation available. Please start a conversation first.");
        setLoading(false);
        return;
      }

      const messages = logs.map(log => ({
        role: "user",
        content: `${log.message} (Response: ${log.response})`
      }));

      console.log("Sending messages for analysis:", messages);
      const aiRes = await api.post("/api/openai/sentiment", { messages });
      console.log("AI analysis response:", aiRes.data);
      setSentiment(aiRes.data.sentiment || "NEUTRAL");
      setRecommendation(aiRes.data.recommendation || "No recommendation available.");

      // Filter out any duplicate entries that might exist from the old double-saving issue
      const uniqueLogs = logs.filter((log, index, self) => 
        index === self.findIndex(l => 
          l.message === log.message && 
          l.response === log.response && 
          l.createdAt === log.createdAt
        )
      );

      // Generate sentiment trends
      generateSentimentTrends(uniqueLogs);
      generateEmotionBreakdown(uniqueLogs);
      generateTopics(uniqueLogs);
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

  const generateSentimentTrends = (logs) => {
    const trends = logs.map((log, index) => ({
      id: index,
      sentiment: analyzeSimpleSentiment(log.message),
      timestamp: new Date(log.createdAt).toLocaleTimeString(),
      message: log.message.substring(0, 50) + "..."
    }));
    setSentimentTrends(trends);
  };

  const generateEmotionBreakdown = (logs) => {
    const emotions = logs.reduce((acc, log) => {
      const emotion = detectEmotion(log.message);
      acc[emotion] = (acc[emotion] || 0) + 1;
      return acc;
    }, {});
    setEmotionBreakdown(emotions);
  };

  const generateTopics = (logs) => {
    const topicKeywords = {
      'Anxiety': ['anxious', 'worry', 'stress', 'panic', 'fear'],
      'Depression': ['sad', 'depressed', 'hopeless', 'worthless', 'tired'],
      'Sleep': ['sleep', 'insomnia', 'tired', 'rest', 'bed'],
      'Relationships': ['relationship', 'partner', 'family', 'friend', 'love'],
      'Work': ['work', 'job', 'career', 'boss', 'colleague'],
      'Health': ['health', 'sick', 'pain', 'doctor', 'medicine']
    };

    const topicCounts = {};
    logs.forEach(log => {
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
  };

  const calculateSessionStats = (logs) => {
    const totalMessages = logs.length;
    const sessionDuration = logs.length > 1 
      ? (new Date(logs[logs.length - 1].createdAt) - new Date(logs[0].createdAt)) / 1000 / 60
      : 0;
    const averageResponseTime = totalMessages > 0 ? sessionDuration / totalMessages : 0;
    const engagementScore = Math.min(100, (totalMessages / 10) * 100);

    console.log("Session stats calculation:", {
      totalMessages,
      sessionDuration,
      averageResponseTime,
      engagementScore
    });

    setSessionStats({
      totalMessages,
      averageResponseTime: Math.round(averageResponseTime * 100) / 100,
      sessionDuration: Math.round(sessionDuration * 100) / 100,
      engagementScore: Math.round(engagementScore)
    });
  };

  const analyzeSimpleSentiment = (text) => {
    const positiveWords = ['happy', 'good', 'great', 'excellent', 'wonderful', 'amazing', 'love', 'joy'];
    const negativeWords = ['sad', 'bad', 'terrible', 'awful', 'hate', 'angry', 'anxious', 'depressed'];
    
    const words = text.toLowerCase().split(' ');
    const positiveCount = words.filter(word => positiveWords.includes(word)).length;
    const negativeCount = words.filter(word => negativeWords.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'POSITIVE';
    if (negativeCount > positiveCount) return 'NEGATIVE';
    return 'NEUTRAL';
  };

  const detectEmotion = (text) => {
    const emotions = {
      joy: ['happy', 'joy', 'excited', 'great', 'wonderful'],
      sadness: ['sad', 'depressed', 'hopeless', 'crying'],
      anger: ['angry', 'mad', 'furious', 'hate'],
      fear: ['scared', 'afraid', 'anxious', 'worried'],
      surprise: ['shocked', 'surprised', 'amazed'],
      neutral: ['okay', 'fine', 'normal']
    };

    const words = text.toLowerCase().split(' ');
    for (const [emotion, keywords] of Object.entries(emotions)) {
      if (keywords.some(keyword => words.includes(keyword))) {
        return emotion;
      }
    }
    return 'neutral';
  };

  const handleGenerateReport = async () => {
    try {
      const response = await api.get(`/api/report/session-report/${selectedSession}`);
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
      toast.error("❌ Failed to generate report. Please try again.");
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
            <p className="text-sm text-indigo-200 mt-2">Session ID: {selectedSession}</p>
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
                  key={session}
                  onClick={() => setSelectedSession(session)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedSession === session
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-lg'
                      : 'border-gray-200 bg-white/50 text-gray-700 hover:border-indigo-300 hover:bg-indigo-50/50'
                  }`}
                >
                  <div className="text-sm font-medium truncate">{session}</div>
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
            <div className="space-y-4">
              {sentimentTrends.map((trend, index) => (
                <motion.div
                  key={trend.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: getSentimentColor(trend.sentiment) }}
                    />
                    <div>
                      <p className="font-medium text-gray-800">{trend.message}</p>
                      <p className="text-sm text-gray-500">{trend.timestamp}</p>
                    </div>
                  </div>
                  <span className="font-semibold text-gray-700">{trend.sentiment}</span>
                </motion.div>
              ))}
            </div>
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
              {chatLogs.map((log, index) => (
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
