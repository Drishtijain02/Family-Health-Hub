import "./App.css";
import { supabase } from "./lib/supabase";
import Login from "./components/Login";
import CreateFamily from "./components/CreateFamily";
import AcceptInvitation from "./components/AcceptInvitation";
import React, { useEffect, useState } from "react";
import { fetchMedicalRecords } from "./features/medical-records/medicalRecords";
import AIChatbot from "./components/AIChatbot";
import AIHealthSummary from "./components/AIHealthSummary";
import MedicalRecordsPage from "./features/medical-records/MedicalRecordsPage";
import Timeline from "./components/Timeline/Timeline";
import Reminders from "./Reminders/Reminders";
import Prescriptions from "./components/Prescriptions";
import HealthCard from "./components/HealthCard";

const avatarOptions = ["👨🏻", "👩🏻", "👦🏻", "👧🏻", "👴🏻", "👵🏻"];

function getAvatarForRelation(relation) {
  const value = (relation || "").toLowerCase();

  if (value.includes("mother") || value.includes("wife") || value.includes("sister")) {
    return "👩🏻";
  }

  if (value.includes("father") || value.includes("husband") || value.includes("brother")) {
    return "👨🏻";
  }

  if (value.includes("daughter")) return "👧🏻";
  if (value.includes("son")) return "👦🏻";ī

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
  const isInvitationRoute = window.location.pathname === "/accept-invitation";

  if (isInvitationRoute) {
    return (
      <AcceptInvitation
        onBack={async () => {
          await supabase.auth.signOut();
          window.history.replaceState({}, "", "/");
          window.location.reload();
        }}
      />
    );
  }

  return <DashboardApp />;
}

function DashboardApp() {
  const [user, setUser] = useState(null);
  const [familyId, setFamilyId] = useState(null);
  const [familyName, setFamilyName] = useState("");
  const [familyMembers, setFamilyMembers] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeModule, setActiveModule] = useState("dashboard");
  const [selectedMember, setSelectedMember] = useState(null);
  const [dashboardMedicalReports, setDashboardMedicalReports] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [membersError, setMembersError] = useState("");
  const [authLoading, setAuthLoading] = useState(true);
  const [showCreateFamily, setShowCreateFamily] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);
  const [deletingMember, setDeletingMember] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [newName, setNewName] = useState("");
  const [newRelation, setNewRelation] = useState("");
  const [newRole, setNewRole] = useState("child");
  const [newEmail, setNewEmail] = useState("");
  const [newAvatar, setNewAvatar] = useState("");
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

  const refreshDashboardMedicalReports = async (member = selectedMember) => {
    if (!member) {
      setDashboardMedicalReports([]);
      return;
    }

    try {
      const records = await fetchMedicalRecords(member.id);
      setDashboardMedicalReports(records || []);
    } catch (error) {
      console.warn("Unable to load dashboard medical reports:", error);
      setDashboardMedicalReports([]);
    }
  };

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
          setFamilyName("");
          setFamilyMembers([]);
          setSelectedMember(null);
          setIsAdmin(false);
          setLoadingMembers(false);
          setAuthLoading(false);
        }
        return;
      }

      if (mounted) {
        setUser(session.user);
      }

      await loadFamilyMembers(session.user.id);

      if (mounted) {
        setAuthLoading(false);
      }
    }

    async function handleAuthChange(session) {
      if (!mounted) return;

      setUser(session?.user ?? null);

      if (session?.user) {
        await loadFamilyMembers(session.user.id);
      } else {
        setFamilyId(null);
        setFamilyName("");
        setFamilyMembers([]);
        setSelectedMember(null);
        setIsAdmin(false);
        setLoadingMembers(false);
      }

      setAuthLoading(false);
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

  useEffect(() => {
    let cancelled = false;

    async function loadDashboardMedicalReports() {
      if (!selectedMember) {
        if (!cancelled) setDashboardMedicalReports([]);
        return;
      }

      try {
        const records = await fetchMedicalRecords(selectedMember.id);
        if (!cancelled) setDashboardMedicalReports(records || []);
      } catch (error) {
        console.warn("Unable to load dashboard medical reports:", error);
        if (!cancelled) setDashboardMedicalReports([]);
      }
    }

    void loadDashboardMedicalReports();

    return () => {
      cancelled = true;
    };
  }, [selectedMember, activeModule]);

  async function loadFamilyMembers(userId) {
    setLoadingMembers(true);
    setMembersError("");

    try {
      const { data: ownedFamily, error: ownedFamilyError } = await supabase
        .from("families")
        .select("id, owner_id, name")
        .eq("owner_id", userId)
        .maybeSingle();

      if (ownedFamilyError) throw ownedFamilyError;

      let resolvedFamilyId = ownedFamily?.id || null;
      let resolvedIsAdmin = !!ownedFamily;

      if (!resolvedFamilyId) {
        const { data: linkedMember, error: linkedMemberError } = await supabase
          .from("family_members")
          .select("id, family_id, role")
          .eq("user_id", userId)
          .maybeSingle();

        if (linkedMemberError) throw linkedMemberError;

        if (linkedMember) {
          resolvedFamilyId = linkedMember.family_id;
          resolvedIsAdmin = linkedMember.role === "admin";
        }
      }

      if (!resolvedFamilyId) {
        await supabase.auth.signOut();
        setUser(null);
        setFamilyId(null);
        setFamilyName("");
        setFamilyMembers([]);
        setSelectedMember(null);
        setIsAdmin(false);
        return;
      }

      let resolvedFamilyName = ownedFamily?.name || "Your Family";

      if (!ownedFamily) {
        const { data: linkedFamily, error: linkedFamilyError } = await supabase
          .from("families")
          .select("id, name")
          .eq("id", resolvedFamilyId)
          .maybeSingle();

        if (linkedFamilyError) throw linkedFamilyError;
        resolvedFamilyName = linkedFamily?.name || "Your Family";
      }

      setFamilyId(resolvedFamilyId);
      setFamilyName(resolvedFamilyName);
      setIsAdmin(resolvedIsAdmin);

      const { data: members, error: membersError } = await supabase
        .from("family_members")
        .select(
          "id, family_id, name, date_of_birth, gender, relation, role, email, avatar, user_id, created_at"
        )
        .eq("family_id", resolvedFamilyId)
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

        if (healthError) {
          console.warn(
            "Health information could not be loaded; family cards will still be shown.",
            healthError
          );
        } else {
          healthInfo = data || [];
        }
      }

      const healthMap = new Map(
        healthInfo.map((info) => [info.family_member_id, info])
      );

      const mappedMembers = (members || []).map((member) => {
        const health = healthMap.get(member.id);

        return {
          ...member,
          relation: member.relation || "Other",
          avatar: member.avatar || getAvatarForRelation(member.relation),
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
        return mappedMembers.find((member) => member.id === current.id) || null;
      });
    } catch (error) {
      console.error("Unable to load family members:", error);
      setFamilyMembers([]);
      setSelectedMember(null);
      setMembersError(error.message || "Unable to load your family members.");
    } finally {
      setLoadingMembers(false);
    }
  }

  async function addMember(e) {
    e.preventDefault();
    if (addingMember) return;

    if (!user || !familyId) {
      setMembersError("We couldn't find your family. Please refresh and try again.");
      return;
    }

    if (!isAdmin) {
      setMembersError("Only a family admin can add members.");
      return;
    }

    const trimmedName = newName.trim();
    const trimmedRelation = newRelation.trim();
    const normalizedEmail = newEmail.trim().toLowerCase();

    if (!trimmedName || !trimmedRelation) {
      setMembersError("Please enter the member's name and relationship.");
      return;
    }

    if (newRole === "adult") {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!normalizedEmail || !emailPattern.test(normalizedEmail)) {
        setMembersError("Please enter a valid email address for the adult member.");
        return;
      }
    }

    if (!newAvatar) {
      setMembersError("Please choose an avatar for the family member.");
      return;
    }

    setMembersError("");
    setSuccessMessage("");
    setAddingMember(true);

    let createdMember = null;

    try {
      if (newRole === "adult") {
        const { data: existingFamilyMember, error: existingMemberError } = await supabase
          .from("family_members")
          .select("id, name, email, user_id")
          .eq("family_id", familyId)
          .ilike("email", normalizedEmail)
          .maybeSingle();

        if (existingMemberError) throw existingMemberError;

        if (existingFamilyMember) {
          if (existingFamilyMember.user_id) {
            throw new Error("This email already belongs to an active family member. Ask them to sign in instead.");
          }
          throw new Error("An invitation is already pending for this email. Ask the member to check their inbox.");
        }
      }

      const { data: member, error: memberError } = await supabase
        .from("family_members")
        .insert({
          family_id: familyId,
          name: trimmedName,
          relation: trimmedRelation,
          role: newRole,
          email: newRole === "adult" ? normalizedEmail : null,
          avatar: newAvatar,
          user_id: null,
        })
        .select("id, family_id, name, date_of_birth, gender, relation, role, email, avatar, user_id, created_at")
        .single();

      if (memberError) throw memberError;
      createdMember = member;

      if (newRole === "adult") {
        const { data: invitationData, error: invitationError } = await supabase.functions.invoke("invite-family-member", {
          body: {
            familyId,
            familyMemberId: member.id,
            email: normalizedEmail,
            name: trimmedName,
            relation: trimmedRelation,
          },
        });

        if (invitationError) {
          let invitationMessage = invitationError.message;
          try {
            const response = invitationError.context;
            if (response && typeof response.clone === "function") {
              const payload = await response.clone().json();
              if (payload?.error) invitationMessage = payload.error;
            }
          } catch {
            // Keep the SDK message if the function response cannot be parsed.
          }
          throw new Error(invitationMessage || "We couldn't send the invitation.");
        }

        if (!invitationData?.success) {
          throw new Error(invitationData?.error || "We couldn't send the invitation.");
        }
      }

      const displayMember = {
        ...member,
        avatar: member.avatar || newAvatar,
        blood: "Not added",
        allergy: "Not added",
        checkup: "Not scheduled",
        existingConditions: "",
        currentMedications: "",
        emergencyContact: "",
      };

      setFamilyMembers((current) => [...current, displayMember]);
      setSelectedMember(null);
      setShowProfile(false);
      setShowAddForm(false);
      setMembersError("");

      setNewName("");
      setNewRelation("");
      setNewRole("child");
      setNewEmail("");
      setNewAvatar("");

      setSuccessMessage(
        newRole === "adult"
          ? `${trimmedName} was added. Invitation pending — the profile becomes active after acceptance.`
          : `${trimmedName} was added to your family.`
      );
      window.setTimeout(() => setSuccessMessage(""), 5000);
    } catch (error) {
      console.error("Unable to add family member:", error);

      if (createdMember?.id) {
        await supabase
          .from("family_members")
          .delete()
          .eq("id", createdMember.id)
          .eq("family_id", familyId);
      }

      setMembersError(error.message || "We couldn't add this family member. Please try again.");
    } finally {
      setAddingMember(false);
    }
  }

  async function deleteMember(member) {
    if (!member || !familyId || !isAdmin || deletingMember) return;

    if (member.user_id === user?.id) {
      setMembersError("You cannot delete your own admin profile.");
      return;
    }

    setMemberToDelete(member);
    setMembersError("");
  }

  async function confirmDeleteMember() {
    if (!memberToDelete || !familyId || !isAdmin || deletingMember) return;

    setDeletingMember(true);
    setMembersError("");

    try {
      await supabase
        .from("family_invitations")
        .delete()
        .eq("family_member_id", memberToDelete.id)
        .eq("family_id", familyId);

      const { error } = await supabase
        .from("family_members")
        .delete()
        .eq("id", memberToDelete.id)
        .eq("family_id", familyId);

      if (error) throw error;

      setFamilyMembers((current) => current.filter((item) => item.id !== memberToDelete.id));

      if (selectedMember?.id === memberToDelete.id) {
        setSelectedMember(null);
        setActiveModule("dashboard");
      }

      setSuccessMessage(`${memberToDelete.name || "Member"} was removed from the family.`);
      setMemberToDelete(null);
    } catch (error) {
      console.error("Unable to delete family member:", error);
      setMembersError(error.message || "We couldn't remove this family member.");
    } finally {
      setDeletingMember(false);
    }
  }

  function openEditForm() {
    if (!selectedMember) return;

    if (!isAdmin && selectedMember.user_id !== user?.id) {
      setProfileError("You can edit your own profile only.");
      return;
    }

    setEditName(selectedMember.name || "");
    setEditRelation(selectedMember.relation || "");
    setEditAvatar(selectedMember.avatar || getAvatarForRelation(selectedMember.relation));
    setEditDob(selectedMember.date_of_birth || "");
    setEditGender(selectedMember.gender || "");
    setEditBlood(selectedMember.blood === "Not added" ? "" : selectedMember.blood || "");
    setEditAllergy(selectedMember.allergy === "Not added" ? "" : selectedMember.allergy || "");
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
          avatar: editAvatar || getAvatarForRelation(editRelation),
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
      setProfileError(error.message || "Unable to save this family profile.");
    } finally {
      setProfileSaving(false);
    }
  }

  if (showCreateFamily) {
    return (
      <CreateFamily
        onBack={async () => {
          await supabase.auth.signOut();
          setShowCreateFamily(false);
          setUser(null);
          setFamilyId(null);
          setFamilyName("");
          setFamilyMembers([]);
          setSelectedMember(null);
          setActiveModule("dashboard");
          setIsAdmin(false);
          setMembersError("");
        }}
        onCreated={async ({ user: createdUser, family, member }) => {
          setShowCreateFamily(false);
          setUser(createdUser);
          setFamilyId(family.id);
          setFamilyName(family.name || "Your Family");
          setSelectedMember(null);
          setActiveModule("dashboard");
          setMembersError("");
          setSuccessMessage("Your family is ready. You can now add members from the family page.");
          setShowAddForm(false);
          await loadFamilyMembers(createdUser.id);
        }}
      />
    );
  }

  if (authLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#f8f9f6",
          color: "#4b5b50",
          fontFamily: "inherit",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "32px", marginBottom: "10px" }}>H</div>
          <strong>Loading HealthHub...</strong>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Login
        onLogin={async (loggedInUser) => {
          setUser(loggedInUser);
          await loadFamilyMembers(loggedInUser.id);
        }}
        onCreateFamily={() => {
          setShowCreateFamily(true);
        }}
      />
    );
  }

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

          <div className="header-actions" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              className="switch-account"
              onClick={() => {
                setShowProfile(false);
                setActiveModule("dashboard");
                setSelectedMember(null);
              }}
            >
              ⇄ Switch Profile
            </button>
          </div>
        </header>

        <div className="dashboard-layout">
          <aside className="sidebar">
            <div className="sidebar-section">
              <button
                type="button"
                className={`nav-item ${activeModule === "dashboard" ? "active" : ""}`}
                onClick={() => {
                  setActiveModule("dashboard");
                  setShowProfile(false);
                }}
              >
                🏠 Overview
              </button>

              <button
                type="button"
                className={`nav-item ${activeModule === "medical-records" ? "active" : ""}`}
                onClick={() => {
                  setActiveModule("medical-records");
                  setShowProfile(false);
                }}
              >
                📄 Medical Reports
              </button>

              <button
                type="button"
                className={`nav-item ${activeModule === "prescriptions" ? "active" : ""}`}
                onClick={() => {
                  setActiveModule("prescriptions");
                  setShowProfile(false);
                }}
              >
                💊 Prescription
              </button>

              <button
                type="button"
                className={`nav-item ${activeModule === "health-ai" ? "active" : ""}`}
                onClick={() => {
                  setActiveModule("health-ai");
                  setShowProfile(false);
                  window.dispatchEvent(new Event("open-health-ai"));
                }}
              >
                ✨ Health AI
              </button>

              <button
                type="button"
                className={`nav-item ${activeModule === "timeline" ? "active" : ""}`}
                onClick={() => {
                  setActiveModule("timeline");
                  setShowProfile(false);
                }}
              >
                🕐 Timeline
              </button>

              <button
                type="button"
                className={`nav-item ${activeModule === "reminders" ? "active" : ""}`}
                onClick={() => {
                  setActiveModule("reminders");
                  setShowProfile(false);
                }}
              >
                🔔 Reminders
              </button>

              <button
                type="button"
                className={`nav-item ${activeModule === "emergency-card" ? "active" : ""}`}
                onClick={() => {
                  setActiveModule("emergency-card");
                  setShowProfile(false);
                }}
              >
                🚨 Emergency Card
              </button>
              <button className="nav-item">⚙️ Settings</button>
            </div>

            <div className="sidebar-family">
              <p>FAMILY MEMBERS</p>

              {familyMembers.map((member) => {
                const isPending = member.role === "adult" && !member.user_id;
                return (
                  <button
                    key={member.id}
                    className={`family-mini ${member.id === selectedMember.id ? "current" : ""} ${isPending ? "family-mini-pending" : ""}`}
                    disabled={isPending}
                    onClick={() => {
                      if (!isPending) {
                        setSelectedMember(member);
                        setShowProfile(false);
                      }
                    }}
                  >
                    <span>{member.avatar}</span>
                    <span>
                      {member.name}
                      <small>
                        {member.relation}
                        {member.role === "adult" && !member.user_id ? " • Invitation pending" : ""}
                      </small>
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          <main className="dashboard-main">
            {membersError && (
              <div className="healthhub-alert healthhub-alert-error" role="alert">
                <div className="healthhub-alert-icon">!</div>
                <div>
                  <strong>Couldn't complete that action</strong>
                  <p>{membersError}</p>
                </div>
                <button type="button" onClick={() => setMembersError("")} aria-label="Dismiss error">
                  ×
                </button>
              </div>
            )}

            {successMessage && (
              <div className="healthhub-alert healthhub-alert-success" role="status">
                <div className="healthhub-alert-icon">✓</div>
                <div>
                  <strong>Done</strong>
                  <p>{successMessage}</p>
                </div>
                <button type="button" onClick={() => setSuccessMessage("")} aria-label="Dismiss message">
                  ×
                </button>
              </div>
            )}

            <AIChatbot />

            {activeModule === "medical-records" ? (
              <MedicalRecordsPage
                selectedMember={selectedMember}
                onRecordsChanged={() => refreshDashboardMedicalReports(selectedMember)}
              />
            ) : activeModule === "prescriptions" ? (
              <Prescriptions selectedMember={selectedMember} />
            ) : activeModule === "emergency-card" ? (
              <HealthCard member={selectedMember} user={user} />
            ) : activeModule === "timeline" ? (
              <Timeline familyMemberId={selectedMember.id} />
            ) : activeModule === "reminders" ? (
              <Reminders familyMemberId={selectedMember.id} />
            ) : (
              <>
                <div className="dashboard-profile-header">
                  <div className="dashboard-person">
                    <div className="dashboard-avatar">{selectedMember.avatar}</div>
                    <div>
                      <h1>{selectedMember.name}</h1>
                      <p>
                        {selectedMember.relation} • {familyName || "Family Health Profile"}
                      </p>
                    </div>
                  </div>

                  <div className="profile-actions">
                    <button
                      className="profile-details-button"
                      onClick={openEditForm}
                      disabled={selectedMember.role === "adult" && !selectedMember.user_id}
                      title={selectedMember.role === "adult" && !selectedMember.user_id ? "Available after the invitation is accepted" : "View or edit profile"}
                    >
                      {selectedMember.role === "adult" && !selectedMember.user_id ? "Profile pending" : "View / Edit Profile"}
                    </button>

                    {isAdmin && selectedMember.user_id !== user?.id && (
                      <button type="button" className="delete-member-button" onClick={() => deleteMember(selectedMember)}>
                        Delete Member
                      </button>
                    )}

                    <div className={`status ${!selectedMember.user_id && selectedMember.role === "adult" ? "status-pending" : ""}`}>
                      {selectedMember.role === "adult" && !selectedMember.user_id
                        ? "○ Invitation pending"
                        : `● Health profile active${isAdmin && selectedMember.user_id === user?.id ? " • Admin" : ""}`}
                    </div>
                  </div>
                </div>

                {selectedMember.role === "adult" && !selectedMember.user_id && (
                  <div className="pending-profile-panel">
                    <div className="pending-profile-icon">✉</div>
                    <div>
                      <strong>Invitation pending</strong>
                      <p>
                        {selectedMember.email || "This member"} has not accepted the invitation yet.
                        Their health profile will become active after they accept and set their password.
                      </p>
                    </div>
                  </div>
                )}

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
                    <button
                      type="button"
                      onClick={() => {
                        setActiveModule("emergency-card");
                        setShowProfile(false);
                      }}
                    >
                      View Full Card
                    </button>
                  </div>
                </div>

                <div className="dashboard-grid">
                  <section className="panel ai-panel">
                    <AIHealthSummary
                      member={selectedMember}
                      medicalReports={dashboardMedicalReports}
                      prescriptions={[]}
                      healthRecords={[]}
                    />
                  </section>

                  <section className="panel">
                    <div className="panel-title">
                      <h2>📄 Recent Medical Reports</h2>
                      <button
                        type="button"
                        className="panel-link-button"
                        style={{
                          border: "none",
                          background: "transparent",
                          color: "#66806b",
                          fontWeight: 700,
                          cursor: "pointer",
                          font: "inherit",
                        }}
                        onClick={() => setActiveModule("medical-records")}
                      >
                        View All
                      </button>
                    </div>

                    {dashboardMedicalReports.length > 0 ? (
                      dashboardMedicalReports.slice(0, 3).map((report) => (
                        <button
                          type="button"
                          key={report.id}
                          className="report dashboard-report-button"
                          style={{
                            width: "100%",
                            border: "0",
                            cursor: "pointer",
                            textAlign: "left",
                            font: "inherit",
                            background: "transparent",
                          }}
                          onClick={() => setActiveModule("medical-records")}
                        >
                          <span>🧪</span>
                          <div>
                            <strong>{report.title}</strong>
                            <p>
                              {report.record_type || report.category || "Medical report"}
                              {report.record_date
                                ? ` • ${new Intl.DateTimeFormat("en-IN", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  }).format(new Date(`${report.record_date}T00:00:00`))}`
                                : ""}
                            </p>
                          </div>
                          <b>›</b>
                        </button>
                      ))
                    ) : (
                      <div className="dashboard-empty-reports">
                        <strong>No medical reports yet</strong>
                        <p>Upload a report from Medical Reports to see it here.</p>
                      </div>
                    )}
                  </section>

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
                </div>

                <AIChatbot />

                {showProfile && selectedMember && (
                  <div className="profile-modal-backdrop" onMouseDown={(e) => {
                    if (e.target === e.currentTarget) setShowProfile(false);
                  }}>
                    <form className="profile-modal" onSubmit={saveEdit}>
                      <div className="profile-modal-header">
                        <div>
                          <span className="profile-modal-kicker">FAMILY PROFILE</span>
                          <h2>View / Edit Profile</h2>
                          <p>Update {selectedMember.name}'s basic and health information.</p>
                        </div>

                        <button type="button" className="profile-modal-close" onClick={() => setShowProfile(false)} aria-label="Close profile">
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
                            <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Enter full name" required />
                          </label>

                          <label className="profile-field">
                            <span>Relationship</span>
                            <select value={editRelation} onChange={(e) => {
                              setEditRelation(e.target.value);
                              setEditAvatar(getAvatarForRelation(e.target.value));
                            }} required>
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
                            <input type="date" value={editDob} onChange={(e) => setEditDob(e.target.value)} />
                          </label>

                          <label className="profile-field">
                            <span>Gender</span>
                            <select value={editGender} onChange={(e) => setEditGender(e.target.value)}>
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
                            <input type="text" value={editBlood} onChange={(e) => setEditBlood(e.target.value)} placeholder="e.g. B+" />
                          </label>

                          <label className="profile-field">
                            <span>Allergies</span>
                            <input type="text" value={editAllergy} onChange={(e) => setEditAllergy(e.target.value)} placeholder="e.g. Peanuts" />
                          </label>

                          <label className="profile-field profile-field-full">
                            <span>Existing Medical Conditions</span>
                            <textarea rows="3" value={editConditions} onChange={(e) => setEditConditions(e.target.value)} placeholder="e.g. Diabetes, asthma, hypertension" />
                          </label>

                          <label className="profile-field profile-field-full">
                            <span>Current Medications</span>
                            <textarea rows="3" value={editMedications} onChange={(e) => setEditMedications(e.target.value)} placeholder="List current medicines" />
                          </label>

                          <label className="profile-field profile-field-full">
                            <span>Emergency Contact</span>
                            <input type="text" value={editEmergencyContact} onChange={(e) => setEditEmergencyContact(e.target.value)} placeholder="Name and phone number" />
                          </label>
                        </div>
                      </div>

                      <div className="profile-modal-footer">
                        <p>Changes are saved securely to your family profile.</p>
                        <div className="profile-modal-actions">
                          <button type="button" className="profile-cancel-button" onClick={() => setShowProfile(false)}>
                            Cancel
                          </button>

                          <button type="submit" className="profile-save-button" disabled={profileSaving}>
                            {profileSaving ? "Saving..." : "Save Changes"}
                          </button>
                        </div>
                      </div>
                    </form>

                    <style>{`
                      .profile-modal-backdrop { position: fixed; inset: 0; z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 28px; background: rgba(25, 38, 31, 0.55); backdrop-filter: blur(4px); overflow-y: auto; }
                      .profile-modal { width: min(780px, 100%); max-height: calc(100vh - 56px); overflow-y: auto; margin: auto; padding: 30px; border: 1px solid #e3e9e4; border-radius: 22px; background: #ffffff; box-shadow: 0 24px 70px rgba(20, 35, 27, 0.24); color: #25352c; }
                      .profile-modal-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; padding-bottom: 22px; border-bottom: 1px solid #edf0ed; }
                      .profile-modal-kicker { display: inline-block; margin-bottom: 8px; font-size: 11px; font-weight: 800; letter-spacing: 1.2px; color: #66806b; }
                      .profile-modal-header h2 { margin: 0; font-size: 28px; line-height: 1.15; color: #24342b; }
                      .profile-modal-header p { margin: 8px 0 0; color: #718078; font-size: 14px; line-height: 1.5; }
                      .profile-modal-close { flex: 0 0 auto; width: 38px; height: 38px; border: 1px solid #e0e6e1; border-radius: 50%; background: #f8faf8; color: #526158; font-size: 24px; line-height: 1; cursor: pointer; transition: 0.2s ease; }
                      .profile-modal-close:hover { background: #edf3ee; transform: rotate(3deg); }
                      .profile-modal-error { margin-top: 18px; padding: 12px 14px; border: 1px solid #f0cccc; border-radius: 12px; background: #fff5f5; color: #a23d3d; font-size: 13px; }
                      .profile-form-section { margin-top: 24px; padding: 20px; border: 1px solid #e8eee9; border-radius: 16px; background: #fbfcfb; }
                      .profile-section-heading { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; }
                      .profile-section-icon { display: grid; place-items: center; width: 38px; height: 38px; border-radius: 11px; background: #edf4ee; font-size: 18px; }
                      .profile-section-heading h3 { margin: 0; font-size: 16px; color: #2d3e34; }
                      .profile-section-heading p { margin: 3px 0 0; color: #7a8780; font-size: 12px; }
                      .profile-form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
                      .profile-field { display: flex !important; flex-direction: column !important; align-items: stretch !important; gap: 7px !important; min-width: 0; color: #425149; font-size: 13px; font-weight: 650; }
                      .profile-field-full { grid-column: 1 / -1; }
                      .profile-field input, .profile-field select, .profile-field textarea { box-sizing: border-box; width: 100% !important; min-height: 44px; margin: 0 !important; padding: 11px 12px; border: 1px solid #d8e0da !important; border-radius: 10px !important; background: #ffffff !important; color: #26372d !important; font: inherit; font-size: 14px; outline: none; transition: border-color 0.2s ease, box-shadow 0.2s ease; }
                      .profile-field textarea { min-height: 92px; resize: vertical; line-height: 1.45; }
                      .profile-field input::placeholder, .profile-field textarea::placeholder { color: #a0aaa4; }
                      .profile-field input:focus, .profile-field select:focus, .profile-field textarea:focus { border-color: #6a866f !important; box-shadow: 0 0 0 3px rgba(106, 134, 111, 0.12); }
                      .profile-modal-footer { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-top: 24px; padding-top: 20px; border-top: 1px solid #edf0ed; }
                      .profile-modal-footer p { margin: 0; color: #7c8881; font-size: 12px; }
                      .profile-modal-actions { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
                      .profile-cancel-button, .profile-save-button { min-height: 44px; padding: 0 20px; border-radius: 10px; font: inherit; font-size: 14px; font-weight: 700; cursor: pointer; transition: 0.2s ease; }
                      .profile-cancel-button { border: 1px solid #d8e0da; background: #ffffff; color: #526158; }
                      .profile-cancel-button:hover { background: #f4f7f4; }
                      .profile-save-button { border: 1px solid #65806a; background: #65806a; color: #ffffff; box-shadow: 0 5px 14px rgba(101, 128, 106, 0.18); }
                      .profile-save-button:hover:not(:disabled) { background: #58725e; transform: translateY(-1px); }
                      .profile-save-button:disabled { opacity: 0.65; cursor: not-allowed; }
                      .delete-member-button { min-height: 42px; padding: 0 16px; border: 1px solid #e7bcbc; border-radius: 10px; background: #fff7f7; color: #a84a4a; font: inherit; font-size: 13px; font-weight: 700; cursor: pointer; transition: 0.2s ease; }
                      .delete-member-button:hover { background: #fff0f0; border-color: #d99b9b; transform: translateY(-1px); }
                      @media (max-width: 700px) { .profile-modal-backdrop { align-items: flex-start; padding: 14px; } .profile-modal { max-height: calc(100vh - 28px); padding: 20px; border-radius: 18px; } .profile-modal-header h2 { font-size: 23px; } .profile-form-grid { grid-template-columns: 1fr; } .profile-field-full { grid-column: auto; } .profile-modal-footer { align-items: stretch; flex-direction: column; } .profile-modal-actions { width: 100%; } .profile-cancel-button, .profile-save-button { flex: 1; } }
                    `}</style>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    );
  }

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
          onClick={async () => {
            await supabase.auth.signOut();
            setUser(null);
            setFamilyId(null);
            setFamilyName("");
            setFamilyMembers([]);
            setSelectedMember(null);
            setActiveModule("dashboard");
          }}
        >
          ⇄ Switch Account
        </button>
      </header>

      <main className="profile-page">
        <div className="welcome">
          <h1>Who's using HealthHub?</h1>
          <p>Select a profile to continue</p>
          {familyName && (
            <div style={{ marginTop: "10px", display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 14px", borderRadius: "999px", background: "#edf3ec", color: "#5d7663", fontSize: "13px", fontWeight: 700 }}>
              🏠 {familyName}
            </div>
          )}
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
              <button type="button" onClick={() => user && loadFamilyMembers(user.id)}>
                Try Again
              </button>
            </div>
          ) : familyMembers.length === 0 ? (
            <div className="family-state family-empty-compact">
              <p>No family profiles are available yet.</p>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setMembersError("");
                    setSuccessMessage("");
                    setSelectedMember(null);
                    setShowProfile(false);
                    setNewName("");
                    setNewRelation("");
                    setNewRole("child");
                    setNewEmail("");
                    setNewAvatar("");
                    setShowAddForm(true);
                  }}
                >
                  + Add Member
                </button>
              )}
            </div>
          ) : (
            familyMembers.map((member) => {
              const isPending = member.role === "adult" && !member.user_id;

              return (
                <button
                  className={`profile-card ${isPending ? "profile-card-pending" : ""}`}
                  key={member.id}
                  type="button"
                  disabled={isPending}
                  onClick={() => {
                    if (!isPending) {
                      setSelectedMember(member);
                      setActiveModule("dashboard");
                    }
                  }}
                >
                  <div className="avatar">{member.avatar}</div>
                  <h3>{member.name}</h3>
                  <p>{member.relation}{member.role === "admin" ? " • Admin" : ""}</p>
                  {isPending ? (
                    <>
                      <span className="pending-invitation-badge">Invitation pending</span>
                      <span className="pending-card-note">Waiting for acceptance</span>
                    </>
                  ) : (
                    <span className="active-profile-badge">Active profile</span>
                  )}
                </button>
              );
            })
          )}

          <button
            type="button"
            className="profile-card add-card"
            onClick={() => {
              setMembersError("");
              setSuccessMessage("");
              setSelectedMember(null);
              setShowProfile(false);
              setNewName("");
              setNewRelation("");
              setNewRole("child");
              setNewEmail("");
              setNewAvatar("");
              setShowAddForm(true);
            }}
            disabled={!familyId || !isAdmin}
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
                onClick={() => {
                  if (!addingMember) {
                    setShowAddForm(false);
                    setSelectedMember(null);
                    setShowProfile(false);
                    setMembersError("");
                  }
                }}
                disabled={addingMember}
              >
                ×
              </button>

              <div className="add-member-form-heading">
                <span className="add-member-kicker">FAMILY MANAGEMENT</span>
                <h2>Add Family Member</h2>
                <p>{newRole === "adult" ? "An invitation card will appear as Pending. It becomes an active profile only after the member accepts." : "Create a new family health profile managed by the family admin."}</p>
              </div>

              {membersError && (
                <div className="add-member-error" role="alert">
                  <span className="add-member-error-icon">!</span>
                  <div>
                    <strong>Couldn't add this member</strong>
                    <p>{membersError}</p>
                  </div>
                </div>
              )}

              <label>Name</label>
              <input type="text" placeholder="Enter name" value={newName} onChange={(e) => setNewName(e.target.value)} />

              <label>Relation</label>
              <input type="text" placeholder="e.g. Father, Sister" value={newRelation} onChange={(e) => setNewRelation(e.target.value)} />

              <label>Member Type</label>
              <select value={newRole} onChange={(e) => {
                const role = e.target.value;
                setNewRole(role);
                if (role === "child") {
                  setNewEmail("");
                }
              }} className="member-type-select">
                <option value="child">Child — no login required</option>
                <option value="adult">Adult — send invitation</option>
              </select>

              {newRole === "adult" && (
                <>
                  <label>Email Address</label>
                  <input type="email" placeholder="member@example.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} autoComplete="email" />
                  <p className="member-email-helper">An invitation will be sent to this email address.</p>
                </>
              )}

              <label>Choose Avatar</label>

              <div className="avatar-options">
                {avatarOptions.map((avatar) => (
                  <button
                    type="button"
                    key={avatar}
                    className={`avatar-option ${newAvatar === avatar ? "avatar-selected" : ""}`}
                    onClick={() => setNewAvatar(avatar)}
                  >
                    {avatar}
                  </button>
                ))}
              </div>

              <div className="add-member-submit-row">
                <button
                  type="button"
                  className="add-member-cancel"
                  onClick={() => {
                    if (!addingMember) {
                      setShowAddForm(false);
                      setMembersError("");
                    }
                  }}
                  disabled={addingMember}
                >
                  Cancel
                </button>
                <button type="submit" className="add-member-submit" disabled={addingMember}>
                  {addingMember ? (
                    <span className="submit-loading">
                      <span className="submit-spinner" /> {newRole === "adult" ? "Sending invitation…" : "Adding member…"}
                    </span>
                  ) : newRole === "adult" ? (
                    "Send Invitation"
                  ) : (
                    "Add Member"
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {memberToDelete && (
          <div className="member-delete-overlay" role="dialog" aria-modal="true" aria-labelledby="delete-member-title">
            <div className="member-delete-modal">
              <div className="delete-modal-icon">!</div>
              <h2 id="delete-member-title">Remove {memberToDelete.name || "this member"}?</h2>
              <p>
                This will remove their family profile from <strong>{familyName || "your family"}</strong>.
                {memberToDelete.role === "adult" && !memberToDelete.user_id ? " Any pending invitation for this profile will also be cancelled." : ""}
              </p>
              <div className="delete-modal-actions">
                <button type="button" className="delete-cancel-button" onClick={() => setMemberToDelete(null)} disabled={deletingMember}>
                  Keep Member
                </button>
                <button type="button" className="delete-confirm-button" onClick={confirmDeleteMember} disabled={deletingMember}>
                  {deletingMember ? "Removing…" : "Remove Member"}
                </button>
              </div>
            </div>
          </div>
        )}

        <style>{`
          @keyframes emptyStateIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
          .add-member-overlay { position: fixed; inset: 0; z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 24px; background: rgba(35, 45, 38, 0.34); backdrop-filter: blur(4px); }
          .add-member-form { position: relative; width: min(520px, 100%); max-height: min(760px, calc(100vh - 48px)); overflow-y: auto; padding: 32px 34px 30px; border: 1px solid #e2e7df; border-radius: 22px; background: #fffefc; box-shadow: 0 24px 70px rgba(42, 54, 45, 0.18), 0 4px 18px rgba(42, 54, 45, 0.08); scrollbar-width: thin; scrollbar-color: #c9d2c5 transparent; }
          .add-member-form::-webkit-scrollbar { width: 7px; }
          .add-member-form::-webkit-scrollbar-thumb { border-radius: 999px; background: #c9d2c5; }
          .add-member-form h2 { margin: 0; padding-right: 38px; color: #2f3d34; font-size: 28px; line-height: 1.15; letter-spacing: -0.5px; }
          .add-member-form > p:not(.member-email-helper) { margin: 8px 0 26px; color: #7c8980; font-size: 14px; line-height: 1.5; }
          .add-member-form > label { display: block; margin: 0 0 8px; color: #536258; font-size: 13px; font-weight: 650; }
          .add-member-form > input, .add-member-form > select { display: block; width: 100%; height: 48px; margin: 0 0 20px; padding: 0 14px; border: 1px solid #dbe1d9; border-radius: 11px; background: #fbfcfa; color: #343c36; font-size: 14px; outline: none; transition: border-color .18s ease, box-shadow .18s ease, background .18s ease; }
          .add-member-form > input:focus, .add-member-form > select:focus { border-color: #7d967f; background: #fff; box-shadow: 0 0 0 3px rgba(103, 130, 108, 0.10); }
          .member-type-select { appearance: auto; cursor: pointer; }
          .member-email-helper { margin: -12px 0 20px; color: #8a958d; font-size: 11px; line-height: 1.4; }
          .avatar-options { display: flex; flex-wrap: wrap; gap: 10px; margin: 2px 0 24px; }
          .avatar-option { width: 58px; height: 58px; flex: 0 0 58px; display: flex; align-items: center; justify-content: center; padding: 0; border: 1px solid #dfe5dd; border-radius: 50%; background: #f1f5ed; font-size: 28px; cursor: pointer; transition: transform .16s ease, border-color .16s ease, box-shadow .16s ease; }
          .avatar-option:hover { transform: translateY(-2px); border-color: #9caf9d; }
          .avatar-option.avatar-selected { border: 3px solid #63806a; box-shadow: 0 5px 14px rgba(78, 103, 84, 0.12); }
          .add-member-submit { width: 100%; min-height: 48px; border: none; border-radius: 11px; background: #63806a; color: #fff; font-size: 14px; font-weight: 700; cursor: pointer; transition: background .18s ease, transform .14s ease, box-shadow .18s ease; }
          .add-member-submit:hover { background: #56715d; box-shadow: 0 7px 18px rgba(76, 103, 82, 0.16); }
          .add-member-submit:active { transform: translateY(1px); }
          .close-form { position: absolute; top: 18px; right: 20px; width: 36px; height: 36px; display: grid; place-items: center; padding: 0; border: none; border-radius: 50%; background: transparent; color: #7d8981; font-size: 27px; line-height: 1; cursor: pointer; }
          .close-form:hover { background: #eef2ec; color: #526056; }
          .pending-profile-panel { display:flex; align-items:flex-start; gap:12px; margin-bottom:16px; padding:15px 17px; border:1px solid #eadfbe; border-radius:15px; background:linear-gradient(135deg,#fffaf0,#fff7e6); color:#70582c; }
          .pending-profile-icon { width:34px; height:34px; flex:0 0 34px; display:grid; place-items:center; border-radius:50%; background:#f7e7bf; font-size:16px; }
          .pending-profile-panel strong { display:block; font-size:14px; color:#6c5223; margin-bottom:3px; }
          .pending-profile-panel p { margin:0; font-size:12px; line-height:1.5; color:#806a3d; }
          .healthhub-alert { position: relative; display: flex; align-items: flex-start; gap: 12px; margin-bottom: 16px; padding: 14px 42px 14px 14px; border-radius: 14px; border: 1px solid; box-shadow: 0 8px 24px rgba(40, 55, 45, 0.06); }
          .healthhub-alert-icon { width: 28px; height: 28px; flex: 0 0 28px; display: grid; place-items: center; border-radius: 50%; font-weight: 800; }
          .healthhub-alert strong { display: block; font-size: 14px; margin: 1px 0 3px; }
          .healthhub-alert p { margin: 0; font-size: 13px; line-height: 1.45; }
          .healthhub-alert button { position: absolute; top: 9px; right: 10px; width: 30px; height: 30px; border: 0; border-radius: 50%; background: transparent; color: inherit; font-size: 20px; cursor: pointer; }
          .healthhub-alert-error { background: #fff8f6; border-color: #f0d7cf; color: #74473f; }
          .healthhub-alert-error .healthhub-alert-icon { background: #f7ddd7; color: #9b4e43; }
          .healthhub-alert-success { background: #f3f8f2; border-color: #d6e4d3; color: #38513e; }
          .healthhub-alert-success .healthhub-alert-icon { background: #dcebd9; color: #52735a; }
          .status-pending { background: #fff8e9 !important; color: #80622d !important; }
          .pending-card-note { display: block; margin-top: 4px; color: #8a958d; font-size: 10px; font-weight: 600; }
          .profile-details-button:disabled { opacity: .62; cursor: not-allowed; transform: none !important; }
          .pending-invitation-badge { display: inline-flex; align-items: center; justify-content: center; margin-top: 7px; padding: 5px 9px; border-radius: 999px; background: #fff4d9; border: 1px solid #f0dfb5; color: #7c622f; font-size: 10px; font-weight: 750; }
          .submit-loading { display: inline-flex; align-items: center; justify-content: center; gap: 9px; }
          .submit-spinner { width: 15px; height: 15px; border: 2px solid rgba(255,255,255,.45); border-top-color: #fff; border-radius: 50%; animation: healthhubSpin .75s linear infinite; }
          @keyframes healthhubSpin { to { transform: rotate(360deg); } }
          .add-member-submit:disabled { opacity: .72; cursor: wait; box-shadow: none; }
          .close-form:disabled { opacity: .35; cursor: not-allowed; }
          .member-delete-overlay { position: fixed; inset: 0; z-index: 1200; display: grid; place-items: center; padding: 22px; background: rgba(27, 37, 30, .42); backdrop-filter: blur(5px); }
          .member-delete-modal { width: min(440px, 100%); padding: 30px; border-radius: 22px; background: #fffefc; border: 1px solid #e4e9e1; box-shadow: 0 28px 80px rgba(29, 42, 33, .22); text-align: center; }
          .delete-modal-icon { width: 52px; height: 52px; margin: 0 auto 14px; display: grid; place-items: center; border-radius: 50%; background: #f9e9e5; color: #9b5146; font-weight: 850; font-size: 22px; }
          .member-delete-modal h2 { margin: 0 0 9px; color: #29382f; font-size: 22px; }
          .member-delete-modal p { margin: 0 auto; max-width: 350px; color: #748078; font-size: 13px; line-height: 1.6; }
          .delete-modal-actions { display: flex; gap: 10px; margin-top: 24px; }
          .delete-modal-actions button { flex: 1; min-height: 46px; border-radius: 11px; font-size: 13px; font-weight: 750; cursor: pointer; }
          .delete-cancel-button { border: 1px solid #dce3da; background: #f8faf7; color: #526157; }
          .delete-confirm-button { border: 1px solid #b9675c; background: #a9564b; color: #fff; }
          .delete-modal-actions button:disabled { opacity: .6; cursor: wait; }
          @media (max-width: 600px) { .add-member-overlay { align-items: flex-end; padding: 0; } .add-member-form { width: 100%; max-height: 92vh; padding: 28px 22px 24px; border-radius: 22px 22px 0 0; } .add-member-form h2 { font-size: 24px; } .avatar-options { gap: 9px; } .avatar-option { width: 54px; height: 54px; flex-basis: 54px; font-size: 26px; } .delete-modal-actions { flex-direction: column-reverse; } }
          .add-member-form-heading { padding-right: 40px; }
          .add-member-kicker { display:block; margin-bottom:7px; color:#6d8872; font-size:10px; font-weight:800; letter-spacing:1.25px; }
          .add-member-form-heading p { margin-bottom:22px !important; }
          .add-member-error { display:flex; gap:11px; align-items:flex-start; margin:-5px 0 20px; padding:13px 14px; border:1px solid #ead0ca; border-radius:13px; background:#fff8f6; color:#7e4740; }
          .add-member-error-icon { display:grid; place-items:center; flex:0 0 22px; width:22px; height:22px; border-radius:50%; background:#f1d8d2; color:#9a5148; font-size:12px; font-weight:900; }
          .add-member-error strong { display:block; margin-bottom:3px; color:#75423b; font-size:13px; }
          .add-member-error p { margin:0 !important; color:#8b625c; font-size:12px; line-height:1.45; }
          .add-member-submit-row { display:flex; gap:10px; }
          .add-member-submit-row .add-member-submit, .add-member-cancel { flex:1; }
          .add-member-cancel { min-height:48px; border:1px solid #dbe2da; border-radius:11px; background:#fff; color:#59665e; font:inherit; font-size:14px; font-weight:700; cursor:pointer; }
          .add-member-cancel:hover:not(:disabled) { background:#f4f7f3; }
          .profile-card-pending { cursor:default !important; background:linear-gradient(180deg,#fff 0%,#f7faf6 100%) !important; border-color:#dfe7df !important; }
          .profile-card-pending:hover { transform:none !important; }
          .active-profile-badge { display:inline-flex; align-items:center; justify-content:center; min-height:26px; margin-top:8px; padding:0 10px; border-radius:999px; color:#55705b; background:#edf4ee; border:1px solid #dce8de; font-size:10px; font-weight:800; }
          .add-member-submit:disabled, .add-member-cancel:disabled { opacity:.62; cursor:not-allowed; }
          .member-delete-overlay { background:rgba(30,42,34,.42) !important; backdrop-filter:blur(5px); }
          .member-delete-modal { border:1px solid #e5e9e4 !important; border-radius:22px !important; background:#fffefc !important; box-shadow:0 28px 80px rgba(25,38,30,.22) !important; }
          .delete-modal-icon { background:#f7ece9 !important; color:#a35a51 !important; border-radius:15px !important; }
          .delete-modal-actions { gap:10px !important; }
          .family-mini-pending { cursor: default !important; opacity: .78; }
          .family-mini-pending:hover { background: transparent !important; }
          .family-empty-compact { grid-column:1/-1; min-height:120px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; color:#77837b; }
          .family-empty-compact p { margin:0; }
          .family-empty-compact button { border:1px solid #d4dfd5; border-radius:10px; background:#edf4ee; color:#58715e; padding:10px 16px; font-weight:750; cursor:pointer; }
        `}</style>

        <div className="security">🔒 Your data is safe and encrypted</div>
      </main>
    </div>
  );
}

export default App;
        
