import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import "./FitnessModule.css";

const ACTIVITY_TYPES = [
  "Walking",
  "Running",
  "Cycling",
  "Workout",
  "Yoga",
  "Sports",
  "Other",
];

const DEFAULT_DAILY_GOAL = 30;

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
function getActivityLocalDate(value) {
  if (!value) return "";

  // If Supabase returns a timestamp, extract the date portion.
  if (typeof value === "string" && value.includes("T")) {
    return value.slice(0, 10);
  }

  return value;
}

function getDateDaysAgo(days) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() - days);

  return getLocalDateString(date);
}

function formatActivityDate(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

/*
 * Store the goal separately for each family member.
 *
 * Example:
 * family_health_hub_fitness_goal_<family_member_id>
 */
function getGoalStorageKey(memberId) {
  return `family_health_hub_fitness_goal_${memberId}`;
}

function getStoredDailyGoal(memberId) {
  if (!memberId) {
    return DEFAULT_DAILY_GOAL;
  }

  try {
    const storedGoal = window.localStorage.getItem(
      getGoalStorageKey(memberId)
    );

    if (!storedGoal) {
      return DEFAULT_DAILY_GOAL;
    }

    const parsedGoal = Number(storedGoal);

    if (!Number.isFinite(parsedGoal) || parsedGoal <= 0) {
      return DEFAULT_DAILY_GOAL;
    }

    return Math.round(parsedGoal);
  } catch (error) {
    console.error("Unable to read fitness goal:", error);
    return DEFAULT_DAILY_GOAL;
  }
}

function saveDailyGoal(memberId, goal) {
  if (!memberId) return;

  try {
    window.localStorage.setItem(
      getGoalStorageKey(memberId),
      String(goal)
    );
  } catch (error) {
    console.error("Unable to save fitness goal:", error);
  }
}

export default function FitnessModule({ selectedMember }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);

  const [activityType, setActivityType] = useState("Walking");
  const [duration, setDuration] = useState("");
  const [activityDate, setActivityDate] = useState(
    getLocalDateString()
  );
  const [notes, setNotes] = useState("");

  // Daily goal
  const [dailyGoal, setDailyGoal] = useState(DEFAULT_DAILY_GOAL);
  const [goalInput, setGoalInput] = useState(
    String(DEFAULT_DAILY_GOAL)
  );
  const [savingGoal, setSavingGoal] = useState(false);

  async function loadActivities() {
    if (!selectedMember?.id) {
      setActivities([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const sevenDaysAgo = getDateDaysAgo(6);

    const { data, error: fetchError } = await supabase
      .from("fitness_activities")
      .select(
        "id, created_at, family_member_id, activity_type, duration_minutes, activity_date, notes"
      )
      .eq("family_member_id", selectedMember.id)
      .gte("activity_date", sevenDaysAgo)
      .order("activity_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (fetchError) {
      console.error(
        "Unable to load fitness activities:",
        fetchError
      );

      setError("Unable to load fitness activity right now.");
      setActivities([]);
    } else {
      setActivities(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    setShowForm(false);
    setShowGoalForm(false);

    setDuration("");
    setNotes("");
    setActivityType("Walking");
    setActivityDate(getLocalDateString());

    // Load this family member's custom goal.
    const storedGoal = getStoredDailyGoal(selectedMember?.id);

    setDailyGoal(storedGoal);
    setGoalInput(String(storedGoal));

    void loadActivities();
  }, [selectedMember?.id]);

  const today = getLocalDateString();

  const todayMinutes = useMemo(() => {
  return activities
    .filter(
      (activity) => getActivityLocalDate(activity.activity_date) === today
    )
    .reduce(
      (total, activity) => total + Number(activity.duration_minutes || 0),
      0
    );
}, [activities, today]);

  const weeklyMinutes = useMemo(() => {
    return activities.reduce(
      (total, activity) =>
        total + Number(activity.duration_minutes || 0),
      0
    );
  }, [activities]);

  const weeklyActivities = activities.length;

  const progress =
    dailyGoal > 0
      ? Math.min((todayMinutes / dailyGoal) * 100, 100)
      : 0;

  async function handleSaveActivity(event) {
    event.preventDefault();

    if (!selectedMember?.id) {
      setError("Please select a family member first.");
      return;
    }

    const durationNumber = Number(duration);

    if (!activityType) {
      setError("Please select an activity type.");
      return;
    }

    if (!Number.isFinite(durationNumber) || durationNumber <= 0) {
      setError("Please enter a valid activity duration.");
      return;
    }

    if (!activityDate) {
      setError("Please select an activity date.");
      return;
    }

    setSaving(true);
    setError("");

    const { data, error: insertError } = await supabase
      .from("fitness_activities")
      .insert({
        family_member_id: selectedMember.id,
        activity_type: activityType,
        duration_minutes: Math.round(durationNumber),
        activity_date: activityDate,
        notes: notes.trim() || null,
      })
      .select(
        "id, created_at, family_member_id, activity_type, duration_minutes, activity_date, notes"
      )
      .single();

    if (insertError) {
      console.error(
        "Unable to save fitness activity:",
        insertError
      );

      setError(
        insertError.message ||
          "Unable to save this activity."
      );

      setSaving(false);
      return;
    }

    setActivities((current) => [data, ...current]);

    setActivityType("Walking");
    setDuration("");
    setActivityDate(getLocalDateString());
    setNotes("");

    setShowForm(false);
    setSaving(false);
  }

  function handleOpenGoalForm() {
    setError("");
    setGoalInput(String(dailyGoal));
    setShowGoalForm(true);
  }

  function handleSaveGoal(event) {
    event.preventDefault();

    const goalNumber = Number(goalInput);

    if (
      !Number.isFinite(goalNumber) ||
      goalNumber <= 0 ||
      goalNumber > 1440
    ) {
      setError(
        "Please enter a daily goal between 1 and 1440 minutes."
      );
      return;
    }

    if (!selectedMember?.id) {
      setError("Please select a family member first.");
      return;
    }

    setSavingGoal(true);
    setError("");

    const roundedGoal = Math.round(goalNumber);

    saveDailyGoal(selectedMember.id, roundedGoal);

    setDailyGoal(roundedGoal);
    setGoalInput(String(roundedGoal));

    setShowGoalForm(false);
    setSavingGoal(false);
  }

  if (!selectedMember) {
    return (
      <section className="fitness-page">
        <div className="fitness-empty-state">
          <div className="fitness-empty-icon">🏃</div>

          <h2>Select a family member</h2>

          <p>
            Select a family member to view and manage their
            fitness activity.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="fitness-page">
      {/* HEADER */}
      <div className="fitness-header">
        <div>
          <span className="fitness-kicker">
            FITNESS & WELLNESS
          </span>

          <h1>Fitness for {selectedMember.name}</h1>

          <p>
            Keep track of everyday physical activity and
            build healthier routines.
          </p>
        </div>

        <button
          type="button"
          className="fitness-primary-button"
          onClick={() => {
            setError("");
            setShowForm(true);
          }}
        >
          + Log Activity
        </button>
      </div>

      {/* ERROR */}
      {error && (
        <div className="fitness-alert" role="alert">
          <span>!</span>

          <p>{error}</p>

          <button
            type="button"
            onClick={() => setError("")}
          >
            ×
          </button>
        </div>
      )}

      {/* STAT CARDS */}
      <div className="fitness-stat-grid">
        <div className="fitness-stat-card">
          <div className="fitness-stat-icon">🏃</div>

          <div>
            <span>Today's Activity</span>
            <strong>{todayMinutes} min</strong>
          </div>
        </div>

        <div className="fitness-stat-card">
          <div className="fitness-stat-icon">📅</div>

          <div>
            <span>Last 7 Days</span>
            <strong>{weeklyMinutes} min</strong>
          </div>
        </div>

        <div className="fitness-stat-card">
          <div className="fitness-stat-icon">🎯</div>

          <div>
            <span>Daily Goal</span>

            <strong>{dailyGoal} min</strong>

            <button
              type="button"
              className="fitness-edit-goal-btn"
              onClick={handleOpenGoalForm}
            >
              Edit
            </button>
          </div>
        </div>

        <div className="fitness-stat-card">
          <div className="fitness-stat-icon">🔥</div>

          <div>
            <span>Activities This Week</span>
            <strong>{weeklyActivities}</strong>
          </div>
        </div>
      </div>

      {/* PROGRESS + WEEKLY */}
      <div className="fitness-content-grid">
        <section className="fitness-panel fitness-progress-panel">
          <div className="fitness-panel-heading">
            <div>
              <h2>Today's Progress</h2>

              <p>
                Daily activity goal for{" "}
                {selectedMember.name}
              </p>
            </div>

            <strong>
              {Math.min(todayMinutes, dailyGoal)} /{" "}
              {dailyGoal} min
            </strong>
          </div>

          <div className="fitness-progress-track">
            <div
              className="fitness-progress-fill"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>

          <div className="fitness-progress-footer">
            <span>
              {todayMinutes >= dailyGoal
                ? "Goal completed 🎉"
                : `${Math.max(
                    dailyGoal - todayMinutes,
                    0
                  )} min remaining`}
            </span>

            <span>{Math.round(progress)}%</span>
          </div>
        </section>

        <section className="fitness-panel">
          <div className="fitness-panel-heading">
            <div>
              <h2>Weekly Overview</h2>

              <p>
                Activity logged in the last 7 days
              </p>
            </div>
          </div>

          <div className="fitness-week-summary">
            <div>
              <strong>{weeklyMinutes}</strong>
              <span>minutes</span>
            </div>

            <div className="fitness-summary-divider" />

            <div>
              <strong>{weeklyActivities}</strong>
              <span>activities</span>
            </div>
          </div>
        </section>
      </div>

      {/* RECENT ACTIVITY */}
      <section className="fitness-panel fitness-activities-panel">
        <div className="fitness-panel-heading">
          <div>
            <h2>Recent Activity</h2>

            <p>
              Activity logged for {selectedMember.name}
            </p>
          </div>

          <button
            type="button"
            className="fitness-small-button"
            onClick={() => setShowForm(true)}
          >
            + Add
          </button>
        </div>

        {loading ? (
          <div className="fitness-loading">
            Loading activity...
          </div>
        ) : activities.length === 0 ? (
          <div className="fitness-no-activity">
            <div>🌿</div>

            <strong>No activity logged yet</strong>

            <p>
              Start by adding a walk, workout, sport or
              another physical activity.
            </p>

            <button
              type="button"
              className="fitness-secondary-button"
              onClick={() => setShowForm(true)}
            >
              Log First Activity
            </button>
          </div>
        ) : (
          <div className="fitness-activity-list">
            {activities.map((activity) => (
              <div
                className="fitness-activity-row"
                key={activity.id}
              >
                <div className="fitness-activity-icon">
                  {activity.activity_type === "Walking"
                    ? "🚶"
                    : activity.activity_type === "Running"
                      ? "🏃"
                      : activity.activity_type ===
                          "Cycling"
                        ? "🚴"
                        : activity.activity_type === "Yoga"
                          ? "🧘"
                          : activity.activity_type ===
                              "Sports"
                            ? "⚽"
                            : "💪"}
                </div>

                <div className="fitness-activity-details">
                  <strong>
                    {activity.activity_type}
                  </strong>

                  <p>
                    {formatActivityDate(
                      activity.activity_date
                    )}

                    {activity.notes
                      ? ` • ${activity.notes}`
                      : ""}
                  </p>
                </div>

                <strong className="fitness-activity-duration">
                  {activity.duration_minutes} min
                </strong>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* LOG ACTIVITY MODAL */}
      {showForm && (
        <div
          className="fitness-modal-backdrop"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !saving
            ) {
              setShowForm(false);
            }
          }}
        >
          <form
            className="fitness-modal"
            onSubmit={handleSaveActivity}
          >
            <div className="fitness-modal-header">
              <div>
                <span className="fitness-kicker">
                  FITNESS ACTIVITY
                </span>

                <h2>Log Activity</h2>

                <p>
                  Add physical activity for{" "}
                  {selectedMember.name}.
                </p>
              </div>

              <button
                type="button"
                className="fitness-modal-close"
                onClick={() => setShowForm(false)}
                disabled={saving}
              >
                ×
              </button>
            </div>

            <label className="fitness-field">
              <span>Activity Type</span>

              <select
                value={activityType}
                onChange={(event) =>
                  setActivityType(event.target.value)
                }
              >
                {ACTIVITY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            <div className="fitness-form-grid">
              <label className="fitness-field">
                <span>Duration (minutes)</span>

                <input
                  type="number"
                  min="1"
                  max="1440"
                  value={duration}
                  onChange={(event) =>
                    setDuration(event.target.value)
                  }
                  placeholder="e.g. 30"
                  required
                />
              </label>

              <label className="fitness-field">
                <span>Date</span>

                <input
                  type="date"
                  value={activityDate}
                  onChange={(event) =>
                    setActivityDate(event.target.value)
                  }
                  required
                />
              </label>
            </div>

            <label className="fitness-field">
              <span>
                Notes <small>(optional)</small>
              </span>

              <textarea
                rows="3"
                value={notes}
                onChange={(event) =>
                  setNotes(event.target.value)
                }
                placeholder="e.g. Evening walk around campus"
              />
            </label>

            <div className="fitness-modal-footer">
              <button
                type="button"
                className="fitness-cancel-button"
                onClick={() => setShowForm(false)}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="fitness-primary-button"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Activity"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* DAILY GOAL MODAL */}
      {showGoalForm && (
        <div
          className="fitness-modal-backdrop"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !savingGoal
            ) {
              setShowGoalForm(false);
            }
          }}
        >
          <form
            className="fitness-modal"
            onSubmit={handleSaveGoal}
          >
            <div className="fitness-modal-header">
              <div>
                <span className="fitness-kicker">
                  FITNESS GOAL
                </span>

                <h2>Set Daily Goal</h2>

                <p>
                  Customize the daily activity goal for{" "}
                  {selectedMember.name}.
                </p>
              </div>

              <button
                type="button"
                className="fitness-modal-close"
                onClick={() => setShowGoalForm(false)}
                disabled={savingGoal}
              >
                ×
              </button>
            </div>

            <label className="fitness-field">
              <span>Daily Activity Goal (minutes)</span>

              <input
                type="number"
                min="1"
                max="1440"
                value={goalInput}
                onChange={(event) =>
                  setGoalInput(event.target.value)
                }
                placeholder="e.g. 30"
                required
                autoFocus
              />
            </label>

            <p
              style={{
                marginTop: "-6px",
                marginBottom: "20px",
                fontSize: "13px",
                color: "#718096",
              }}
            >
              This goal is specific to{" "}
              <strong>{selectedMember.name}</strong>.
              You can change it anytime.
            </p>

            <div className="fitness-modal-footer">
              <button
                type="button"
                className="fitness-cancel-button"
                onClick={() => setShowGoalForm(false)}
                disabled={savingGoal}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="fitness-primary-button"
                disabled={savingGoal}
              >
                {savingGoal
                  ? "Saving..."
                  : "Save Goal"}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}