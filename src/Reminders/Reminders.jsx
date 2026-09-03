import { useEffect, useState } from 'react'
import './Reminders.css'

const reminderTypes = [
  'Medication',
  'Vaccination',
  'Health Checkup',
  'Follow-up Test',
  'Doctor Appointment',
  'Other',
]

const initialReminders = [
  {
    id: 1,
    title: 'Vitamin D Medicine',
    type: 'Medication',
    date: '2026-08-26',
    time: '20:00',
    frequency: 'Daily',
    notes: 'Take after dinner',
    completed: false,
  },
  {
    id: 2,
    title: 'Eye Checkup',
    type: 'Doctor Appointment',
    date: '2026-08-28',
    time: '10:00',
    frequency: 'Once',
    notes: 'Carry previous eye reports',
    completed: false,
  },
]

function Reminders() {
  const formatDate = (date) => {

    if (!date) return ''

    const dateObject = new Date(`${date}T00:00:00`)

    return dateObject.toLocaleDateString('en-IN', {

      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const formatTime = (time) => {
    if (!time) return ''

    const [hours, minutes] = time.split(':')
    const date = new Date()
    date.setHours(hours, minutes)

    return date.toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }
  const [reminders, setReminders] = useState(() => {
    const savedReminders = localStorage.getItem('healthhub_reminders')
    return savedReminders ? JSON.parse(savedReminders) : initialReminders
  })
  useEffect(() => {

    localStorage.setItem('healthhub_reminders', JSON.stringify(reminders))
  }, [reminders])
  
  const [showForm, setShowForm] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    type: 'Medication',
    date: '',
    time: '',
    frequency: 'Once',
    notes: '',
  })

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleAddReminder = (e) => {
    e.preventDefault()

    if (!formData.title || !formData.date) return

    const newReminder = {
      id: Date.now(),
      ...formData,
      completed: false,
    }

    setReminders([...reminders, newReminder])

    setFormData({
      title: '',
      type: 'Medication',
      date: '',
      time: '',
      frequency: 'Once',
      notes: '',
    })

    setShowForm(false)
  }

  const toggleCompleted = (id) => {
    setReminders(
      reminders.map((reminder) =>
        reminder.id === id
          ? { ...reminder, completed: !reminder.completed }
          : reminder
      )
    )
  }

  const deleteReminder = (id) => {
    setReminders(reminders.filter((reminder) => reminder.id !== id))
  }

  return (
    <div className="reminders-page">
      <div className="reminders-header">
        <div>
          <h1>Smart Reminders</h1>
          <p>Keep track of important health reminders.</p>
        </div>

        <button
          className="add-reminder-btn"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ Add Reminder'}
        </button>
      </div>

      {showForm && (
        <form className="reminder-form" onSubmit={handleAddReminder}>
          <h2>Add Reminder</h2>

          <div className="form-grid">
            <div className="form-group">
              <label>Reminder Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Vitamin D Medicine"
              />
            </div>

            <div className="form-group">
              <label>Reminder Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
              >
                {reminderTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Date</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Time</label>
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Frequency</label>
              <select
                name="frequency"
                value={formData.frequency}
                onChange={handleChange}
              >
                <option value="Once">Once</option>
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
              </select>
            </div>

            <div className="form-group full-width">
              <label>Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Add any additional notes..."
                rows="3"
              />
            </div>
          </div>

          <button type="submit" className="save-reminder-btn">
            Save Reminder
          </button>
        </form>
      )}

      <div className="reminders-list">
        {reminders.length === 0 ? (
          <div className="empty-reminders">
            <h3>No reminders yet</h3>
            <p>Add a reminder to keep track of upcoming health activities.</p>
          </div>
        ) : (
          [...reminders]
            .sort((a, b) => {
              const dateTimeA = new Date(`${a.date}T${a.time || '00:00'}`)
              const dateTimeB = new Date(`${b.date}T${b.time || '00:00'}`)

              return dateTimeA - dateTimeB
            })
            .map((reminder) => (
            <div
              className={`reminder-card ${
                reminder.completed ? 'completed' : ''
              }`}
              key={reminder.id}
            >
              <div className="reminder-info">
                <span className="reminder-type">{reminder.type}</span>

                <h3>{reminder.title}</h3>

                <p>
                  {formatDate(reminder.date)}
                  {reminder.time && ` • ${formatTime(reminder.time)}`}
                </p>

                <p className="reminder-frequency">
                  {reminder.frequency}
                </p>

                {reminder.notes && (
                  <p className="reminder-notes">{reminder.notes}</p>
                )}
              </div>

              <div className="reminder-actions">
                <button onClick={() => toggleCompleted(reminder.id)}>
                  {reminder.completed ? 'Completed' : 'Mark Complete'}
                </button>

                <button onClick={() => deleteReminder(reminder.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Reminders