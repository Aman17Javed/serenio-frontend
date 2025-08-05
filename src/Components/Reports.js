import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import Loader from "./Loader";
import { toast } from "react-toastify";
import "./Reports.css";

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    fetchReports();
  }, []);

    const fetchReports = async () => {
      try {
      setLoading(true);
      // Fetch user's chat sessions and generate reports
      const sessionsResponse = await api.get("/api/chatlogs/sessions");
      const sessions = sessionsResponse.data;
      
      // Generate report data for each session
      const reportsData = await Promise.all(
        sessions.map(async (sessionId) => {
          try {
            const chatLogsResponse = await api.get(`/api/chatlogs/session/${sessionId}`);
            const chatLogs = chatLogsResponse.data;
            
            if (chatLogs.length === 0) return null;

            // Analyze sentiment for the session
            const messages = chatLogs.map(log => ({
              role: "user",
              content: `${log.message} (Response: ${log.response})`
            }));

            const sentimentResponse = await api.post("/api/openai/sentiment", { messages });
            const sentiment = sentimentResponse.data.sentiment || "NEUTRAL";
            
            // Generate meaningful report name
            const reportName = generateReportName(chatLogs, sentiment);
            
            return {
              id: sessionId,
              name: reportName,
              date: chatLogs[0].createdAt,
              sentiment: sentiment,
              messageCount: chatLogs.length,
              duration: calculateSessionDuration(chatLogs),
              topics: extractTopics(chatLogs),
              emotions: analyzeEmotions(chatLogs)
            };
          } catch (error) {
            console.error(`Error processing session ${sessionId}:`, error);
            return null;
          }
        })
      );

      const validReports = reportsData.filter(report => report !== null);
      setReports(validReports);
      } catch (error) {
        console.error("Failed to fetch reports", error);
      toast.error("❌ Failed to load reports. Please try again.");
      } finally {
        setLoading(false);
      }
    };

  const generateReportName = (chatLogs, sentiment) => {
    const firstMessage = chatLogs[0].message.toLowerCase();
    const date = new Date(chatLogs[0].createdAt).toLocaleDateString();
    
    // Extract key topics from the conversation
    const topics = extractTopics(chatLogs);
    const primaryTopic = topics.length > 0 ? topics[0] : "General Discussion";
    
    // Generate meaningful name based on content and sentiment
    let prefix = "";
    if (sentiment === "POSITIVE") {
      prefix = "Positive";
    } else if (sentiment === "NEGATIVE") {
      prefix = "Supportive";
    } else {
      prefix = "Neutral";
    }
    
    return `${prefix} ${primaryTopic} Session - ${date}`;
  };

  const calculateSessionDuration = (chatLogs) => {
    if (chatLogs.length < 2) return "0 min";
    const startTime = new Date(chatLogs[0].createdAt);
    const endTime = new Date(chatLogs[chatLogs.length - 1].createdAt);
    const duration = Math.round((endTime - startTime) / 1000 / 60);
    return `${duration} min`;
  };

  const extractTopics = (chatLogs) => {
    const topicKeywords = {
      'Anxiety': ['anxious', 'worry', 'stress', 'panic', 'fear'],
      'Depression': ['sad', 'depressed', 'hopeless', 'worthless', 'tired'],
      'Sleep': ['sleep', 'insomnia', 'tired', 'rest', 'bed'],
      'Relationships': ['relationship', 'partner', 'family', 'friend', 'love'],
      'Work': ['work', 'job', 'career', 'boss', 'colleague'],
      'Health': ['health', 'sick', 'pain', 'doctor', 'medicine']
    };

    const topicCounts = {};
    chatLogs.forEach(log => {
      const message = log.message.toLowerCase();
      Object.entries(topicKeywords).forEach(([topic, keywords]) => {
        if (keywords.some(keyword => message.includes(keyword))) {
          topicCounts[topic] = (topicCounts[topic] || 0) + 1;
        }
      });
    });

    return Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([topic]) => topic);
  };

  const analyzeEmotions = (chatLogs) => {
    const emotions = {
      joy: ['happy', 'joy', 'excited', 'great', 'wonderful'],
      sadness: ['sad', 'depressed', 'hopeless', 'crying'],
      anger: ['angry', 'mad', 'furious', 'hate'],
      fear: ['scared', 'afraid', 'anxious', 'worried'],
      surprise: ['shocked', 'surprised', 'amazed'],
      neutral: ['okay', 'fine', 'normal']
    };

    const emotionCounts = {};
    chatLogs.forEach(log => {
      const words = log.message.toLowerCase().split(' ');
      for (const [emotion, keywords] of Object.entries(emotions)) {
        if (keywords.some(keyword => words.includes(keyword))) {
          emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
        }
      }
    });

    return Object.entries(emotionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([emotion]) => emotion);
  };

  const handleGeneratePDF = async (report) => {
    try {
      const response = await api.get(`/api/report/session-report/${report.id}`);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${report.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("📄 Report downloaded successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("❌ Failed to generate PDF. Please try again.");
    }
  };

  const handleViewAnalysis = (report) => {
    navigate(`/sentimentAnalysisDashboard/${report.id}`);
  };

  const getSentimentColor = (sentiment) => {
    const colors = {
      POSITIVE: '#10B981',
      NEGATIVE: '#EF4444',
      NEUTRAL: '#6B7280'
    };
    return colors[sentiment] || '#6B7280';
  };

  const getEmotionIcon = (emotion) => {
    const icons = {
      joy: '😊',
      sadness: '😔',
      anger: '😠',
      fear: '😨',
      surprise: '😲',
      neutral: '😐'
    };
    return icons[emotion] || '😐';
  };

  const filteredReports = reports.filter(report => {
    if (filter === "all") return true;
    return report.sentiment.toLowerCase() === filter.toLowerCase();
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <Loader size={40} />
          <p className="mt-4 text-gray-600">Loading your reports...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="reports-container min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8"
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
            <h2 className="text-4xl font-bold mb-3">📊 Your Mental Health Reports</h2>
            <p className="text-indigo-100 text-lg">Comprehensive analysis of your therapy sessions</p>
            <p className="text-sm text-indigo-200 mt-2">{reports.length} reports available</p>
          </div>
          <div className="flex gap-3 mt-6 md:mt-0">
            <motion.button
              onClick={() => navigate("/chatbot")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-6 py-3 rounded-xl font-semibold transition-all border border-white/30"
            >
              💬 Start New Session
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-3 mb-8">
        {[
          { id: 'all', label: 'All Reports', icon: '📋' },
          { id: 'positive', label: 'Positive', icon: '😊' },
          { id: 'negative', label: 'Supportive', icon: '🤗' },
          { id: 'neutral', label: 'Neutral', icon: '😐' }
        ].map((tab) => (
          <motion.button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
              filter === tab.id
                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
                : 'bg-white/80 backdrop-blur-sm text-gray-600 hover:bg-white hover:shadow-md'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </motion.button>
        ))}
      </div>

      {/* Reports Grid */}
      {filteredReports.length === 0 ? (
        <motion.div
          className="text-center py-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-2xl font-bold text-gray-800 mb-4">No Reports Found</h3>
          <p className="text-gray-600 mb-8">Start a conversation to generate your first report</p>
          <motion.button
            onClick={() => navigate("/chatbot")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-8 py-4 rounded-xl font-semibold shadow-lg"
          >
            💬 Start Your First Session
          </motion.button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReports.map((report, index) => (
            <motion.div
              key={report.id}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl transition-all"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
            >
              {/* Report Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2">
                    {report.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {new Date(report.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ml-4"
                  style={{ backgroundColor: getSentimentColor(report.sentiment) }}
                >
                  {report.sentiment === 'POSITIVE' ? '😊' : report.sentiment === 'NEGATIVE' ? '🤗' : '😐'}
                </div>
              </div>

              {/* Report Stats */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Messages</span>
                  <span className="font-semibold text-indigo-600">{report.messageCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Duration</span>
                  <span className="font-semibold text-indigo-600">{report.duration}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Sentiment</span>
                  <span className="font-semibold" style={{ color: getSentimentColor(report.sentiment) }}>
                    {report.sentiment}
                  </span>
                </div>
              </div>

              {/* Topics */}
              {report.topics.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Topics Discussed:</p>
                  <div className="flex flex-wrap gap-2">
                    {report.topics.map((topic, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full font-medium"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Emotions */}
              {report.emotions.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm text-gray-600 mb-2">Primary Emotions:</p>
                  <div className="flex gap-2">
                    {report.emotions.map((emotion, idx) => (
                      <span
                        key={idx}
                        className="flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium"
                      >
                        {getEmotionIcon(emotion)} {emotion}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <motion.button
                  onClick={() => handleViewAnalysis(report)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-2 px-4 rounded-xl font-medium text-sm transition-all"
                >
                  📊 View Analysis
                </motion.button>
                <motion.button
                  onClick={() => handleGeneratePDF(report)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2 px-4 rounded-xl font-medium text-sm transition-all"
                >
                  📄 Download PDF
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {reports.length > 0 && (
        <motion.div
          className="mt-12 bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-3">
            📈 Reports Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600 mb-2">{reports.length}</div>
              <div className="text-gray-600">Total Reports</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {reports.filter(r => r.sentiment === 'POSITIVE').length}
              </div>
              <div className="text-gray-600">Positive Sessions</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {reports.filter(r => r.sentiment === 'NEGATIVE').length}
              </div>
              <div className="text-gray-600">Supportive Sessions</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {Math.round(reports.reduce((acc, r) => acc + r.messageCount, 0) / reports.length)}
              </div>
              <div className="text-gray-600">Avg Messages</div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Reports;
