import AIChatbot from "./components/AIChatbot";
import AIHealthSummary from "./components/AIHealthSummary";
import ReportAISummary from "./components/ReportAISummary";
import "./App.css";

function App() {
  return (
    <div className="ai-demo-page">

      {/* Header */}
      <header className="ai-demo-header">
        <div>
          <div className="brand-small">FAMILY HEALTH HUB</div>
          <h1>AI Health Center</h1>
          <p>Smart health insights powered by AI</p>
        </div>

        <div className="ai-status">
          <span className="status-dot"></span>
          AI Online
        </div>
      </header>

      {/* Intro */}
      <div className="demo-intro">
        <span>✦ AI FEATURES</span>
        <h2>Your Health, Simplified.</h2>
        <p>
          Explore AI-powered health assistance, medical report analysis,
          and personalized health summaries.
        </p>
      </div>

      {/* AI Health Summary */}
      <section className="ai-card">
        <div className="card-heading">
          <div className="card-icon">♥</div>
          <div>
            <h2>AI Health Summary</h2>
            <p>Quick overview of a family member's health</p>
          </div>
          <span className="demo-badge">DEMO</span>
        </div>

        <AIHealthSummary />
      </section>

      {/* Report Analysis */}
      <section className="ai-card">
        <div className="card-heading">
          <div className="card-icon">▤</div>
          <div>
            <h2>AI Medical Report Analysis</h2>
            <p>Understand medical reports in simple language</p>
          </div>
          <span className="demo-badge">AI</span>
        </div>

        <ReportAISummary />
      </section>

      {/* Chatbot */}
      <section className="ai-card chatbot-card">
        <div className="card-heading">
          <div className="card-icon">✦</div>
          <div>
            <h2>AI Health Assistant</h2>
            <p>Ask general health-related questions</p>
          </div>
          <span className="demo-badge">AI</span>
        </div>

        <AIChatbot />
      </section>

      <footer>
        Family Health Hub • AI features prototype
      </footer>

    </div>
  );
}

export default App;