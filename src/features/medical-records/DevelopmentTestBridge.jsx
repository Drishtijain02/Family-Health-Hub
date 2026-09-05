import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const TEST_AUTH_USER_ID = '03ae1632-aeef-4697-8a40-a6fa08528630'
const TEST_FAMILY_MEMBER = {
  id: '2c3b3a3c-0dde-453e-9b48-0628b99725de',
  name: 'Drishti Jain',
  relation: 'Self',
}

function getErrorMessage(error, fallback) {
  return error?.message || fallback
}

export default function DevelopmentTestBridge({ onMemberChange }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('checking')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!import.meta.env.DEV) return undefined

    function applySession(session) {
      if (!session) {
        onMemberChange(null)
        setStatus('signed-out')
        return
      }

      if (session.user.id !== TEST_AUTH_USER_ID) {
        onMemberChange(null)
        setStatus('signed-out')
        setError('This development bridge only supports the configured test user.')
        return
      }

      onMemberChange(TEST_FAMILY_MEMBER)
      setError('')
      setStatus('signed-in')

      // TEMPORARY DEVELOPMENT DIAGNOSTIC - Remove after RLS debugging
      if (import.meta.env.DEV) {
        console.group('🔍 RLS Diagnostic - Medical Records Upload')
        console.log('TEST_AUTH_USER_ID:', TEST_AUTH_USER_ID)
        console.log('TEST_FAMILY_MEMBER.id:', TEST_FAMILY_MEMBER.id)

        supabase.auth.getUser().then(({ data, error }) => {
          console.log('supabase.auth.getUser():', {
            userId: data?.user?.id,
            email: data?.user?.email,
            error
          })
        })

        supabase.rpc('get_my_family_ids').then(({ data, error }) => {
          console.log('supabase.rpc(\'get_my_family_ids\'):', { data, error })
        })

        supabase.rpc('get_my_family_member_ids').then(({ data, error }) => {
          console.log('supabase.rpc(\'get_my_family_member_ids\'):', { data, error })
        })

        console.groupEnd()
      }
    }

    let active = true
    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return
      if (sessionError) {
        onMemberChange(null)
        setStatus('signed-out')
        setError(getErrorMessage(sessionError, 'Unable to check the current session.'))
        return
      }
      applySession(data.session)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session)
    })

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [onMemberChange])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setStatus('signing-in')

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    setPassword('')

    if (signInError) {
      setStatus('signed-out')
      setError(getErrorMessage(signInError, 'Unable to sign in with the test account.'))
    }
  }

  async function handleSignOut() {
    setError('')
    const { error: signOutError } = await supabase.auth.signOut()

    if (signOutError) {
      setError(getErrorMessage(signOutError, 'Unable to sign out.'))
    }
  }

  if (!import.meta.env.DEV) return null

  if (status === 'signed-in') {
    return (
      <section className="dev-test-panel dev-test-panel--active" aria-label="Development test session">
        <div>
          <strong>Development/Test</strong>
          <span>Signed in as test user · {TEST_FAMILY_MEMBER.name} ({TEST_FAMILY_MEMBER.relation})</span>
        </div>
        <div>
          <button
            type="button"
            className="dev-test-button"
            onClick={handleSignOut}
            >
            Sign out
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="dev-test-panel" aria-label="Development test sign in">
      <div>
        <strong>Development/Test</strong>
        <span>Sign in to test real Medical Records data for {TEST_FAMILY_MEMBER.name}.</span>
      </div>
      <form onSubmit={handleSubmit}>
        <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Test account email" aria-label="Test account email" required disabled={status === 'checking' || status === 'signing-in'} />
        <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" aria-label="Test account password" required disabled={status === 'checking' || status === 'signing-in'} />
        <button type="submit" className="dev-test-button" disabled={status === 'checking' || status === 'signing-in'}>{status === 'checking' ? 'Checking…' : status === 'signing-in' ? 'Signing in…' : 'Sign in'}</button>
      </form>
      {error && <p className="dev-test-error" role="alert">{error}</p>}
    </section>
  )
}
