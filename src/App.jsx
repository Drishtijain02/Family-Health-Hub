import { useState, useEffect } from 'react'
import Timeline from './components/Timeline/Timeline'
import Reminders from './Reminders/Reminders'
import './App.css'
import { supabase } from './lib/supabase'

function App() {
  const [page, setPage] = useState('timeline')

  useEffect(() => {
    const checkAuth = async () => {
      const { data, error } = await supabase.auth.getUser()

      console.log('CURRENT USER:', data.user)
      console.log('AUTH ERROR:', error)
    }

    checkAuth()
  }, [])

  return (
    <>
      <div className="app-navigation">
        <button
          className={page === 'timeline' ? 'active' : ''}
          onClick={() => setPage('timeline')}
        >
          Timeline
        </button>

        <button
          className={page === 'reminders' ? 'active' : ''}
          onClick={() => setPage('reminders')}
        >
          Reminders
        </button>
      </div>

      {page === 'timeline' ? (
        <Timeline familyMemberId="2c3b3a3c-0dde-453e-9b48-0628b99725de" />
      ) : (
        <Reminders />
      )}
    </>
  )
}

export default App