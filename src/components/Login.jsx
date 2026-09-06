import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import "./Login.css";

function Login({ onLogin, onCreateFamily }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (loginError) {
        setError(loginError.message);
        return;
      }

      console.log("Login successful:", data.user);

      if (onLogin) {
        onLogin(data.user);
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Something went wrong. Please try again.");
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
            <div className="brand-tagline">Your Family, Your Health</div>
          </div>
        </div>

        {/* Heading */}
        <div className="auth-heading">
          <h1>Welcome back</h1>
          <p>Your family's health, all in one place.</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="auth-form">
          <div className="auth-field">
            <label htmlFor="email">Email address</label>

            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <div className="password-row">
              <label htmlFor="password">Password</label>

              <button
                type="button"
                className="text-button"
                onClick={() =>
                  setError("Password reset will be added soon.")
                }
              >
                Forgot password?
              </button>
            </div>

            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button
            type="submit"
            className="primary-auth-button"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
            {!loading && <span>→</span>}
          </button>
        </form>

        {/* Create Family */}
        <div className="auth-create">
          <span>New to HealthHub?</span>

          <button
            type="button"
            onClick={onCreateFamily}
            className="create-family-link"
          >
            Create a Family Account
          </button>
        </div>

        {/* Security */}
        <div className="auth-security">
          <span className="security-icon">✓</span>
          <span>Your health information is encrypted and secure</span>
        </div>
      </div>
    </div>
  );
}

export default Login;