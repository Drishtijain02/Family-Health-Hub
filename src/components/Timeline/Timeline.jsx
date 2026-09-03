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

const initialEvents = [
  {
    id: 1,
    date: '2026-08-28',
    time: '10:00 AM',
    title: 'Doctor Appointment',
    description: 'General health check-up',
    category: 'General',
    type: 'Appointment',
  },
  {
    id: 2,
    date: '2026-09-02',
    time: '08:00 AM',
    title: 'Medicine Reminder',
    description: 'Take prescribed morning medicine',
    category: 'General',
    type: 'Medicine',
  },
  {
    id: 3,
    date: '2026-08-24',
    time: '09:00 AM',
    title: 'Blood Test',
    description: 'Routine Blood Test',
    category: 'General',
    type: 'Check-up',
  },
  {
    id: 4,
    date: '2026-08-20',
    time: '11:00 AM',
    title: 'Eye Checkup',
    description: 'Routine vision and eye examination',
    category: 'Eye',
    type: 'Check-up',
  },
  {
    id: 5,
    date: '2026-08-15',
    time: '04:00 PM',
    title: 'Kidney Function Test',
    description: 'Regular kidney health monitoring',
    category: 'Kidney',
    type: 'Check-up',
  },
  {
    id: 6,
    date: '2026-08-10',
    time: '10:30 AM',
    title: 'Dental Checkup',
    description: 'Routine dental examination',
    category: 'Dental',
    type: 'Appointment',
  },
  {
    id: 7,
    date: '2026-08-05',
    time: '02:00 PM',
    title: 'Thyroid Test',
    description: 'Thyroid hormone monitoring',
    category: 'Thyroid',
    type: 'Check-up',
  },
  {
    id: 8,
    date: '2026-07-28',
    time: '12:00 PM',
    title: 'Heart Checkup',
    description: 'Routine cardiac health check',
    category: 'Heart',
    type: 'Appointment',
  },
]

const formatTime = (time) => {
  if (!time) return ''

  // Already in AM/PM format
  if (/AM|PM/i.test(time)) {
    return time
  }

  // Convert 24-hour time (HH:MM) to 12-hour format
  const [hours, minutes] = time.split(':')
  const hour = Number(hours)

  if (Number.isNaN(hour)) {
    return time
  }

  const period = hour >= 12 ? 'PM' : 'AM'
  const formattedHour = hour % 12 || 12

  return `${formattedHour}:${minutes} ${period}`
}

function Timeline({ familyMemberId }) {
  const [events, setEvents] = useState([])

  const [showForm, setShowForm] = useState(false)

  const [selectedCategory, setSelectedCategory] = useState('All')

  const [formData, setFormData] = useState({
    date: '',
    time: '',
    title: '',
    description: '',
    category: 'General',
    type: 'Appointment',
  })

  useEffect(() => {
    const fetchEvents = async () => {
      const { data, error } = await supabase
        .from('timeline_events')
        .select('*')
        .eq('family_member_id', familyMemberId)
        .order('event_date', { ascending: false })

      if (error) {
        console.error('FULL ERROR:', JSON.stringify(error, null, 2))
        return
      }

      console.log('Timeline events from Supabase:', data)
      setEvents(data || [])
    }
    fetchEvents()
  }, [familyMemberId])

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    })
  }

  const addEvent = async (event) => {
    event.preventDefault()

    if (!formData.date || !formData.title) {
      return
    }

    const { data, error } = await supabase
      .from('timeline_events')
      .insert([
        {
          family_member_id: familyMemberId,
          event_date: formData.date,
          event_type: formData.type,
          category: formData.category,
          title: formData.title,
          description: formData.description || null,
          medical_record_id: null,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('Error adding timeline event:', error)
      return
    }

    console.log('New timeline event:', data)

    setEvents((previousEvents) => [...previousEvents, data])

    setFormData({
      date: '',
      time: '',
      title: '',
      description: '',
      category: 'General',
      type: 'Appointment',
    })

    setShowForm(false)
  }

  const deleteEvent = (id) => {
    setEvents((previousEvents) =>
      previousEvents.filter((event) => event.id !== id)
    )
  }

  const filteredEvents =
    selectedCategory === 'All'
      ? events
      : events.filter((event) => event.category === selectedCategory)

  const sortedEvents = [...filteredEvents].sort(
    (a, b) => new Date(b.event_date) - new Date(a.event_date)
  )

  return (
    <div className="timeline-container">

      <div className="timeline-header">
        <div>
          <span className="section-label">HEALTH RECORD</span>

          <h1>Health Timeline</h1>

          <p>
            A clear history of important health events and medical activities.
          </p>
        </div>

        <button
          className="add-event-btn"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ Add Event'}
        </button>
      </div>

      <div className="category-filters">
        {categories.map((category) => (
          <button
            key={category}
            className={`category-btn ${
              selectedCategory === category ? 'active' : ''
            }`}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      {showForm && (
        <form className="event-form" onSubmit={addEvent}>
          <h2>Add Health Event</h2>

          <div className="form-grid">

            <input
              type="text"
              name="title"
              placeholder="Event title"
              value={formData.title}
              onChange={handleChange}
            />

            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
            >
              {categories
                .filter((category) => category !== 'All')
                .map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
            </select>

            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
            >
              <option value="Appointment">Appointment</option>
              <option value="Medicine">Medicine</option>
              <option value="Vaccination">Vaccination</option>
              <option value="Check-up">Check-up</option>
              <option value="Other">Other</option>
            </select>

            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
            />

            <input
              type="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
            />

          </div>

          <textarea
            name="description"
            placeholder="Add a short description..."
            value={formData.description}
            onChange={handleChange}
          />

          <button type="submit" className="save-btn">
            Save Event
          </button>
        </form>
      )}

      <div className="timeline">

        {sortedEvents.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">＋</div>

            <h3>
              No {selectedCategory === 'All' ? '' : selectedCategory} health
              events yet
            </h3>

            <p>
              Add a health event or select another category to view records.
            </p>
          </div>
        ) : (
          sortedEvents.map((event) => (
            <div className="timeline-item" key={event.id}>

              <div className="timeline-marker">
                <div className="timeline-dot"></div>
              </div>

              <div className="timeline-card">

                <div className="event-top">

                  <div>
                    <div className="event-date">
                      {new Date(`${event_date}T00:00:00`).toLocaleDateString(
                        'en-GB',
                        {
                         day: 'numeric',
                         month: 'long',
                         year: 'numeric',
                        }
                      )}
                      
                    </div>

                    <h3>{event.title}</h3>
                  </div>

                  <span className="event-type">
                    {event.category}
                  </span>

                </div>

                {event.description && (
                  <p>{event.description}</p>
                )}

                <div className="event-meta">
                  <span>{event_type}</span>
                </div>

                <button
                  className="delete-btn"
                  onClick={() => deleteEvent(event.id)}
                >
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

export default Timeline