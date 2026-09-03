import { useEffect, useState } from "react";
import "./App.css";
import { supabase } from "./lib/supabase";

const avatarOptions = ["👨🏻", "👩🏻", "👦🏻", "👧🏻", "👴🏻", "👵🏻"];

function getAvatarForRelation(relation) {
  const value = (relation || "").toLowerCase();

  if (
    value.includes("mother") ||
    value.includes("wife") ||
    value.includes("sister")
  ) {
    return "👩🏻";
  }

  if (
    value.includes("father") ||
    value.includes("husband") ||
    value.includes("brother")
  ) {
    return "👨🏻";
  }

  if (value.includes("daughter")) return "👧🏻";
  if (value.includes("son")) return "👦🏻";

  if (
    value.includes("grandmother") ||
    value.includes("grandma") ||
    value.includes("dadi") ||
    value.includes("nani")
  ) {
    return "👵🏻";
  }

  if (
    value.includes("grandfather") ||
    value.includes("grandpa") ||
    value.includes("dada") ||
    value.includes("nana")
  ) {
    return "👴🏻";
  }

  return "👨🏻";
}

function App() {
  const [user, setUser] = useState(null);
  const [familyId, setFamilyId] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);

  const [loadingMembers, setLoadingMembers] = useState(true);
  const [membersError, setMembersError] = useState("");

  const [showAddForm, setShowAddForm] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const [newName, setNewName] = useState("");
  const [newRelation, setNewRelation] = useState("");
  const [newAvatar, setNewAvatar] = useState("👨🏻");

  const [editName, setEditName] = useState("");
  const [editRelation, setEditRelation] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [editDob, setEditDob] = useState("");
  const [editGender, setEditGender] = useState("");
  const [editBlood, setEditBlood] = useState("");
  const [editAllergy, setEditAllergy] = useState("");
  const [editConditions, setEditConditions] = useState("");
  const [editMedications, setEditMedications] = useState("");
  const [editEmergencyContact, setEditEmergencyContact] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      setLoadingMembers(true);
      setMembersError("");

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        if (mounted) {
          setMembersError(error.message);
          setLoadingMembers(false);
        }
        return;
      }

      if (!session?.user) {
        if (mounted) {
          setUser(null);
          setFamilyId(null);
          setFamilyMembers([]);
          setSelectedMember(null);
          setLoadingMembers(false);
        }
        return;
      }

      if (mounted) {
        setUser(session.user);
      }

      await loadFamilyMembers(session.user.id);
    }

    async function handleAuthChange(session) {
      if (!mounted) return;

      setUser(session?.user ?? null);

      if (session?.user) {
        await loadFamilyMembers(session.user.id);
      } else {
        setFamilyId(null);
        setFamilyMembers([]);
        setSelectedMember(null);
        setLoadingMembers(false);
      }
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void handleAuthChange(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function loadFamilyMembers(userId) {
    setLoadingMembers(true);
    setMembersError("");

    try {
      const { data: family, error: familyError } = await supabase
        .from("families")
        .select("id")
        .eq("owner_id", userId)
        .maybeSingle();

      if (familyError) throw familyError;

      if (!family) {
        setFamilyId(null);
        setFamilyMembers([]);
        setSelectedMember(null);
        return;
      }

      setFamilyId(family.id);

      const { data: members, error: membersError } = await supabase
        .from("family_members")
        .select(
          "id, family_id, name, date_of_birth, gender, relation, user_id, created_at"
        )
        .eq("family_id", family.id)
        .order("created_at", { ascending: true });

      if (membersError) throw membersError;

      const memberIds = (members || []).map((member) => member.id);

      let healthInfo = [];

      if (memberIds.length > 0) {
        const { data, error: healthError } = await supabase
          .from("health_information")
          .select(
            "family_member_id, blood_group, allergies, existing_conditions, current_medications, emergency_contact"
          )
          .in("family_member_id", memberIds);

        if (healthError) throw healthError;

        healthInfo = data || [];
      }

      const healthMap = new Map(
        healthInfo.map((info) => [info.family_member_id, info])
      );

      const mappedMembers = (members || []).map((member) => {
        const health = healthMap.get(member.id);

        return {
          ...member,
          relation: member.relation || "Other",
          avatar: getAvatarForRelation(member.relation),
          blood: health?.blood_group || "Not added",
          allergy: health?.allergies || "Not added",
          checkup: "Not scheduled",
          existingConditions: health?.existing_conditions || "",
          currentMedications: health?.current_medications || "",
          emergencyContact: health?.emergency_contact || "",
        };
      });

      setFamilyMembers(mappedMembers);

      setSelectedMember((current) => {
        if (!current) return null;
        return (
          mappedMembers.find((member) => member.id === current.id) || null
        );
      });
    } catch (error) {
      console.error("Unable to load family members:", error);
      setFamilyMembers([]);
      setSelectedMember(null);
      setMembersError(
        error.message || "Unable to load your family members."
      );
    } finally {
      setLoadingMembers(false);
    }
  }

  async function addMember(e) {
    e.preventDefault();

    if (!user || !familyId) {
      setMembersError("Your family could not be found.");
      return;
    }

    if (!newName.trim() || !newRelation.trim()) return;

    setMembersError("");

    try {
      const { data: member, error } = await supabase
        .from("family_members")
        .insert({
          family_id: familyId,
          name: newName.trim(),
          relation: newRelation.trim(),
          user_id: null,
        })
        .select()
        .single();

      if (error) throw error;

      const newMember = {
        ...member,
        avatar: newAvatar,
        blood: "Not added",
        allergy: "Not added",
        checkup: "Not scheduled",
        existingConditions: "",
        currentMedications: "",
        emergencyContact: "",
      };

      setFamilyMembers((current) => [...current, newMember]);
      setSelectedMember(newMember);

      setNewName("");
      setNewRelation("");
      setNewAvatar("👨🏻");
      setShowAddForm(false);
    } catch (error) {
      console.error("Unable to add family member:", error);
      setMembersError(
        error.message || "Unable to add this family member."
      );
    }
  }

  function openEditForm() {
    if (!selectedMember) return;

    setEditName(selectedMember.name || "");
    setEditRelation(selectedMember.relation || "");
    setEditAvatar(selectedMember.avatar || getAvatarForRelation(selectedMember.relation));
    setEditDob(selectedMember.date_of_birth || "");
    setEditGender(selectedMember.gender || "");
    setEditBlood(
      selectedMember.blood === "Not added" ? "" : selectedMember.blood || ""
    );
    setEditAllergy(
      selectedMember.allergy === "Not added" ? "" : selectedMember.allergy || ""
    );
    setEditConditions(selectedMember.existingConditions || "");
    setEditMedications(selectedMember.currentMedications || "");
    setEditEmergencyContact(selectedMember.emergencyContact || "");
    setProfileError("");
    setShowProfile(true);
  }

  async function saveEdit(e) {
    e.preventDefault();

    if (!selectedMember || !familyId) return;

    if (!editName.trim() || !editRelation.trim()) {
      setProfileError("Name and relation are required.");
      return;
    }

    setProfileSaving(true);
    setProfileError("");

    try {
      const { data: updatedMember, error: memberError } = await supabase
        .from("family_members")
        .update({
          name: editName.trim(),
          relation: editRelation.trim(),
          date_of_birth: editDob || null,
          gender: editGender || null,
        })
        .eq("id", selectedMember.id)
        .eq("family_id", familyId)
        .select()
        .single();

      if (memberError) throw memberError;

      const { data: existingHealth, error: healthLookupError } = await supabase
        .from("health_information")
        .select("family_member_id")
        .eq("family_member_id", selectedMember.id)
        .maybeSingle();

      if (healthLookupError) throw healthLookupError;

      const healthPayload = {
        family_member_id: selectedMember.id,
        blood_group: editBlood.trim() || null,
        allergies: editAllergy.trim() || null,
        existing_conditions: editConditions.trim() || null,
        current_medications: editMedications.trim() || null,
        emergency_contact: editEmergencyContact.trim() || null,
        updated_at: new Date().toISOString(),
      };

      if (existingHealth) {
        const { error: healthUpdateError } = await supabase
          .from("health_information")
          .update(healthPayload)
          .eq("family_member_id", selectedMember.id);

        if (healthUpdateError) throw healthUpdateError;
      } else {
        const { error: healthInsertError } = await supabase
          .from("health_information")
          .insert(healthPayload);

        if (healthInsertError) throw healthInsertError;
      }

      const updated = {
        ...selectedMember,
        ...updatedMember,
        avatar: editAvatar || getAvatarForRelation(editRelation),
        blood: editBlood.trim() || "Not added",
        allergy: editAllergy.trim() || "Not added",
        existingConditions: editConditions.trim(),
        currentMedications: editMedications.trim(),
        emergencyContact: editEmergencyContact.trim(),
        checkup: "Not scheduled",
      };

      setFamilyMembers((current) =>
        current.map((member) =>
          member.id === selectedMember.id ? updated : member
        )
      );

      setSelectedMember(updated);
      setShowProfile(false);
    } catch (error) {
      console.error("Unable to save family profile:", error);
      setProfileError(
        error.message || "Unable to save this family profile."
      );
    } finally {
      setProfileSaving(false);
    }
  }

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
        onClick={() => {
          setShowProfile(false);
          setSelectedMember(null);
        }}
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
              key={member.id}
              className={`family-mini ${
                member.id === selectedMember.id ? "current" : ""
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

        {membersError && (
          <div
            role="alert"
            style={{
              background: "#fff1f1",
              color: "#a33",
              padding: "10px 14px",
              borderRadius: "10px",
              marginBottom: "14px",
            }}
          >
            {membersError}
          </div>
        )}

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
              onClick={openEditForm}
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

        {showProfile && selectedMember && (
          <div className="profile-modal-backdrop" onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowProfile(false);
          }}>
            <form className="profile-modal" onSubmit={saveEdit}>
              <div className="profile-modal-header">
                <div>
                  <span className="profile-modal-kicker">FAMILY PROFILE</span>
                  <h2>View / Edit Profile</h2>
                  <p>
                    Update {selectedMember.name}'s basic and health information.
                  </p>
                </div>

                <button
                  type="button"
                  className="profile-modal-close"
                  onClick={() => setShowProfile(false)}
                  aria-label="Close profile"
                >
                  ×
                </button>
              </div>

              {profileError && (
                <div className="profile-modal-error" role="alert">
                  ⚠ {profileError}
                </div>
              )}

              <div className="profile-form-section">
                <div className="profile-section-heading">
                  <span className="profile-section-icon">👤</span>
                  <div>
                    <h3>Basic Information</h3>
                    <p>Personal details for this family member.</p>
                  </div>
                </div>

                <div className="profile-form-grid">
                  <label className="profile-field">
                    <span>Full Name</span>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Enter full name"
                      required
                    />
                  </label>

                  <label className="profile-field">
                    <span>Relationship</span>
                    <select
                      value={editRelation}
                      onChange={(e) => {
                        setEditRelation(e.target.value);
                        setEditAvatar(getAvatarForRelation(e.target.value));
                      }}
                      required
                    >
                      <option value="">Select relation</option>
                      <option>Self</option>
                      <option>Father</option>
                      <option>Mother</option>
                      <option>Brother</option>
                      <option>Sister</option>
                      <option>Grandparent</option>
                      <option>Child</option>
                      <option>Spouse</option>
                      <option>Other</option>
                    </select>
                  </label>

                  <label className="profile-field">
                    <span>Date of Birth</span>
                    <input
                      type="date"
                      value={editDob}
                      onChange={(e) => setEditDob(e.target.value)}
                    />
                  </label>

                  <label className="profile-field">
                    <span>Gender</span>
                    <select
                      value={editGender}
                      onChange={(e) => setEditGender(e.target.value)}
                    >
                      <option value="">Select gender</option>
                      <option>Female</option>
                      <option>Male</option>
                      <option>Other</option>
                      <option>Prefer not to say</option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="profile-form-section">
                <div className="profile-section-heading">
                  <span className="profile-section-icon">🏥</span>
                  <div>
                    <h3>Health Information</h3>
                    <p>Information used across the family health profile.</p>
                  </div>
                </div>

                <div className="profile-form-grid">
                  <label className="profile-field">
                    <span>Blood Group</span>
                    <input
                      type="text"
                      value={editBlood}
                      onChange={(e) => setEditBlood(e.target.value)}
                      placeholder="e.g. B+"
                    />
                  </label>

                  <label className="profile-field">
                    <span>Allergies</span>
                    <input
                      type="text"
                      value={editAllergy}
                      onChange={(e) => setEditAllergy(e.target.value)}
                      placeholder="e.g. Peanuts"
                    />
                  </label>

                  <label className="profile-field profile-field-full">
                    <span>Existing Medical Conditions</span>
                    <textarea
                      rows="3"
                      value={editConditions}
                      onChange={(e) => setEditConditions(e.target.value)}
                      placeholder="e.g. Diabetes, asthma, hypertension"
                    />
                  </label>

                  <label className="profile-field profile-field-full">
                    <span>Current Medications</span>
                    <textarea
                      rows="3"
                      value={editMedications}
                      onChange={(e) => setEditMedications(e.target.value)}
                      placeholder="List current medicines"
                    />
                  </label>

                  <label className="profile-field profile-field-full">
                    <span>Emergency Contact</span>
                    <input
                      type="text"
                      value={editEmergencyContact}
                      onChange={(e) => setEditEmergencyContact(e.target.value)}
                      placeholder="Name and phone number"
                    />
                  </label>
                </div>
              </div>

              <div className="profile-modal-footer">
                <p>Changes are saved securely to your family profile.</p>
                <div className="profile-modal-actions">
                  <button
                    type="button"
                    className="profile-cancel-button"
                    onClick={() => setShowProfile(false)}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="profile-save-button"
                    disabled={profileSaving}
                  >
                    {profileSaving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </form>

            <style>{`
              .profile-modal-backdrop {
                position: fixed;
                inset: 0;
                z-index: 1000;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 28px;
                background: rgba(25, 38, 31, 0.55);
                backdrop-filter: blur(4px);
                overflow-y: auto;
              }

              .profile-modal {
                width: min(780px, 100%);
                max-height: calc(100vh - 56px);
                overflow-y: auto;
                margin: auto;
                padding: 30px;
                border: 1px solid #e3e9e4;
                border-radius: 22px;
                background: #ffffff;
                box-shadow: 0 24px 70px rgba(20, 35, 27, 0.24);
                color: #25352c;
              }

              .profile-modal-header {
                display: flex;
                align-items: flex-start;
                justify-content: space-between;
                gap: 24px;
                padding-bottom: 22px;
                border-bottom: 1px solid #edf0ed;
              }

              .profile-modal-kicker {
                display: inline-block;
                margin-bottom: 8px;
                font-size: 11px;
                font-weight: 800;
                letter-spacing: 1.2px;
                color: #66806b;
              }

              .profile-modal-header h2 {
                margin: 0;
                font-size: 28px;
                line-height: 1.15;
                color: #24342b;
              }

              .profile-modal-header p {
                margin: 8px 0 0;
                color: #718078;
                font-size: 14px;
                line-height: 1.5;
              }

              .profile-modal-close {
                flex: 0 0 auto;
                width: 38px;
                height: 38px;
                border: 1px solid #e0e6e1;
                border-radius: 50%;
                background: #f8faf8;
                color: #526158;
                font-size: 24px;
                line-height: 1;
                cursor: pointer;
                transition: 0.2s ease;
              }

              .profile-modal-close:hover {
                background: #edf3ee;
                transform: rotate(3deg);
              }

              .profile-modal-error {
                margin-top: 18px;
                padding: 12px 14px;
                border: 1px solid #f0cccc;
                border-radius: 12px;
                background: #fff5f5;
                color: #a23d3d;
                font-size: 13px;
              }

              .profile-form-section {
                margin-top: 24px;
                padding: 20px;
                border: 1px solid #e8eee9;
                border-radius: 16px;
                background: #fbfcfb;
              }

              .profile-section-heading {
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 18px;
              }

              .profile-section-icon {
                display: grid;
                place-items: center;
                width: 38px;
                height: 38px;
                border-radius: 11px;
                background: #edf4ee;
                font-size: 18px;
              }

              .profile-section-heading h3 {
                margin: 0;
                font-size: 16px;
                color: #2d3e34;
              }

              .profile-section-heading p {
                margin: 3px 0 0;
                color: #7a8780;
                font-size: 12px;
              }

              .profile-form-grid {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 16px;
              }

              .profile-field {
                display: flex !important;
                flex-direction: column !important;
                align-items: stretch !important;
                gap: 7px !important;
                min-width: 0;
                color: #425149;
                font-size: 13px;
                font-weight: 650;
              }

              .profile-field-full {
                grid-column: 1 / -1;
              }

              .profile-field input,
              .profile-field select,
              .profile-field textarea {
                box-sizing: border-box;
                width: 100% !important;
                min-height: 44px;
                margin: 0 !important;
                padding: 11px 12px;
                border: 1px solid #d8e0da !important;
                border-radius: 10px !important;
                background: #ffffff !important;
                color: #26372d !important;
                font: inherit;
                font-size: 14px;
                outline: none;
                transition: border-color 0.2s ease, box-shadow 0.2s ease;
              }

              .profile-field textarea {
                min-height: 92px;
                resize: vertical;
                line-height: 1.45;
              }

              .profile-field input::placeholder,
              .profile-field textarea::placeholder {
                color: #a0aaa4;
              }

              .profile-field input:focus,
              .profile-field select:focus,
              .profile-field textarea:focus {
                border-color: #6a866f !important;
                box-shadow: 0 0 0 3px rgba(106, 134, 111, 0.12);
              }

              .profile-modal-footer {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 20px;
                margin-top: 24px;
                padding-top: 20px;
                border-top: 1px solid #edf0ed;
              }

              .profile-modal-footer p {
                margin: 0;
                color: #7c8881;
                font-size: 12px;
              }

              .profile-modal-actions {
                display: flex;
                align-items: center;
                gap: 10px;
                flex-shrink: 0;
              }

              .profile-cancel-button,
              .profile-save-button {
                min-height: 44px;
                padding: 0 20px;
                border-radius: 10px;
                font: inherit;
                font-size: 14px;
                font-weight: 700;
                cursor: pointer;
                transition: 0.2s ease;
              }

              .profile-cancel-button {
                border: 1px solid #d8e0da;
                background: #ffffff;
                color: #526158;
              }

              .profile-cancel-button:hover {
                background: #f4f7f4;
              }

              .profile-save-button {
                border: 1px solid #65806a;
                background: #65806a;
                color: #ffffff;
                box-shadow: 0 5px 14px rgba(101, 128, 106, 0.18);
              }

              .profile-save-button:hover:not(:disabled) {
                background: #58725e;
                transform: translateY(-1px);
              }

              .profile-save-button:disabled {
                opacity: 0.65;
                cursor: not-allowed;
              }

              @media (max-width: 700px) {
                .profile-modal-backdrop {
                  align-items: flex-start;
                  padding: 14px;
                }

                .profile-modal {
                  max-height: calc(100vh - 28px);
                  padding: 20px;
                  border-radius: 18px;
                }

                .profile-modal-header h2 {
                  font-size: 23px;
                }

                .profile-form-grid {
                  grid-template-columns: 1fr;
                }

                .profile-field-full {
                  grid-column: auto;
                }

                .profile-modal-footer {
                  align-items: stretch;
                  flex-direction: column;
                }

                .profile-modal-actions {
                  width: 100%;
                }

                .profile-cancel-button,
                .profile-save-button {
                  flex: 1;
                }
              }
            `}</style>
          </div>
        )}

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
          {loadingMembers ? (
            <div className="family-state">
              <h3>Loading family members...</h3>
              <p>Please wait while we load your family profiles.</p>
            </div>
          ) : membersError ? (
            <div className="family-state">
              <h3>Unable to load family</h3>
              <p>{membersError}</p>
              <button
                type="button"
                onClick={() => user && loadFamilyMembers(user.id)}
              >
                Try Again
              </button>
            </div>
          ) : familyMembers.length === 0 ? (
            <div className="family-state">
              <h3>No family members yet</h3>
              <p>Add your first family member to create a health profile.</p>
            </div>
          ) : (
            familyMembers.map((member) => (
              <button
                className="profile-card"
                key={member.id}
                onClick={() => setSelectedMember(member)}
              >
                <div className="avatar">{member.avatar}</div>
                <h3>{member.name}</h3>
                <p>{member.relation}</p>
              </button>
            ))
          )}

          <button
            className="profile-card add-card"
            onClick={() => setShowAddForm(true)}
            disabled={!familyId}
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