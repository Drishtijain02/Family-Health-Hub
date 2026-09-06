import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import "./AcceptInvitation.css";
export default function AcceptInvitation({ onBackToLogin }) {
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState("");
  const [details, setDetails] = useState(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const getToken = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get("token") || "";
  };

  useEffect(() => {
    loadInvitation();
  }, []);

  async function loadInvitation() {
    setLoading(true);
    setError("");

    try {
      const token = getToken();

      if (!token) {
        setError(
          "This invitation link is missing its invitation token. Please reopen the invitation email."
        );
        return;
      }

      const { data, error: functionError } =
        await supabase.functions.invoke(
          "accept-family-invitation",
          {
            body: {
              action: "details",
              token,
            },
          }
        );

      if (functionError) {
        throw functionError;
      }

      if (!data?.success) {
        throw new Error(
          data?.error ||
            "This invitation is invalid or expired."
        );
      }

      setDetails(data);
    } catch (err) {
      console.error("Invitation details error:", err);

      setError(
        err?.message ||
          "Unable to load this invitation. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept(e) {
    e.preventDefault();

    setError("");

    if (!password || password.length < 6) {
      setError(
        "Please create a password with at least 6 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const token = getToken();

    if (!token) {
      setError(
        "This invitation link is missing its invitation token. Please reopen the invitation email."
      );
      return;
    }

    setAccepting(true);

    try {
      const { data, error: functionError } =
        await supabase.functions.invoke(
          "accept-family-invitation",
          {
            body: {
              action: "accept",
              token,
              password,
            },
          }
        );

      if (functionError) {
        throw functionError;
      }

      if (!data?.success) {
        throw new Error(
          data?.error ||
            "We couldn't accept the invitation."
        );
      }

      /*
       * The Edge Function has now:
       * 1. Set the invited user's password
       * 2. Confirmed the email
       * 3. Linked the Auth user to family_members
       * 4. Marked the invitation as accepted
       *
       * Now send the user to the normal Login page.
       */

      await supabase.auth.signOut();

      window.history.replaceState(
        {},
        document.title,
        "/"
      );

      window.location.reload();
    } catch (err) {
      console.error("Accept invitation error:", err);

      setError(
        err?.message ||
          "We couldn't accept the invitation. Please try again."
      );
    } finally {
      setAccepting(false);
    }
  }

  if (loading) {
    return (
      <div className="accept-invitation-page">
        <div className="invitation-card">
          <div className="invitation-loading">
            Loading your invitation...
          </div>
        </div>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="accept-invitation-page">
        <div className="invitation-card">
          <div className="invitation-header">
            <span className="invitation-eyebrow">
              HEALTHHUB
            </span>

            <h1>Invitation unavailable</h1>

            <p>
              We couldn't load this invitation.
            </p>
          </div>

          {error && (
            <div className="invitation-error">
              {error}
            </div>
          )}

          <button
            type="button"
            className="invitation-back-button"
            onClick={() => {
              if (onBackToLogin) {
                onBackToLogin();
              } else {
                window.location.href = "/";
              }
            }}
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="accept-invitation-page">
      <div className="invitation-card">
        <div className="invitation-header">
          <span className="invitation-eyebrow">
            YOU'RE INVITED
          </span>

          <h1>Join your family on HealthHub</h1>

          <p>
            Create your password to activate your
            HealthHub account.
          </p>
        </div>

        <div className="invitation-family-box">
          <div className="family-label">
            FAMILY
          </div>

          <div className="family-name">
            {details.familyName}
          </div>

          <div className="invitation-detail-row">
            <span>Invited as</span>
            <strong>Adult Member</strong>
          </div>

          <div className="invitation-detail-row">
            <span>Name</span>
            <strong>{details.name}</strong>
          </div>

          <div className="invitation-detail-row">
            <span>Email</span>
            <strong>{details.email}</strong>
          </div>
        </div>

        <form onSubmit={handleAccept}>
          <div className="form-group">
            <label htmlFor="password">
              Create Password
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder="Enter at least 6 characters"
              autoComplete="new-password"
              disabled={accepting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">
              Confirm Password
            </label>

            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(e.target.value)
              }
              placeholder="Re-enter your password"
              autoComplete="new-password"
              disabled={accepting}
            />
          </div>

          {error && (
            <div className="invitation-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="accept-invitation-button"
            disabled={accepting}
          >
            {accepting
              ? "Activating Account..."
              : "Accept Invitation →"}
          </button>
        </form>

        <div className="invitation-security">
          🔒 Your health information is private and secure
        </div>

        <button
          type="button"
          className="back-to-login-link"
          onClick={() => {
            if (onBackToLogin) {
              onBackToLogin();
            } else {
              window.location.href = "/";
            }
          }}
          disabled={accepting}
        >
          Back to Login
        </button>
      </div>
    </div>
  );
}