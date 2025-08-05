import React, { useState } from "react";
import "./Index.css";
import { useNavigate } from "react-router-dom";
import { FaBars, FaTimes, FaHome, FaUser, FaSignInAlt, FaUserPlus } from "react-icons/fa";

const Index = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="index-wrapper">
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-logo">
            <span className="logo-text">Serenio</span>
          </div>
          
          <div className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
            <a href="#home" className="nav-link">
              <FaHome className="nav-icon" />
              Home
            </a>
            <a href="#features" className="nav-link">
              Features
            </a>
            <a href="#testimonials" className="nav-link">
              Testimonials
            </a>
            <a href="#resources" className="nav-link">
              Resources
            </a>
          </div>

          <div className="nav-actions">
            <button 
              className="nav-btn secondary"
              onClick={() => navigate("/login")}
            >
              <FaSignInAlt className="btn-icon" />
              Sign In
            </button>
            <button 
              className="nav-btn primary"
              onClick={() => navigate("/signup")}
            >
              <FaUserPlus className="btn-icon" />
              Get Started
            </button>
          </div>

          <div className="nav-toggle" onClick={toggleMenu}>
            {isMenuOpen ? <FaTimes /> : <FaBars />}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="landing-page">
        {/* Hero Section */}
        <section id="home" className="hero">
          <div className="hero-content">
            <h1 className="hero-title">
              Your Partner in <span className="gradient-text">Mental Wellness</span>
            </h1>
            <p className="hero-subtitle">
              We're here to provide compassionate support for your mental well-being journey.
            </p>
            <div className="hero-actions">
              <button className="hero-btn primary" onClick={() => navigate("/signup")}>
                Get Started
              </button>
              <button className="hero-btn secondary" onClick={() => navigate("/login")}>
                Sign In
              </button>
            </div>
          </div>
          <div className="hero-image">
            <img src={require("../assets/undraw_remote-worker_0l91.png")} alt="Mental Wellness" className="hero-img" />
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="features">
          <div className="section-header">
            <h2 className="section-title">How Serenio Can Help You</h2>
            <p className="section-subtitle">Comprehensive mental health support at your fingertips</p>
          </div>
          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <img src="https://img.icons8.com/ios/50/chat--v1.png" alt="AI Chat" />
              </div>
              <h3 className="feature-title">AI Chat Support</h3>
              <p className="feature-description">
                Talk to our AI for immediate, confidential mental health support anytime, anywhere.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <img src="https://img.icons8.com/ios/50/calendar--v1.png" alt="Scheduling" />
              </div>
              <h3 className="feature-title">Appointment Scheduling</h3>
              <p className="feature-description">
                Book sessions with qualified mental health professionals at your convenience.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <img src="https://img.icons8.com/ios/50/thumb-up.png" alt="Guidance" />
              </div>
              <h3 className="feature-title">Personalized Guidance</h3>
              <p className="feature-description">
                Receive tailored advice and resources to support your mental wellness journey.
              </p>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="testimonials">
          <div className="section-header">
            <h2 className="section-title">What Our Users Say</h2>
            <p className="section-subtitle">Real stories from people who found support with Serenio</p>
          </div>
          <div className="testimonial-grid">
            <div className="testimonial-card">
              <div className="testimonial-content">
                <p className="testimonial-text">
                  "Serenio has been a game changer for my mental health. The AI support is
                  always there when I need to talk, and the professional sessions have truly helped me heal."
                </p>
                <div className="testimonial-author">
                  <div className="author-avatar">AR</div>
                  <div className="author-info">
                    <strong className="author-name">Ayesha R.</strong>
                    <span className="author-title">Student</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="testimonial-card">
              <div className="testimonial-content">
                <p className="testimonial-text">
                  "Booking sessions with professionals is so easy, and the personalized advice
                  truly helped me get better. I'm grateful for this platform."
                </p>
                <div className="testimonial-author">
                  <div className="author-avatar">OK</div>
                  <div className="author-info">
                    <strong className="author-name">Omar K.</strong>
                    <span className="author-title">Professional</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Resources Section */}
        <section id="resources" className="resources">
          <div className="section-header">
            <h2 className="section-title">Resources for Your Journey</h2>
            <p className="section-subtitle">Tools and guides to support your mental wellness</p>
          </div>
          <div className="resource-grid">
            <div className="resource-card">
              <div className="resource-icon">🧘</div>
              <h4 className="resource-title">Mindfulness Guide</h4>
              <p className="resource-description">
                Learn to be present with step-by-step breathing and awareness exercises.
              </p>
            </div>
            <div className="resource-card">
              <div className="resource-icon">📝</div>
              <h4 className="resource-title">Daily Journaling</h4>
              <p className="resource-description">
                Start a journal to track your thoughts and emotions each day.
              </p>
            </div>
            <div className="resource-card">
              <div className="resource-icon">📚</div>
              <h4 className="resource-title">Expert Articles</h4>
              <p className="resource-description">
                Read articles written by psychologists and therapists about healing and growth.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta-section">
          <div className="cta-content">
            <h2 className="cta-title">Ready to Start Your Wellness Journey?</h2>
            <p className="cta-subtitle">Join thousands of users who have found support with Serenio</p>
            <button className="cta-btn" onClick={() => navigate("/signup")}>
              Create Your Account
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="footer">
          <div className="footer-content">
            <div className="footer-section">
              <div className="footer-logo">
                <img src={require("../assets/logo.png")} alt="Serenio" className="footer-logo-img" />
                <span className="footer-logo-text">Serenio</span>
              </div>
              <p className="footer-description">
                Your trusted partner in mental wellness, providing compassionate support and professional guidance.
              </p>
            </div>
            <div className="footer-section">
              <h4 className="footer-title">Quick Links</h4>
              <a href="#home" className="footer-link">Home</a>
              <a href="#features" className="footer-link">Features</a>
              <a href="#testimonials" className="footer-link">Testimonials</a>
              <a href="#resources" className="footer-link">Resources</a>
            </div>
            <div className="footer-section">
              <h4 className="footer-title">Account</h4>
              <button className="footer-link" onClick={() => navigate("/login")}>Sign In</button>
              <button className="footer-link" onClick={() => navigate("/signup")}>Sign Up</button>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 Serenio. All rights reserved.</p>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Index;
