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
      <div className="reports-loading">
        <div className="loading-content">
          <Loader size={40} />
          <p className="loading-text">Loading your reports...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="reports-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <motion.div
        className="reports-header"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="header-content">
          <div className="header-text">
            <h2 className="header-title">📊 Your Mental Health Reports</h2>
            <p className="header-subtitle">Comprehensive analysis of your therapy sessions</p>
            <p className="header-count">{reports.length} reports available</p>
          </div>
          <div className="header-actions">
            <motion.button
              onClick={() => navigate("/chatbot")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-primary"
            >
              💬 Start New Session
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
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
            className={`filter-tab ${filter === tab.id ? 'filter-tab-active' : ''}`}
          >
            <span className="filter-icon">{tab.icon}</span>
            {tab.label}
          </motion.button>
        ))}
      </div>

      {/* Reports Grid */}
      {filteredReports.length === 0 ? (
        <motion.div
          className="empty-state"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="empty-icon">📊</div>
          <h3 className="empty-title">No Reports Found</h3>
          <p className="empty-description">Start a conversation to generate your first report</p>
          <motion.button
            onClick={() => navigate("/chatbot")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn-primary"
          >
            💬 Start Your First Session
          </motion.button>
        </motion.div>
      ) : (
        <div className="reports-grid">
          {filteredReports.map((report, index) => (
            <motion.div
              key={report.id}
              className="report-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
            >
              {/* Report Header */}
              <div className="report-header">
                <div className="report-info">
                  <h3 className="report-title">
                    {report.name}
                  </h3>
                  <p className="report-date">
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
                  className="sentiment-badge"
                  style={{ backgroundColor: getSentimentColor(report.sentiment) }}
                >
                  {report.sentiment === 'POSITIVE' ? '😊' : report.sentiment === 'NEGATIVE' ? '🤗' : '😐'}
                </div>
              </div>

              {/* Report Stats */}
              <div className="report-stats">
                <div className="stat-item">
                  <span className="stat-label">Messages</span>
                  <span className="stat-value">{report.messageCount}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Duration</span>
                  <span className="stat-value">{report.duration}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Sentiment</span>
                  <span className="stat-value" style={{ color: getSentimentColor(report.sentiment) }}>
                    {report.sentiment}
                  </span>
                </div>
              </div>

              {/* Topics */}
              {report.topics.length > 0 && (
                <div className="topics-section">
                  <p className="section-label">Topics Discussed:</p>
                  <div className="topics-list">
                    {report.topics.map((topic, idx) => (
                      <span key={idx} className="topic-tag">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Emotions */}
              {report.emotions.length > 0 && (
                <div className="emotions-section">
                  <p className="section-label">Primary Emotions:</p>
                  <div className="emotions-list">
                    {report.emotions.map((emotion, idx) => (
                      <span key={idx} className="emotion-tag">
                        {getEmotionIcon(emotion)} {emotion}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="action-buttons">
                <motion.button
                  onClick={() => handleViewAnalysis(report)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-view-analysis"
                >
                  📊 View Analysis
                </motion.button>
                <motion.button
                  onClick={() => handleGeneratePDF(report)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-download-pdf"
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
          className="summary-stats"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="summary-title">
            📈 Reports Summary
          </h3>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">{reports.length}</div>
              <div className="stat-label">Total Reports</div>
            </div>
            <div className="stat-card">
              <div className="stat-number positive">
                {reports.filter(r => r.sentiment === 'POSITIVE').length}
              </div>
              <div className="stat-label">Positive Sessions</div>
            </div>
            <div className="stat-card">
              <div className="stat-number supportive">
                {reports.filter(r => r.sentiment === 'NEGATIVE').length}
              </div>
              <div className="stat-label">Supportive Sessions</div>
            </div>
            <div className="stat-card">
              <div className="stat-number neutral">
                {Math.round(reports.reduce((acc, r) => acc + r.messageCount, 0) / reports.length)}
              </div>
              <div className="stat-label">Avg Messages</div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Reports;
