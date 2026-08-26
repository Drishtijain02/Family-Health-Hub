import { useState } from "react";
import "./App.css";

const initialFamilyMembers = [
  {
    name: "Rajesh",
    relation: "Father",
    avatar: "👨🏻",
    blood: "O+",
    allergy: "None",
    checkup: "Apr 12, 2025",
  },
  {
    name: "Sunita",
    relation: "Mother",
    avatar: "👩🏻",
    blood: "B+",
    allergy: "Peanuts",
    checkup: "Apr 12, 2025",
  },
  {
    name: "Ananya",
    relation: "Daughter",
    avatar: "👧🏻",
    blood: "A+",
    allergy: "None",
    checkup: "May 18, 2025",
  },
  {
    name: "Arjun",
    relation: "Son",
    avatar: "👦🏻",
    blood: "AB+",
    allergy: "Dust",
    checkup: "Jun 02, 2025",
  },
  {
    name: "Kamla",
    relation: "Grandmother",
    avatar: "👵🏻",
    blood: "O+",
    allergy: "None",
    checkup: "Mar 25, 2025",
  },
];

const avatarOptions = ["👨🏻", "👩🏻", "👦🏻", "👧🏻", "👴🏻", "👵🏻"];

function App() {
  const [familyMembers, setFamilyMembers] = useState(initialFamilyMembers);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);

  const [newName, setNewName] = useState("");
  const [newRelation, setNewRelation] = useState("");
  const [newAvatar, setNewAvatar] = useState("👨🏻");
  const [editName, setEditName] = useState("");
const [editRelation, setEditRelation] = useState("");
const [editAvatar, setEditAvatar] = useState("");
const [editBlood, setEditBlood] = useState("");
const [editAllergy, setEditAllergy] = useState("");
const [editCheckup, setEditCheckup] = useState("");

  const addMember = (e) => {
    e.preventDefault();

    if (!newName.trim() || !newRelation.trim()) return;

    const newMember = {
      name: newName.trim(),
      relation: newRelation.trim(),
      avatar: newAvatar,
      blood: "Not added",
      allergy: "Not added",
      checkup: "Not scheduled",
    };

    setFamilyMembers([...familyMembers, newMember]);

    setNewName("");
    setNewRelation("");
    setNewAvatar("👨🏻");
    setShowAddForm(false);
  };
  const openEditForm = () => {
  setEditName(selectedMember.name);
  setEditRelation(selectedMember.relation);
  setEditAvatar(selectedMember.avatar);
  setEditBlood(selectedMember.blood);
  setEditAllergy(selectedMember.allergy);
  setEditCheckup(selectedMember.checkup);
  setShowEditForm(true);
};

const saveEdit = (e) => {
  e.preventDefault();

  const updatedMember = {
    ...selectedMember,
    name: editName.trim(),
    relation: editRelation.trim(),
    avatar: editAvatar,
    blood: editBlood.trim() || "Not added",
    allergy: editAllergy.trim() || "Not added",
    checkup: editCheckup.trim() || "Not scheduled",
  };

  setFamilyMembers(
    familyMembers.map((member) =>
      member.name === selectedMember.name ? updatedMember : member
    )
  );

  setSelectedMember(updatedMember);
  setShowEditForm(false);
};

  // DASHBOARD
  if (selectedMember) {
  return (
  <div className="app">
    <header className="header">
      <div className="brand">
        <div className="logo">H</div>
        <div>
          <h2>HealthHub</h2>
          <p>Your Family, Your Health</p>
        </div>
      </div>

      <button
        className="switch-account"
        onClick={() => setSelectedMember(null)}
      >
        ⇄ Switch Profile
      </button>
    </header>

    <div className="dashboard-layout">

      {/* SIDEBAR */}
      <aside className="sidebar">

        <div className="sidebar-section">
          <button className="nav-item active">⌂ Overview</button>
          <button className="nav-item">📄 Medical Reports</button>
          <button className="nav-item">💊 Prescriptions</button>
          <button className="nav-item">🕐 Timeline</button>
          <button className="nav-item">🔔 Reminders</button>
          <button className="nav-item">🚨 Emergency Card</button>
          <button className="nav-item">✨ Health AI</button>
          <button className="nav-item">⚙️ Settings</button>
        </div>

        <div className="sidebar-family">
          <p>FAMILY MEMBERS</p>

          {familyMembers.map((member) => (
            <button
              key={member.name}
              className={`family-mini ${
                member.name === selectedMember.name ? "current" : ""
              }`}
              onClick={() => {
                setSelectedMember(member);
                setShowProfile(false);
              }}
            >
              <span>{member.avatar}</span>
              <span>
                {member.name}
                <small>{member.relation}</small>
              </span>
            </button>
          ))}
        </div>

      </aside>

      {/* MAIN DASHBOARD */}
      <main className="dashboard-main">

        {/* PROFILE HEADER */}
        <div className="dashboard-profile-header">

          <div className="dashboard-person">
            <div className="dashboard-avatar">
              {selectedMember.avatar}
            </div>

            <div>
              <h1>{selectedMember.name}</h1>
              <p>
                {selectedMember.relation} • Family Health Profile
              </p>
            </div>
          </div>

          <div className="profile-actions">
            <button
              className="profile-details-button"
              onClick={() => setShowProfile(true)}
            >
              View / Edit Profile
            </button>

            <div className="status">
              ● Health profile active
            </div>
          </div>

        </div>

        {/* TOP HEALTH CARDS */}
        <div className="health-cards">

          <div className="health-card">
            <span>🩸 BLOOD TYPE</span>
            <strong>{selectedMember.blood}</strong>
          </div>

          <div className="health-card">
            <span>⚠️ ALLERGIES</span>
            <strong>{selectedMember.allergy}</strong>
          </div>

          <div className="health-card">
            <span>📅 NEXT CHECKUP</span>
            <strong>{selectedMember.checkup}</strong>
          </div>

          <div className="emergency-card">
            <span>🚨 EMERGENCY HEALTH CARD</span>
            <h3>Emergency information</h3>
            <p>Keep important health information accessible.</p>
            <button>View Full Card</button>
          </div>

        </div>

        {/* MAIN CONTENT GRID */}
        <div className="dashboard-grid">

          {/* AI SUMMARY */}
          <section className="panel ai-panel">
            <div className="panel-title">
              <h2>✨ AI Health Summary</h2>
              <span>Health AI</span>
            </div>

            <div className="ai-status">
              <div className="ai-circle">♥</div>
              <div>
                <strong>Overall Health</strong>
                <p>Your health information looks generally stable.</p>
              </div>
            </div>

            <div className="attention">
              ⚠️ <strong>Attention Needed</strong>
              <p>No major health concerns currently added.</p>
            </div>

            <button className="ai-button">
              💬 Chat with Health AI →
            </button>
          </section>

          {/* MEDICAL REPORTS */}
          <section className="panel">

            <div className="panel-title">
              <h2>📄 Recent Medical Reports</h2>
              <span>View All</span>
            </div>

            <div className="report">
              <span>🧪</span>
              <div>
                <strong>Blood Test Report</strong>
                <p>Recent medical examination</p>
              </div>
              <b>›</b>
            </div>

            <div className="report">
              <span>🩺</span>
              <div>
                <strong>General Checkup</strong>
                <p>Routine health check</p>
              </div>
              <b>›</b>
            </div>

            <div className="report">
              <span>❤️</span>
              <div>
                <strong>ECG Report</strong>
                <p>Heart health examination</p>
              </div>
              <b>›</b>
            </div>

          </section>

          {/* PRESCRIPTIONS */}
          <section className="panel">

            <div className="panel-title">
              <h2>💊 Recent Prescriptions</h2>
              <span>View All</span>
            </div>

            <div className="report">
              <span>💊</span>
              <div>
                <strong>Vitamin D</strong>
                <p>Daily supplement</p>
              </div>
              <b>›</b>
            </div>

            <div className="report">
              <span>💊</span>
              <div>
                <strong>Calcium Tablet</strong>
                <p>As prescribed</p>
              </div>
              <b>›</b>
            </div>

          </section>

          {/* TIMELINE */}
          <section className="panel">

            <div className="panel-title">
              <h2>🕐 Health Timeline</h2>
              <span>View Full Timeline</span>
            </div>

            <div className="timeline-item">
              <strong>Feb 24, 2025</strong>
              <p>Vitamin D test completed</p>
            </div>

            <div className="timeline-item">
              <strong>Jan 22, 2025</strong>
              <p>CBC blood report added</p>
            </div>

            <div className="timeline-item">
              <strong>Jan 05, 2025</strong>
              <p>ECG report added</p>
            </div>

          </section>

          {/* REMINDERS */}
          <section className="panel">

            <div className="panel-title">
              <h2>🔔 Upcoming Reminders</h2>
              <span>View All</span>
            </div>

            <div className="reminder">
              <span>💊</span>
              <div>
                <strong>Vitamin D</strong>
                <p>Today • 9:00 AM</p>
              </div>
              <small>Today</small>
            </div>

            <div className="reminder">
              <span>👁️</span>
              <div>
                <strong>Eye Checkup</strong>
                <p>Next appointment</p>
              </div>
              <small>Upcoming</small>
            </div>

          </section>

          {/* HEALTH AI CHAT */}
          <section className="panel chat-panel">

            <div className="panel-title">
              <h2>💬 Health AI Chat</h2>
              <span>↗</span>
            </div>

            <div className="chat-message">
              <strong>✨ Hi {selectedMember.name}!</strong>
              <p>
                I'm your Health AI assistant. You can ask me questions
                about your reports, medications or general health.
              </p>
            </div>

            <div className="chat-input">
              <span>Ask anything...</span>
              <button>➤</button>
            </div>

          </section>

        </div>

      </main>
    </div>
  </div>
);
  }

  // FAMILY SELECTION SCREEN
  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <div className="logo">H</div>
          <div>
            <h2>HealthHub</h2>
            <p>Your Family, Your Health</p>
          </div>
        </div>

        <button className="switch-account">⇄ Switch Account</button>
      </header>

      <main className="profile-page">
        <div className="welcome">
          <h1>Who's using HealthHub?</h1>
          <p>Select a profile to continue</p>
        </div>

        <div className="profiles">
          {familyMembers.map((member) => (
            <button
              className="profile-card"
              key={member.name}
              onClick={() => setSelectedMember(member)}
            >
              <div className="avatar">{member.avatar}</div>
              <h3>{member.name}</h3>
              <p>{member.relation}</p>
            </button>
          ))}

          <button
            className="profile-card add-card"
            onClick={() => setShowAddForm(true)}
          >
            <div className="add-icon">+</div>
            <h3>Add Member</h3>
            <p>New family profile</p>
          </button>
        </div>

        {showAddForm && (
          <div className="add-member-overlay">
            <form className="add-member-form" onSubmit={addMember}>
              <button
                type="button"
                className="close-form"
                onClick={() => setShowAddForm(false)}
              >
                ×
              </button>

              <h2>Add Family Member</h2>
              <p>Create a new family health profile.</p>

              <label>Name</label>
              <input
                type="text"
                placeholder="Enter name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />

              <label>Relation</label>
              <input
                type="text"
                placeholder="e.g. Father, Sister"
                value={newRelation}
                onChange={(e) => setNewRelation(e.target.value)}
              />

              <label>Choose Avatar</label>

              <div className="avatar-options">
                {avatarOptions.map((avatar) => (
                  <button
                    type="button"
                    key={avatar}
                    className={`avatar-option ${
                      newAvatar === avatar ? "avatar-selected" : ""
                    }`}
                    onClick={() => setNewAvatar(avatar)}
                  >
                    {avatar}
                  </button>
                ))}
              </div>

              <button type="submit" className="add-member-submit">
                Add Member
              </button>
            </form>
          </div>
        )}

        <div className="security">
          🔒 Your data is safe and encrypted
        </div>
      </main>
    </div>
  );
}

export default App;