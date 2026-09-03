import { useEffect, useState } from 'react'
import './Reminders.css'
import { supabase } from '../lib/supabase'

const reminderTypes = [
  'Medication',
  'Vaccination',
  'Health Checkup',
  'Follow-up Test',
  'Doctor Appointment',
  'Other',
]

function Reminders({ familyMemberId }) {
  const [reminders, setReminders] = useState([])

  const [showForm, setShowForm] = useState(false)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [updatingId, setUpdatingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const [errorMessage, setErrorMessage] = useState('')

  const [formData, setFormData] = useState({
    title: '',
    type: 'Medication',
    date: '',
    time: '',
    frequency: 'Once',
    notes: '',
  })

  // =====================================================
  // FETCH REMINDERS FOR SELECTED FAMILY MEMBER
  // =====================================================

  useEffect(() => {
    const fetchReminders = async () => {
      if (!familyMemberId) {
        setReminders([])
        setLoading(false)
        return
      }

      setLoading(true)
      setErrorMessage('')

      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('family_member_id', familyMemberId)
        .order('reminder_date', { ascending: true })
        .order('reminder_time', { ascending: true })

      if (error) {
        console.error('Error fetching reminders:', error)

        setErrorMessage(
          error.message || 'Unable to load reminders.'
        )

        setReminders([])
        setLoading(false)
        return
      }

      setReminders(data || [])
      setLoading(false)
    }

    fetchReminders()
  }, [familyMemberId])

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (date) => {
    if (!date) return ''

    const dateObject = new Date(`${date}T00:00:00`)

    if (Number.isNaN(dateObject.getTime())) {
      return date
    }

    return dateObject.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  // =====================================================
  // FORMAT TIME
  // =====================================================

  const formatTime = (time) => {
    if (!time) return ''

    const [hours, minutes] = time.split(':')
    const hour = Number(hours)

    if (Number.isNaN(hour)) {
      return time
    }

    const period = hour >= 12 ? 'PM' : 'AM'
    const formattedHour = hour % 12 || 12

    return `${formattedHour}:${minutes} ${period}`
  }

  // =====================================================
  // FORM CHANGE
  // =====================================================

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }))
  }

  // =====================================================
  // ADD REMINDER
  // =====================================================

  const handleAddReminder = async (event) => {
    event.preventDefault()

    setErrorMessage('')

    if (!familyMemberId) {
      setErrorMessage(
        'Please select a family member before adding a reminder.'
      )
      return
    }

    if (!formData.title.trim() || !formData.date) {
      setErrorMessage(
        'Please enter a reminder title and date.'
      )
      return
    }

    setSaving(true)

    const { data, error } = await supabase
      .from('reminders')
      .insert({
        family_member_id: familyMemberId,
        title: formData.title.trim(),
        reminder_type: formData.type,
        reminder_date: formData.date,
        reminder_time: formData.time || null,
        frequency: formData.frequency,
        notes: formData.notes.trim() || null,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding reminder:', error)

      setErrorMessage(
        error.message || 'Unable to save reminder.'
      )

      setSaving(false)
      return
    }

    setReminders((previousReminders) => [
      ...previousReminders,
      data,
    ])

    setFormData({
      title: '',
      type: 'Medication',
      date: '',
      time: '',
      frequency: 'Once',
      notes: '',
    })

    setShowForm(false)
    setSaving(false)
  }

  // =====================================================
  // MARK COMPLETE / PENDING
  // =====================================================

  const toggleCompleted = async (reminder) => {
    if (!reminder?.id) return

    setErrorMessage('')
    setUpdatingId(reminder.id)

    const newStatus =
      reminder.status === 'completed'
        ? 'pending'
        : 'completed'

    const { data, error } = await supabase
      .from('reminders')
      .update({
        status: newStatus,
      })
      .eq('id', reminder.id)
      .eq('family_member_id', familyMemberId)
      .select()
      .single()

    if (error) {
      console.error(
        'Error updating reminder:',
        error
      )

      setErrorMessage(
        error.message || 'Unable to update reminder.'
      )

      setUpdatingId(null)
      return
    }

    setReminders((previousReminders) =>
      previousReminders.map((item) =>
        item.id === reminder.id ? data : item
      )
    )

    setUpdatingId(null)
  }

  // =====================================================
  // DELETE REMINDER
  // =====================================================

  const deleteReminder = async (id) => {
    if (!id || !familyMemberId) return

    setErrorMessage('')
    setDeletingId(id)

    const { error } = await supabase
      .from('reminders')
      .delete()
      .eq('id', id)
      .eq('family_member_id', familyMemberId)

    if (error) {
      console.error(
        'Error deleting reminder:',
        error
      )

      setErrorMessage(
        error.message || 'Unable to delete reminder.'
      )

      setDeletingId(null)
      return
    }

    setReminders((previousReminders) =>
      previousReminders.filter(
        (reminder) => reminder.id !== id
      )
    )

    setDeletingId(null)
  }

  // =====================================================
  // SORT REMINDERS
  // =====================================================

  const sortedReminders = [...reminders].sort(
    (a, b) => {
      const dateTimeA = new Date(
        `${a.reminder_date}T${
          a.reminder_time || '00:00'
        }`
      )

      const dateTimeB = new Date(
        `${b.reminder_date}T${
          b.reminder_time || '00:00'
        }`
      )

      return dateTimeA - dateTimeB
    }
  )

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="reminders-page">

      {/* ================================================
          HEADER
      ================================================ */}

      <div className="reminders-header">

        <div className="reminders-title-section">

          <span className="reminders-eyebrow">
            HEALTH MANAGEMENT
          </span>

          <h1>Smart Reminders</h1>

          <p>
            Keep track of important medications,
            appointments and health activities.
          </p>

        </div>

        <button
          type="button"
          className="add-reminder-btn"
          onClick={() => {
            setErrorMessage('')
            setShowForm((previous) => !previous)
          }}
          disabled={!familyMemberId || saving}
        >
          {showForm ? 'Cancel' : '+ Add Reminder'}
        </button>

      </div>

      {/* ================================================
          ERROR
      ================================================ */}

      {errorMessage && (
        <div className="reminders-error">
          <span className="error-icon">⚠</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ================================================
          ADD REMINDER FORM
      ================================================ */}

      {showForm && (
        <form
          className="reminder-form"
          onSubmit={handleAddReminder}
        >

          <div className="reminder-form-heading">

            <span className="reminders-eyebrow">
              HEALTH ACTIVITY
            </span>

            <h2>Add Reminder</h2>

            <p>
              Create a reminder for the selected
              family member.
            </p>

          </div>

          <div className="reminder-form-grid">

            {/* TITLE */}

            <div className="reminder-form-group">

              <label htmlFor="reminder-title">
                Reminder Title
              </label>

              <input
                id="reminder-title"
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Vitamin D Medicine"
                disabled={saving}
              />

            </div>

            {/* TYPE */}

            <div className="reminder-form-group">

              <label htmlFor="reminder-type">
                Reminder Type
              </label>

              <select
                id="reminder-type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                disabled={saving}
              >
                {reminderTypes.map((type) => (
                  <option
                    key={type}
                    value={type}
                  >
                    {type}
                  </option>
                ))}
              </select>

            </div>

            {/* DATE */}

            <div className="reminder-form-group">

              <label htmlFor="reminder-date">
                Date
              </label>

              <input
                id="reminder-date"
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                disabled={saving}
              />

            </div>

            {/* TIME */}

            <div className="reminder-form-group">

              <label htmlFor="reminder-time">
                Time
              </label>

              <input
                id="reminder-time"
                type="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                disabled={saving}
              />

            </div>

            {/* FREQUENCY */}

            <div className="reminder-form-group">

              <label htmlFor="reminder-frequency">
                Frequency
              </label>

              <select
                id="reminder-frequency"
                name="frequency"
                value={formData.frequency}
                onChange={handleChange}
                disabled={saving}
              >
                <option value="Once">
                  Once
                </option>

                <option value="Daily">
                  Daily
                </option>

                <option value="Weekly">
                  Weekly
                </option>

                <option value="Monthly">
                  Monthly
                </option>
              </select>

            </div>

          </div>

          {/* NOTES */}

          <div className="reminder-form-group full-width">

            <label htmlFor="reminder-notes">
              Notes
            </label>

            <textarea
              id="reminder-notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Add any additional notes..."
              rows="4"
              disabled={saving}
            />

          </div>

          {/* ACTIONS */}

          <div className="reminder-form-actions">

            <button
              type="button"
              className="cancel-reminder-btn"
              onClick={() => {
                setShowForm(false)
                setErrorMessage('')
              }}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="save-reminder-btn"
              disabled={saving}
            >
              {saving
                ? 'Saving...'
                : 'Save Reminder'}
            </button>

          </div>

        </form>
      )}

      {/* ================================================
          REMINDERS
      ================================================ */}

      <div className="reminders-list">

        {loading ? (

          <div className="empty-reminders">

            <div className="reminder-spinner"></div>

            <h3>Loading reminders...</h3>

            <p>
              Fetching reminders for this family
              member.
            </p>

          </div>

        ) : !familyMemberId ? (

          <div className="empty-reminders">

            <div className="empty-reminder-icon">
              ♡
            </div>

            <h3>
              No family member selected
            </h3>

            <p>
              Select a family member profile to
              view their reminders.
            </p>

          </div>

        ) : sortedReminders.length === 0 ? (

          <div className="empty-reminders">

            <div className="empty-reminder-icon">
              ✓
            </div>

            <h3>
              No reminders yet
            </h3>

            <p>
              Add a reminder to keep track of
              upcoming health activities.
            </p>

          </div>

        ) : (

          sortedReminders.map((reminder) => {

            const completed =
              reminder.status === 'completed'

            return (
              <div
                className={`reminder-card ${
                  completed ? 'completed' : ''
                }`}
                key={reminder.id}
              >

                {/* LEFT CONTENT */}

                <div className="reminder-info">

                  <div className="reminder-card-top">

                    <span className="reminder-type">
                      {reminder.reminder_type ||
                        'Other'}
                    </span>

                    {completed && (
                      <span className="completed-badge">
                        Completed
                      </span>
                    )}

                  </div>

                  <h3>
                    {reminder.title}
                  </h3>

                  <div className="reminder-date-time">

                    <span>
                      {formatDate(
                        reminder.reminder_date
                      )}
                    </span>

                    {reminder.reminder_time && (
                      <>
                        <span className="meta-dot">
                          •
                        </span>

                        <span>
                          {formatTime(
                            reminder.reminder_time
                          )}
                        </span>
                      </>
                    )}

                  </div>

                  {reminder.frequency && (
                    <div className="reminder-frequency">
                      {reminder.frequency}
                    </div>
                  )}

                  {reminder.notes && (
                    <p className="reminder-notes">
                      {reminder.notes}
                    </p>
                  )}

                </div>

                {/* ACTIONS */}

                <div className="reminder-actions">

                  <button
                    type="button"
                    className="complete-reminder-btn"
                    onClick={() =>
                      toggleCompleted(reminder)
                    }
                    disabled={
                      updatingId === reminder.id ||
                      deletingId === reminder.id
                    }
                  >
                    {updatingId === reminder.id
                      ? 'Updating...'
                      : completed
                        ? 'Mark Pending'
                        : 'Mark Complete'}
                  </button>

                  <button
                    type="button"
                    className="delete-reminder-btn"
                    onClick={() =>
                      deleteReminder(reminder.id)
                    }
                    disabled={
                      deletingId === reminder.id ||
                      updatingId === reminder.id
                    }
                  >
                    {deletingId === reminder.id
                      ? 'Deleting...'
                      : 'Delete'}
                  </button>

                </div>

              </div>
            )
          })
        )}

      </div>
    </div>
  )
}

export default Reminders