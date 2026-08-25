import { useEffect } from 'react'
import { supabase } from './lib/supabase'

function App() {
  useEffect(() => {
    async function testConnection() {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')

      console.log('Supabase data:', data)
      console.log('Supabase error:', error)
    }

    testConnection()
  }, [])

  return (
    <div>
      <h1>Family Health Hub</h1>
      <p>Supabase connection test</p>
    </div>
  )
}

export default App