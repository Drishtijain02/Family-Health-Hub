import { useEffect, useState } from 'react'
import './App.css'

import Timeline from './components/Timeline/Timeline'
import Reminders from './Reminders/Reminders'
import { supabase } from './lib/supabase'

function App() {
  const [page, setPage] = useState('timeline')

  const [familyMembers, setFamilyMembers] = useState([])
  const [selectedMemberId, setSelectedMemberId] = useState('')

  const [loadingMembers, setLoadingMembers] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  // --------------------------------------------------
  // LOAD FAMILY MEMBERS
  // --------------------------------------------------

  useEffect(() => {
    const loadFamilyMembers = async () => {
      setLoadingMembers(true)
      setErrorMessage('')

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError) {
          console.error('Error getting logged-in user:', userError)
          setErrorMessage(
            userError.message || 'Unable to get logged-in user.'
          )
          setLoadingMembers(false)
          return
        }

        if (!user) {
          setErrorMessage(
            'No logged-in user found. Please log in first.'
          )
          setLoadingMembers(false)
          return
        }

        // --------------------------------------------
        // FIND THE FAMILY OWNED BY THE CURRENT USER
        // --------------------------------------------

        let familyId = null

        const { data: ownedFamily, error: familyError } =
          await supabase
            .from('families')
            .select('id')
            .eq('owner_id', user.id)
            .maybeSingle()

        if (familyError) {
          console.error(
            'Error finding owned family:',
            familyError
          )
        }

        if (ownedFamily) {
          familyId = ownedFamily.id
        }

        // --------------------------------------------
        // IF USER IS AN ADULT MEMBER, FIND THEIR FAMILY
        // --------------------------------------------

        if (!familyId) {
          const { data: linkedMember, error: memberError } =
            await supabase
              .from('family_members')
              .select('family_id')
              .eq('user_id', user.id)
              .maybeSingle()

          if (memberError) {
            console.error(
              'Error finding linked family member:',
              memberError
            )
          }

          if (linkedMember) {
            familyId = linkedMember.family_id
          }
        }

        if (!familyId) {
          setErrorMessage(
            'No family was found for this account.'
          )
          setFamilyMembers([])
          setLoadingMembers(false)
          return
        }

        // --------------------------------------------
        // LOAD ALL MEMBERS OF THAT FAMILY
        // --------------------------------------------

        const { data: members, error: membersError } =
          await supabase
            .from('family_members')
            .select('*')
            .eq('family_id', familyId)
            .order('created_at', { ascending: true })

        if (membersError) {
          console.error(
            'Error loading family members:',
            membersError
          )

          setErrorMessage(
            membersError.message ||
              'Unable to load family members.'
          )

          setFamilyMembers([])
          setLoadingMembers(false)
          return
        }

        setFamilyMembers(members || [])

        // Select the first member automatically.
        if (members && members.length > 0) {
          setSelectedMemberId(members[0].id)
        }

        setLoadingMembers(false)
      } catch (error) {
        console.error(
          'Unexpected error loading family members:',
          error
        )

        setErrorMessage(
          error.message ||
            'Something went wrong while loading family members.'
        )

        setLoadingMembers(false)
      }
    }

    loadFamilyMembers()
  }, [])

  // --------------------------------------------------
  // CURRENTLY SELECTED MEMBER
  // --------------------------------------------------

  const selectedMember = familyMembers.find(
    (member) => member.id === selectedMemberId
  )

  return (
    <div className="app">

      {/* ----------------------------------------------
          TOP NAVIGATION
      ---------------------------------------------- */}

      <div className="app-nav">

        <button
          type="button"
          className={page === 'timeline' ? 'active' : ''}
          onClick={() => setPage('timeline')}
        >
          Timeline
        </button>

        <button
          type="button"
          className={page === 'reminders' ? 'active' : ''}
          onClick={() => setPage('reminders')}
        >
          Reminders
        </button>

      </div>

      {/* ----------------------------------------------
          PROFILE TEST SELECTOR

          IMPORTANT:
          This is ONLY for testing Aprajita's
          standalone branch.

          In the final Family Health Hub this will
          come from the actual selected profile.
      ---------------------------------------------- */}

      <div className="profile-test-section">

        <div className="profile-test-label">
          CURRENT FAMILY MEMBER
        </div>

        {loadingMembers ? (
          <div className="profile-test-message">
            Loading family members...
          </div>
        ) : familyMembers.length === 0 ? (
          <div className="profile-test-message error">
            {errorMessage || 'No family members found.'}
          </div>
        ) : (
          <div className="profile-selector">

            <label htmlFor="family-member-select">
              Viewing health information for:
            </label>

            <select
              id="family-member-select"
              value={selectedMemberId}
              onChange={(event) =>
                setSelectedMemberId(event.target.value)
              }
            >
              {familyMembers.map((member) => (
                <option
                  key={member.id}
                  value={member.id}
                >
                  {member.name}
                  {member.relation
                    ? ` — ${member.relation}`
                    : ''}
                </option>
              ))}
            </select>

          </div>
        )}

      </div>

      {/* ----------------------------------------------
          SELECTED MEMBER INFORMATION
      ---------------------------------------------- */}

      {selectedMember && (
        <div className="selected-member-banner">
          <strong>
            {selectedMember.name}
          </strong>

          {selectedMember.relation && (
            <span>
              {selectedMember.relation}
            </span>
          )}
        </div>
      )}

      {/* ----------------------------------------------
          PAGE
      ---------------------------------------------- */}

      {!loadingMembers &&
        selectedMemberId &&
        (page === 'timeline' ? (
          <Timeline
            familyMemberId={selectedMemberId}
          />
        ) : (
          <Reminders
            familyMemberId={selectedMemberId}
          />
        ))}

    </div>
  )
}

export default App