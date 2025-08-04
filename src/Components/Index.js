import React from "react";
import "./Index.css";
import { useNavigate } from "react-router-dom";


const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="page-layout">
      

      {/* Main Content */}
      <main className="landing-page">
        {/* Hero Section */}
        <section className="hero">
          <div className="hero-content">
            <h1>Your Partner in <span>Mental Wellness</span></h1>
            <p>We’re here to provide compassionate support for your mental well-being.</p>
            <button className="get-started" onClick={() => navigate("/login")}>
              Get Started
            </button>
          </div>
          <div className="hero-image">
            <img src={require("../assets/undraw_remote-worker_0l91.png")} alt="logo" className="hero-img" />
          </div>
        </section>

        {/* Features Section */}
        <section className="features">
          <h2>How Serenio Can Help You</h2>
          <div className="feature-grid">
            <div className="feature-card">
              <img src="https://img.icons8.com/ios/50/chat--v1.png" alt="AI Chat" />
              <h3>AI Chat Support</h3>
              <p>Talk to our AI for immediate, confidential mental health support.</p>
            </div>
            <div className="feature-card">
              <img src="https://img.icons8.com/ios/50/calendar--v1.png" alt="Scheduling" />
              <h3>Appointment Scheduling</h3>
              <p>Book sessions with qualified mental health professionals at your convenience.</p>
            </div>
            <div className="feature-card">
              <img src="https://img.icons8.com/ios/50/thumb-up.png" alt="Guidance" />
              <h3>Personalized Guidance</h3>
              <p>Receive tailored advice and resources to support your mental wellness.</p>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="testimonials">
          <h2>What Our Users Say</h2>
          <div className="testimonial-grid">
            <div className="testimonial-card">
              <p>
                “Serenio has been a game changer for my mental health. The AI support is
                always there when I need to talk.”
              </p>
              <strong>- Ayesha R.</strong>
            </div>
            <div className="testimonial-card">
              <p>
                “Booking sessions with professionals is so easy, and the personalized advice
                truly helped me get better.”
              </p>
              <strong>- Omar K.</strong>
            </div>
          </div>
        </section>

        {/* Resources Section */}
        <section className="resources">
          <h2>Resources for Your Journey</h2>
          <div className="resource-grid">
            <div className="resource-card">
              <h4>Mindfulness Guide</h4>
              <p>Learn to be present with step-by-step breathing and awareness exercises.</p>
            </div>
            <div className="resource-card">
              <h4>Daily Journaling</h4>
              <p>Start a journal to track your thoughts and emotions each day.</p>
            </div>
            <div className="resource-card">
              <h4>Expert Articles</h4>
              <p>Read articles written by psychologists and therapists about healing and growth.</p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="footer">
          <p>&copy; 2025 Serenio. All rights reserved.</p>
        </footer>
      </main>

      {/* Right Ad */}
      <aside className="ad-column right-ad">
        <img src="https://via.placeholder.com/120x600?text=Right+Ad" alt="Right Ad" />
      </aside>
    </div>
  );
};

export default Index;
