import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import "./SentimentAnalysisDashboard.css";
import api from "../api/axios";
import Loader from "./Loader";

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

  useEffect(() => {
    console.log("SessionId from params:", sessionId);
    console.log("Selected session:", selectedSession);
    fetchSessions();
    if (selectedSession) {
      fetchSentimentAnalysis();
    }
  }, [selectedSession, fetchSentimentAnalysis, fetchSessions, sessionId]);

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

      // Generate sentiment trends
      generateSentimentTrends(logs);
      generateEmotionBreakdown(logs);
      generateTopics(logs);

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
      generateEmotionBreakdown([
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
      generateTopics([
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
    } finally {
      setLoading(false);
    }
  };

  const generateSentimentTrends = (logs) => {
    const trends = logs.map((log, index) => ({
      id: index,
      message: log.message,
      sentiment: analyzeSimpleSentiment(log.message),
      timestamp: new Date(log.createdAt).toLocaleTimeString(),
      response: log.response
    }));
    setSentimentTrends(trends);
  };

  const generateEmotionBreakdown = (logs) => {
    const emotions = {
      joy: 0, sadness: 0, anger: 0, fear: 0, surprise: 0, neutral: 0
    };
    
    logs.forEach(log => {
      const emotion = detectEmotion(log.message);
      emotions[emotion]++;
    });

    setEmotionBreakdown(emotions);
  };

  const generateTopics = (logs) => {
    const topicKeywords = {
      'Mental Health': ['anxiety', 'depression', 'stress', 'therapy', 'counseling'],
      'Relationships': ['relationship', 'partner', 'family', 'friend', 'love'],
      'Work': ['work', 'job', 'career', 'office', 'boss', 'colleague'],
      'Health': ['health', 'exercise', 'diet', 'sleep', 'wellness'],
      'Personal Growth': ['goal', 'improve', 'learn', 'growth', 'development']
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

    setTopics(Object.entries(topicCounts).map(([topic, count]) => ({ topic, count })));
  };

  const analyzeSimpleSentiment = (text) => {
    const lowerText = text.toLowerCase();
    const positiveWords = ['happy', 'good', 'great', 'excellent', 'wonderful', 'amazing', 'love', 'like'];
    const negativeWords = ['sad', 'bad', 'terrible', 'awful', 'hate', 'angry', 'frustrated', 'worried'];
    
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  };

  const detectEmotion = (text) => {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('happy') || lowerText.includes('joy') || lowerText.includes('excited')) return 'joy';
    if (lowerText.includes('sad') || lowerText.includes('depressed') || lowerText.includes('lonely')) return 'sadness';
    if (lowerText.includes('angry') || lowerText.includes('furious') || lowerText.includes('mad')) return 'anger';
    if (lowerText.includes('scared') || lowerText.includes('afraid') || lowerText.includes('worried')) return 'fear';
    if (lowerText.includes('surprised') || lowerText.includes('shocked') || lowerText.includes('wow')) return 'surprise';
    return 'neutral';
  };

  const handleGenerateReport = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5000/api/report/session-report/${selectedSession}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to generate report");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Serenio_Report_${selectedSession}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Report generation failed:", err.message);
      alert("Failed to generate report. Please try again.");
    }
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive': return '#10B981';
      case 'negative': return '#EF4444';
      case 'neutral': return '#6B7280';
      default: return '#6B7280';
    }
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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-blue-50">
        <Loader size={40} />
      </div>
    );
  }

  return (
    <motion.div
      className="sentiment-dashboard min-h-screen bg-gradient-to-br from-gray-100 to-blue-50 p-4 md:p-8 font-sans"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <motion.div
        className="welcome-banner bg-gradient-to-r from-[#1E2A47] to-[#2D3748] text-white p-6 rounded-2xl mb-8 shadow-lg"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">Sentiment Analysis Dashboard</h2>
            <p className="text-blue-100">Comprehensive insights from your conversations</p>
            <p className="text-sm text-blue-200 mt-2">Session ID: {selectedSession}</p>
          </div>
          <div className="flex gap-3 mt-4 md:mt-0">
            <motion.button
              onClick={() => navigate("/chatbot")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              Start New Chat
            </motion.button>
            <motion.button
              onClick={() => setShowHistorical(!showHistorical)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              {showHistorical ? 'Hide History' : 'View History'}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Session Selector */}
      <AnimatePresence>
        {showHistorical && (
          <motion.div
            className="mb-6 bg-white rounded-xl p-6 shadow-lg"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Select Session</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {sessions.map((session) => (
                <motion.button
                  key={session}
                  onClick={() => setSelectedSession(session)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedSession === session
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-blue-300'
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
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          {error} {error.includes("No chat logs") && (
            <button
              onClick={() => navigate("/chatbot")}
              className="text-blue-600 underline ml-2"
            >
              Start Chat
            </button>
          )}
        </motion.div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['overview', 'trends', 'emotions', 'topics', 'details'].map((tab) => (
          <motion.button
            key={tab}
            onClick={() => setActiveTab(tab)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === tab
                ? 'bg-blue-500 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </motion.button>
        ))}
      </div>

      {/* Content based on active tab */}
      <AnimatePresence mode="wait">
        {activeTab === "overview" && (
          <motion.div
            key="overview"
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Sentiment Overview */}
            <motion.div
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="text-xl font-semibold mb-4 text-gray-800">Sentiment Overview</h3>
              <div className="text-center">
                <motion.div
                  className="w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center text-white text-2xl font-bold"
                  style={{ backgroundColor: getSentimentColor(sentiment) }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  {sentiment?.toUpperCase() || "N/A"}
                </motion.div>
                <p className="text-lg font-medium text-gray-700">Dominant Sentiment</p>
                <p className="text-sm text-gray-500 mt-2">Based on {chatLogs.length} messages</p>
              </div>
            </motion.div>

            {/* Recommendation */}
            <motion.div
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="text-xl font-semibold mb-4 text-gray-800">AI Recommendation</h3>
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-700 text-center leading-relaxed">{recommendation}</p>
              </div>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="text-xl font-semibold mb-4 text-gray-800">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Messages:</span>
                  <span className="font-semibold text-gray-800">{chatLogs.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Session Duration:</span>
                  <span className="font-semibold text-gray-800">
                    {chatLogs.length > 0 ? 
                      `${Math.round((new Date(chatLogs[chatLogs.length - 1].createdAt) - new Date(chatLogs[0].createdAt)) / 60000)} min` : 
                      'N/A'
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Topics Discussed:</span>
                  <span className="font-semibold text-gray-800">{topics.length}</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {activeTab === "trends" && (
          <motion.div
            key="trends"
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-xl font-semibold mb-6 text-gray-800">Sentiment Trends</h3>
            <div className="space-y-4">
              {sentimentTrends.length > 0 ? (
                sentimentTrends.map((trend, index) => (
                  <motion.div
                    key={index}
                    className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex-shrink-0">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getSentimentColor(trend.sentiment) }}
                      ></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{trend.message}</p>
                      <p className="text-xs text-gray-500">{trend.timestamp}</p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        trend.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                        trend.sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {trend.sentiment}
                      </span>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No sentiment trends available. Start a conversation to see trends.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === "emotions" && (
          <motion.div
            key="emotions"
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-xl font-semibold mb-6 text-gray-800">Emotion Breakdown</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(emotionBreakdown).map(([emotion, count]) => (
                <motion.div
                  key={emotion}
                  className="text-center p-4 bg-gray-50 rounded-lg"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <div
                    className="w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: getEmotionColor(emotion) }}
                  >
                    {count}
                  </div>
                  <p className="text-sm font-medium text-gray-700 capitalize">{emotion}</p>
                  <p className="text-xs text-gray-500">
                    {((count / chatLogs.length) * 100).toFixed(1)}%
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === "topics" && (
          <motion.div
            key="topics"
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-xl font-semibold mb-6 text-gray-800">Topics Discussed</h3>
            <div className="space-y-4">
              {topics.length > 0 ? (
                topics.map((topic, index) => (
                  <motion.div
                    key={topic.topic}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <span className="font-medium text-gray-800">{topic.topic}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <motion.div
                          className="bg-blue-500 h-2 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${(topic.count / Math.max(...topics.map(t => t.count))) * 100}%` }}
                          transition={{ duration: 0.8, delay: index * 0.1 }}
                        ></motion.div>
                      </div>
                      <span className="text-sm font-medium text-gray-600">{topic.count}</span>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No topics detected. Start a conversation to see topic analysis.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === "details" && (
          <motion.div
            key="details"
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-xl font-semibold mb-6 text-gray-800">Detailed Analysis</h3>
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-medium text-gray-800 mb-3">Conversation Summary</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700">
                    This session contains {chatLogs.length} messages with an overall {sentiment?.toLowerCase()} sentiment. 
                    The conversation covers {topics.length} main topics and shows various emotional states throughout the interaction.
                  </p>
                </div>
              </div>
              
              <div>
                <h4 className="text-lg font-medium text-gray-800 mb-3">Key Insights</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h5 className="font-medium text-blue-800 mb-2">Most Active Emotion</h5>
                    <p className="text-blue-700">
                      {Object.entries(emotionBreakdown).reduce((a, b) => a[1] > b[1] ? a : b)[0]}
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h5 className="font-medium text-green-800 mb-2">Primary Topic</h5>
                    <p className="text-green-700">
                      {topics.length > 0 ? topics[0].topic : 'No specific topic'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      <motion.div
        className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <motion.button
          onClick={handleGenerateReport}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="generate-report-btn"
        >
          Generate Detailed Report
        </motion.button>
        
        <motion.button
          onClick={() => navigate("/chatbot")}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-green-500 hover:bg-green-600 text-white font-bold text-lg px-8 py-4 rounded-full shadow-lg transition-all duration-300"
        >
          Start New Conversation
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default SentimentAnalysisDashboard;
