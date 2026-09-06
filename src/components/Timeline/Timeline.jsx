import { useEffect, useState } from 'react'
import './Timeline.css'
import { supabase } from '../../lib/supabase'

const categories = [
  'All',
  'General',
  'Eye',
  'Heart',
  'Kidney',
  'Liver',
  'Dental',
  'Bone/Orthopedic',
  'Skin',
  'Respiratory',
  'Diabetes',
  'Thyroid',
  "Women's Health",
  'Other',
]

function Timeline({ familyMemberId }) {
  const [events, setEvents] = useState([])

  const [showForm, setShowForm] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('All')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const [errorMessage, setErrorMessage] = useState('')

  const [formData, setFormData] = useState({
    date: '',
    time: '',
    title: '',
    description: '',
    category: 'General',
    type: 'Appointment',
  })

  // --------------------------------------------------
  // FETCH EVENTS FOR SELECTED FAMILY MEMBER
  // --------------------------------------------------

  useEffect(() => {
    const fetchEvents = async () => {
      if (!familyMemberId) {
        setEvents([])
        setLoading(false)
        return
      }

      setLoading(true)
      setErrorMessage('')

      const { data, error } = await supabase
        .from('timeline_events')
        .select('*')
        .eq('family_member_id', familyMemberId)
        .order('event_date', { ascending: false })

      if (error) {
        console.error('Error fetching timeline events:', error)
        setErrorMessage(
          error.message || 'Unable to load health timeline.'
        )
        setEvents([])
        setLoading(false)
        return
      }

      setEvents(data || [])
      setLoading(false)
    }

    fetchEvents()
  }, [familyMemberId])

  // --------------------------------------------------
  // FORM CHANGE
  // --------------------------------------------------

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }))
  }

  // --------------------------------------------------
  // ADD EVENT
  // --------------------------------------------------

  const addEvent = async (event) => {
    event.preventDefault()

    setErrorMessage('')

    if (!familyMemberId) {
      setErrorMessage(
        'Please select a family member before adding an event.'
      )
      return
    }

    if (!formData.title.trim() || !formData.date) {
      setErrorMessage('Please enter an event title and date.')
      return
    }

    setSaving(true)

    const { data, error } = await supabase
      .from('timeline_events')
      .insert({
        family_member_id: familyMemberId,
        event_date: formData.date,
        event_time: formData.time,
        event_type: formData.type,
        category: formData.category,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        medical_record_id: null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding timeline event:', error)

      setErrorMessage(
        error.message || 'Unable to save timeline event.'
      )

      setSaving(false)
      return
    }

    // Add newly-created event immediately to frontend.
    setEvents((previousEvents) => [
      data,
      ...previousEvents,
    ])

    // Clear form.
    setFormData({
      date: '',
      time: '',
      title: '',
      description: '',
      category: 'General',
      type: 'Appointment',
    })

    setShowForm(false)
    setSaving(false)
  }

  // --------------------------------------------------
  // DELETE EVENT
  // --------------------------------------------------

  const deleteEvent = async (id) => {
    if (!id || !familyMemberId) return

    setErrorMessage('')
    setDeletingId(id)

    const { error } = await supabase
      .from('timeline_events')
      .delete()
      .eq('id', id)
      .eq('family_member_id', familyMemberId)

    if (error) {
      console.error('Error deleting timeline event:', error)

      setErrorMessage(
        error.message || 'Unable to delete timeline event.'
      )

      setDeletingId(null)
      return
    }

    setEvents((previousEvents) =>
      previousEvents.filter((event) => event.id !== id)
    )

    setDeletingId(null)
  }

  // --------------------------------------------------
  // CATEGORY FILTER
  // --------------------------------------------------

  const filteredEvents =
    selectedCategory === 'All'
      ? events
      : events.filter(
          (event) => event.category === selectedCategory
        )

  // --------------------------------------------------
  // NEWEST → OLDEST
  // --------------------------------------------------

  const sortedEvents = [...filteredEvents].sort(
    (a, b) =>
      new Date(`${b.event_date}T00:00:00`) -
      new Date(`${a.event_date}T00:00:00`)
  )

  // --------------------------------------------------
  // FORMAT DATE
  // --------------------------------------------------

  const formatDate = (date) => {
    if (!date) return ''

    const dateObject = new Date(`${date}T00:00:00`)

    if (Number.isNaN(dateObject.getTime())) {
      return date
    }

    return dateObject.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  // --------------------------------------------------
  // FORMAT TIME
  // --------------------------------------------------

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

  return (
    <div className="timeline-container">

      {/* HEADER */}
      <div className="timeline-header">

        <div className="timeline-title-section">
          <span className="section-label">
            HEALTH RECORD
          </span>

          <h1>Health Timeline</h1>

          <p>
            A clear history of important health events and
            medical activities.
          </p>
        </div>

        <button
          type="button"
          className="add-event-btn"
          onClick={() => {
            setErrorMessage('')
            setShowForm((previous) => !previous)
          }}
          disabled={!familyMemberId || saving}
        >
          {showForm ? 'Cancel' : '+ Add Event'}
        </button>

      </div>

      {/* ERROR */}
      {errorMessage && (
        <div className="timeline-error">
          <span>⚠</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* CATEGORY FILTERS */}
      <div className="category-filters">
        {categories.map((category) => (
          <button
            type="button"
            key={category}
            className={`category-btn ${
              selectedCategory === category
                ? 'active'
                : ''
            }`}
            onClick={() =>
              setSelectedCategory(category)
            }
          >
            {category}
          </button>
        ))}
      </div>

      {/* ADD EVENT FORM */}
      {showForm && (
        <form
          className="event-form"
          onSubmit={addEvent}
        >
          <div className="event-form-header">
            <div>
              <span className="form-eyebrow">
                HEALTH RECORD
              </span>

              <h2>Add Health Event</h2>

              <p>
                Add an important health event for the
                selected family member.
              </p>
            </div>
          </div>

          <div className="form-grid">

            <div className="form-field">
              <label>Event Title</label>

              <input
                type="text"
                name="title"
                placeholder="e.g. Eye Checkup"
                value={formData.title}
                onChange={handleChange}
                disabled={saving}
              />
            </div>

            <div className="form-field">
              <label>Category</label>

              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                disabled={saving}
              >
                {categories
                  .filter(
                    (category) => category !== 'All'
                  )
                  .map((category) => (
                    <option
                      key={category}
                      value={category}
                    >
                      {category}
                    </option>
                  ))}
              </select>
            </div>

            <div className="form-field">
              <label>Event Type</label>

              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                disabled={saving}
              >
                <option value="Appointment">
                  Appointment
                </option>

                <option value="Medicine">
                  Medicine
                </option>

                <option value="Vaccination">
                  Vaccination
                </option>

                <option value="Check-up">
                  Check-up
                </option>

                <option value="Other">
                  Other
                </option>
              </select>
            </div>

            <div className="form-field">
              <label>Date</label>

              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                disabled={saving}
              />
            </div>

            <div className="form-field">
              <label>Time</label>

              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                disabled={saving}
              />
            </div>

          </div>

          <div className="form-field full-width">
            <label>Description</label>

            <textarea
              name="description"
              placeholder="Add a short description..."
              value={formData.description}
              onChange={handleChange}
              disabled={saving}
              rows={4}
            />
          </div>

          <div className="event-form-actions">
            <button
              type="button"
              className="cancel-event-btn"
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
              className="save-btn"
              disabled={saving}
            >
              {saving
                ? 'Saving...'
                : 'Save Event'}
            </button>
          </div>
        </form>
      )}

      {/* CONTENT */}
      <div className="timeline">

        {loading ? (
          <div className="empty-state">
            <div className="loading-spinner"></div>

            <h3>Loading timeline...</h3>

            <p>
              Fetching health events for this family
              member.
            </p>
          </div>
        ) : !familyMemberId ? (
          <div className="empty-state">
            <div className="empty-icon">♡</div>

            <h3>No family member selected</h3>

            <p>
              Select a family member profile to view
              their health timeline.
            </p>
          </div>
        ) : sortedEvents.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">＋</div>

            <h3>
              No{' '}
              {selectedCategory === 'All'
                ? ''
                : selectedCategory}{' '}
              health events yet
            </h3>

            <p>
              Add a health event or select another
              category to view records.
            </p>
          </div>
        ) : (
          sortedEvents.map((event) => (
            <div
              className="timeline-item"
              key={event.id}
            >

              <div className="timeline-marker">
                <div className="timeline-dot"></div>
              </div>

              <div className="timeline-card">

                <div className="event-top">

                  <div>
                    <div className="event-date">
                      {formatDate(event.event_date)}

                      {event.event_time && (
                        <>
                          {' • '}
                          {formatTime(
                            event.event_time
                          )}
                        </>
                      )}
                    </div>

                    <h3>{event.title}</h3>
                  </div>

                  <span className="event-type">
                    {event.category || 'General'}
                  </span>

                </div>

                {event.description && (
                  <p className="event-description">
                    {event.description}
                  </p>
                )}

                <div className="event-meta">
                  <span>
                    {event.event_type || 'Other'}
                  </span>
                </div>

                <button
                  type="button"
                  className="delete-btn"
                  onClick={() =>
                    deleteEvent(event.id)
                  }
                  disabled={
                    deletingId === event.id
                  }
                >
                  {deletingId === event.id
                    ? 'Deleting...'
                    : 'Delete'}
                </button>

              </div>
            </div>
          ))
        )}

      </div>
    </div>
  )
}

export default Timeline