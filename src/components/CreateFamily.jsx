import { useState } from "react";
import { supabase } from "../lib/supabase";

const avatarOptions = ["👨🏻", "👩🏻", "👦🏻", "👧🏻", "👴🏻", "👵🏻"];

function CreateFamily({ onBack, onCreated }) {
  const [familyName, setFamilyName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreateFamily = async (e) => {
    e.preventDefault();
    if (loading) return;

    setError("");

    if (!avatar) {
      setError("Please choose an avatar for your Admin profile.");
      return;
    }

    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();

      const { data: authData, error: authError } =
        await supabase.auth.signUp({
          email: normalizedEmail,
          password,
        });

      if (authError) throw authError;

      const user = authData.user;
      const session = authData.session;

      if (!user) throw new Error("Account could not be created.");

      if (!session) {
        throw new Error(
          "Account created, but email verification is required. Please verify your email and then log in."
        );
      }

      const { data: family, error: familyError } = await supabase
        .from("families")
        .insert({
          name: familyName.trim(),
          owner_id: user.id,
        })
        .select()
        .single();

      if (familyError) throw familyError;

      const { data: member, error: memberError } = await supabase
        .from("family_members")
        .insert({
          family_id: family.id,
          name: name.trim(),
          relation: "Admin",
          role: "admin",
          email: normalizedEmail,
          avatar,
          user_id: user.id,
        })
        .select()
        .single();

      if (memberError) throw memberError;

      if (onCreated) {
        await onCreated({ user, family, member });
      }
    } catch (err) {
      console.error("Create family error:", err);
      const raw = String(err?.message || "");
      const lower = raw.toLowerCase();
      let friendly = raw || "Something went wrong while creating the family.";

      if (lower.includes("already registered") || lower.includes("user already exists")) {
        friendly = "An account already exists with this email. Please use Sign in instead.";
      } else if (lower.includes("row-level security") && lower.includes("families")) {
        friendly = "We couldn't create the family because database access is not configured correctly. Please run the HealthHub RLS migration in Supabase and try again.";
      }

      setError(friendly);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-decoration auth-decoration-left">
        <span></span><span></span><span></span>
      </div>
      <div className="auth-decoration auth-decoration-right">
        <span></span><span></span><span></span>
      </div>

      <div className="auth-card create-family-card">
        <div className="auth-brand">
          <div className="brand-logo">H</div>
          <div>
            <div className="brand-name">HealthHub</div>
            <div className="brand-tagline">Your Family, Your Health</div>
          </div>
        </div>

        <div className="auth-heading">
          <h1>Create your family</h1>
          <p>Set up your family's HealthHub space</p>
        </div>

        <form onSubmit={handleCreateFamily} className="auth-form">
          <div className="auth-field">
            <label htmlFor="familyName">Family name</label>
            <input
              id="familyName"
              type="text"
              placeholder="e.g. Sharma Family"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="name">Your name</label>
            <input
              id="name"
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="create-avatar-section">
            <label>Choose your avatar</label>
            <p>Select how your Admin profile will appear on the family page.</p>
            <div className={`create-avatar-options ${!avatar && error ? "avatar-options-error" : ""}`}>
              {avatarOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`create-avatar-option ${
                    avatar === option ? "selected" : ""
                  }`}
                  onClick={() => setAvatar(option)}
                  aria-label={`Choose avatar ${option}`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="createEmail">Email address</label>
            <input
              id="createEmail"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="createPassword">Password</label>
            <input
              id="createPassword"
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button
            type="submit"
            className="primary-auth-button"
            disabled={loading}
          >
            {loading ? "Creating your family…" : <>Create Family <span>→</span></>}
          </button>
        </form>

        <div className="auth-create">
          <span>Already have an account?</span>
          <button type="button" onClick={onBack} className="create-family-link">
            Sign in
          </button>
        </div>

        <div className="auth-security">
          <span className="security-icon">✓</span>
          <span>Your family health information is secure</span>
        </div>
      </div>

      <style>{`
        .create-family-card { max-height: calc(100vh - 40px); overflow-y: auto; }
        .create-avatar-section { margin: 0 0 18px; }
        .create-avatar-section > label { display:block; margin-bottom:5px; font-size:13px; font-weight:700; color:#536258; }
        .create-avatar-section > p { margin:0 0 11px; font-size:11px; color:#8a958d; line-height:1.45; }
        .create-avatar-options { display:flex; flex-wrap:wrap; gap:9px; }
        .create-avatar-option {
          width:50px; height:50px; padding:0; border-radius:50%; border:1px solid #dce4da;
          background:#f2f6f0; font-size:25px; cursor:pointer; transition:.16s ease;
        }
        .create-avatar-option:hover { transform:translateY(-2px); border-color:#9caf9d; }
        .create-avatar-option.selected { border:3px solid #63806a; background:#e9f1e7; box-shadow:0 5px 14px rgba(78,103,84,.12); }
        .avatar-options-error { padding:7px; margin:-7px -7px 17px; border:1px solid #efd3cc; border-radius:15px; background:#fff8f6; }
        @media(max-width:600px){ .create-family-card{max-height:100vh;} }
      `}</style>
    </div>
  );
}

export default CreateFamily;
