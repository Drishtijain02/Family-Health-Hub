import { useEffect, useState } from "react";
import "./App.css";

import Login from "./components/Login";
import CreateFamily from "./components/CreateFamily";

import { supabase } from "./lib/supabase";

function App() {
  const [user, setUser] = useState(null);
  const [showCreateFamily, setShowCreateFamily] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  /* --------------------------------------------------
     Check existing Supabase session
     -------------------------------------------------- */

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        setUser(session.user);
      }

      setCheckingSession(false);
    };

    getSession();

    /* Listen for login/logout changes */

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /* --------------------------------------------------
     Loading
     -------------------------------------------------- */

  if (checkingSession) {
    return (
      <div className="healthhub-loading">
        <div className="healthhub-loading-logo">
          H
        </div>

        <h2>HealthHub</h2>

        <p>Loading your family health space...</p>
      </div>
    );
  }

  /* --------------------------------------------------
     Create Family
     -------------------------------------------------- */

  if (showCreateFamily) {
    return (
      <CreateFamily
        onBack={() => setShowCreateFamily(false)}
      />
    );
  }

  /* --------------------------------------------------
     Login
     -------------------------------------------------- */

  if (!user) {
    return (
      <Login
        onLogin={(loggedInUser) => {
          setUser(loggedInUser);
        }}
        onCreateFamily={() => {
          setShowCreateFamily(true);
        }}
      />
    );
  }

  /* --------------------------------------------------
     TEMPORARY POST-LOGIN SCREEN
     
     Komal's profile-selection/dashboard section
     will replace this later.
     -------------------------------------------------- */

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <div className="healthhub-session-page">
      <div className="healthhub-session-card">
        <div className="healthhub-session-logo">
          H
        </div>

        <h1>Welcome to HealthHub</h1>

        <p>
          You're signed in successfully.
        </p>

        <div className="healthhub-user-box">
          <span>Signed in as</span>

          <strong>
            {user.email}
          </strong>
        </div>

        <div className="healthhub-session-note">
          Your family profile space will appear here.
        </div>

        <button
          className="healthhub-logout"
          onClick={handleLogout}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

export default App;