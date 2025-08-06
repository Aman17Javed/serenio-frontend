import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './RealTimeSentiment.css';
import api from '../api/axios';

const RealTimeSentiment = ({ messages, isVisible = true }) => {
  const [currentSentiment, setCurrentSentiment] = useState('neutral');
  const [sentimentHistory, setSentimentHistory] = useState([]);
  const [emotionBreakdown, setEmotionBreakdown] = useState({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (messages.length > 0) {
      analyzeSentiment();
    }
  }, [messages]);

  const analyzeSentiment = async () => {
    setIsAnalyzing(true);
    
    try {
      // Use OpenAI API for real-time sentiment analysis
      const recentMessages = messages.slice(-5); // Analyze last 5 messages
      const messagesForAnalysis = recentMessages.map(msg => ({
        role: "user",
        content: msg.text
      }));
      
      const response = await api.post("/api/openai/sentiment", { messages: messagesForAnalysis });
      const analysis = response.data;
      
      // Set current sentiment
      setCurrentSentiment(analysis.sentiment?.toLowerCase() || 'neutral');
      
      // Update emotion breakdown from OpenAI analysis
      if (analysis.emotions) {
        setEmotionBreakdown(analysis.emotions);
      } else {
        // Fallback emotion breakdown
        setEmotionBreakdown({
          joy: 0.2,
          sadness: 0.2,
          anger: 0.1,
          fear: 0.1,
          neutral: 0.4
        });
      }
      
      // Update sentiment history
      setSentimentHistory(prev => [...prev, {
        sentiment: analysis.sentiment?.toLowerCase() || 'neutral',
        timestamp: new Date(),
        messageCount: messages.length
      }]);
      
    } catch (error) {
      console.error("Error analyzing sentiment:", error);
      
      // Fallback to simple analysis
      const recentMessages = messages.slice(-5);
      const allText = recentMessages.map(msg => msg.text).join(' ').toLowerCase();
      
      const positiveWords = ['happy', 'good', 'great', 'excellent', 'wonderful', 'amazing', 'love', 'like', 'excited', 'joy', 'pleased'];
      const negativeWords = ['sad', 'bad', 'terrible', 'awful', 'hate', 'angry', 'frustrated', 'worried', 'anxious', 'depressed', 'lonely'];
      
      let positiveCount = 0;
      let negativeCount = 0;
      
      positiveWords.forEach(word => {
        if (allText.includes(word)) positiveCount++;
      });
      negativeWords.forEach(word => {
        if (allText.includes(word)) negativeCount++;
      });
      
      let sentiment = 'neutral';
      if (positiveCount > negativeCount && positiveCount > 0) {
        sentiment = 'positive';
      } else if (negativeCount > positiveCount && negativeCount > 0) {
        sentiment = 'negative';
      }
      
      setCurrentSentiment(sentiment);
      setEmotionBreakdown({
        joy: 0.2,
        sadness: 0.2,
        anger: 0.1,
        fear: 0.1,
        neutral: 0.4
      });
      
      setSentimentHistory(prev => [...prev, {
        sentiment,
        timestamp: new Date(),
        messageCount: messages.length
      }]);
    }
    
    setIsAnalyzing(false);
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
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
      neutral: '#6B7280'
    };
    return colors[emotion] || '#6B7280';
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="real-time-sentiment"
        initial={{ opacity: 0, x: 300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 300 }}
        transition={{ duration: 0.3 }}
      >
        <div className="sentiment-header">
          <h3>Real-Time Sentiment</h3>
          {isAnalyzing && (
            <motion.div
              className="analyzing-indicator"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              🔄
            </motion.div>
          )}
        </div>

        <div className="sentiment-content">
          {/* Current Sentiment */}
          <div className="current-sentiment">
            <div className="sentiment-circle">
              <motion.div
                className="sentiment-indicator"
                style={{ backgroundColor: getSentimentColor(currentSentiment) }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            <span className="sentiment-label">{currentSentiment.toUpperCase()}</span>
          </div>

          {/* Emotion Breakdown */}
          <div className="emotion-breakdown">
            <h4>Emotions Detected</h4>
            <div className="emotion-grid">
              {Object.entries(emotionBreakdown).map(([emotion, count]) => (
                <motion.div
                  key={emotion}
                  className="emotion-item"
                  whileHover={{ scale: 1.05 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div
                    className="emotion-dot"
                    style={{ backgroundColor: getEmotionColor(emotion) }}
                  />
                  <span className="emotion-name">{emotion}</span>
                  <span className="emotion-count">{count}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Sentiment Trend */}
          <div className="sentiment-trend">
            <h4>Recent Trend</h4>
            <div className="trend-line">
              {sentimentHistory.slice(-6).map((entry, index) => (
                <motion.div
                  key={index}
                  className="trend-point"
                  style={{ backgroundColor: getSentimentColor(entry.sentiment) }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                />
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="quick-stats">
            <div className="stat-item">
              <span className="stat-label">Messages</span>
              <span className="stat-value">{messages.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Session</span>
              <span className="stat-value">
                {messages.length > 0 ? 
                  `${Math.round((new Date() - new Date(messages[0].time)) / 60000)}m` : 
                  '0m'
                }
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default RealTimeSentiment; 