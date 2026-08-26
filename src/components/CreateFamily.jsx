import { useState } from "react";
import { supabase } from "../lib/supabase";

function CreateFamily({ onBack }) {
  const [familyName, setFamilyName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreateFamily = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      /* --------------------------------------------------
         1. Create Supabase authentication account
         -------------------------------------------------- */

      const { data: authData, error: authError } =
        await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

      if (authError) {
        throw authError;
      }

      const user = authData.user;
      const session = authData.session;

      if (!user) {
        throw new Error("Account could not be created.");
      }

      /*
       If email confirmation is enabled in Supabase,
       there will be no session immediately after signup.
      */

      if (!session) {
        throw new Error(
          "Account created, but email verification is required. Please verify your email and then log in."
        );
      }

      /* --------------------------------------------------
         2. Create family
         -------------------------------------------------- */

      const { data: family, error: familyError } = await supabase
        .from("families")
        .insert({
          name: familyName.trim(),
          owner_id: user.id,
        })
        .select()
        .single();

      if (familyError) {
        throw familyError;
      }

      /* --------------------------------------------------
         3. Add creator as Admin
         -------------------------------------------------- */

      const { error: memberError } = await supabase
        .from("family_members")
        .insert({
          family_id: family.id,
          name: name.trim(),
          relation: "Admin",
          user_id: user.id,
        });

      if (memberError) {
        throw memberError;
      }

      /* --------------------------------------------------
         4. Success
         -------------------------------------------------- */

      alert(
        `Family created successfully!\n\nYour Family ID is:\n${family.id}`
      );

      console.log("Family created:", family);
      console.log("Admin user:", user);

      /*
        Do not automatically change the authentication flow
        here. The user can go back to Login and sign in.
      */
    } catch (err) {
      console.error("Create family error:", err);

      setError(
        err.message || "Something went wrong while creating the family."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-decoration auth-decoration-left">
        <span></span>
        <span></span>
        <span></span>
      </div>

      <div className="auth-decoration auth-decoration-right">
        <span></span>
        <span></span>
        <span></span>
      </div>

      <div className="auth-card">
        {/* Brand */}

        <div className="auth-brand">
          <div className="brand-logo">H</div>

          <div>
            <div className="brand-name">HealthHub</div>
            <div className="brand-tagline">
              Your Family, Your Health
            </div>
          </div>
        </div>

        {/* Heading */}

        <div className="auth-heading">
          <h1>Create your family</h1>

          <p>
            Set up your family's HealthHub
          </p>
        </div>

        {/* Form */}

        <form onSubmit={handleCreateFamily} className="auth-form">
          <div className="auth-field">
            <label htmlFor="familyName">
              Family name
            </label>

            <input
              id="familyName"
              type="text"
              placeholder="e.g. Sharma Family"
              value={familyName}
              onChange={(e) =>
                setFamilyName(e.target.value)
              }
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="name">
              Your name
            </label>

            <input
              id="name"
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="createEmail">
              Email address
            </label>

            <input
              id="createEmail"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              autoComplete="email"
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="createPassword">
              Password
            </label>

            <input
              id="createPassword"
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>

          {error && (
            <p className="auth-error">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="primary-auth-button"
            disabled={loading}
          >
            {loading ? (
              "Creating..."
            ) : (
              <>
                Create Family
                <span>→</span>
              </>
            )}
          </button>
        </form>

        {/* Back */}

        <div className="auth-create">
          <span>Already have an account?</span>

          <button
            type="button"
            onClick={onBack}
            className="create-family-link"
          >
            Sign in
          </button>
        </div>

        {/* Security */}

        <div className="auth-security">
          <span className="security-icon">✓</span>

          <span>
            Your family health information is secure
          </span>
        </div>
      </div>
    </div>
  );
}

export default CreateFamily;