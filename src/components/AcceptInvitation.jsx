import { useState } from "react";
import "./AcceptInvitation.css";

function AcceptInvitation({ onBack }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Temporary frontend flow.
  // Supabase invitation/account creation will be connected later.
  const handleAcceptInvitation = async (e) => {
  e.preventDefault();
  setError("");

  if (password.length < 6) {
    setError("Password must be at least 6 characters.");
    return;
  }

  if (password !== confirmPassword) {
    setError("Passwords do not match.");
    return;
  }

  setLoading(true);

  try {
    // TEMPORARY:
    // Real Supabase invitation/account creation
    // will be connected here later.

    alert("Invitation accepted successfully!");

    // Go back to Login page
    onBack();

  } catch (err) {
    console.error(err);
    setError("Something went wrong. Please try again.");
  } finally {
    setLoading(false);
  }
};
  return (
    <div className="invitation-page">
      <div className="invitation-card">

        {/* Brand */}
        <div className="invitation-brand">
          <div className="invitation-logo">H</div>

          <div>
            <h1>HealthHub</h1>
            <p>Your Family, Your Health</p>
          </div>
        </div>

        {/* Invitation Icon */}
        <div className="invitation-icon">
          ✓
        </div>

        {/* Heading */}
        <h2>You've Been Invited!</h2>

        <p className="invitation-subtitle">
          You've been invited to join your family's HealthHub.
          Create your password to get started.
        </p>

        {/* Family Information */}
        <div className="family-invite-box">
          <div className="family-invite-label">
            FAMILY
          </div>

          <div className="family-invite-name">
            Sharma Family
          </div>

          <div className="family-invite-details">
            <span>Invited as</span>
            <strong>Adult Member</strong>
          </div>

          <div className="family-invite-details">
            <span>Email</span>
            <strong>member@example.com</strong>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleAcceptInvitation}>

          <div className="form-group">
            <label htmlFor="password">
              Create Password
            </label>

            <input
              id="password"
              type="password"
              placeholder="Create your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">
              Confirm Password
            </label>

            <input
              id="confirmPassword"
              type="password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>

          {error && (
            <p className="invitation-error">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="accept-invitation-button"
            disabled={loading}
          >
            {loading ? "Setting up..." : "Accept Invitation →"}
          </button>

        </form>

        {/* Security Note */}
        <div className="invitation-security">
          🔒 Your health information is private and secure
        </div>

        {/* Back */}
        <button
          type="button"
          className="invitation-back"
          onClick={onBack}
        >
          ← Back to Login
        </button>

      </div>
    </div>
  );
}

export default AcceptInvitation;