import { useState, useEffect, useRef } from 'react'
import './App.css'

const WORKOUT_TYPES = [
  'Upper Body - Shoulder',
  'Upper Body - Chest',
  'Lower Body - Legs',
  'Lower Body + Back',
  'Cardio',
]

const DIFFICULTY = ['Easy', 'Ok', 'Difficult']

const DEFAULT_EXERCISES = [
  'Bench Press', 'Incline Bench Press', 'Decline Bench Press', 'Chest Fly', 'Cable Fly',
  'Overhead Press', 'Lateral Raise', 'Front Raise', 'Rear Delt Fly', 'Arnold Press',
  'Squat', 'Leg Press', 'Lunges', 'Leg Curl', 'Leg Extension', 'Calf Raise',
  'Deadlift', 'Romanian Deadlift', 'Bent Over Row', 'Lat Pulldown', 'Pull Up', 'Cable Row',
  'Bicep Curl', 'Hammer Curl', 'Tricep Pushdown', 'Skull Crusher', 'Dips',
  'Treadmill', 'Elliptical', 'Cycling', 'Rowing', 'Stairmaster',
]

const emptyExercise = (isCardio) => isCardio
  ? { id: Date.now() + Math.random(), name: '', time: '', inclination: '', comments: '' }
  : { id: Date.now() + Math.random(), name: '', sets: '3', reps: '10', weight: '', difficulty: 'Ok' }

function ExerciseNameInput({ value, onChange, suggestions, placeholder }) {
  const [open, setOpen] = useState(false)
  const [filtered, setFiltered] = useState([])
  const ref = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('touchstart', handleClick)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('touchstart', handleClick)
    }
  }, [])

  function handleInput(e) {
    const val = e.target.value
    onChange(val)
    if (val.trim()) {
      const matches = suggestions.filter(s => s.toLowerCase().includes(val.toLowerCase()))
      setFiltered(matches)
      setOpen(matches.length > 0)
    } else {
      setOpen(false)
    }
  }

  function pick(name) {
    onChange(name)
    setOpen(false)
  }

  return (
    <div ref={ref} className="autocomplete-wrap">
      <input
        placeholder={placeholder}
        value={value}
        onChange={handleInput}
        onFocus={() => {
          if (value.trim()) {
            const matches = suggestions.filter(s => s.toLowerCase().includes(value.toLowerCase()))
            setFiltered(matches)
            setOpen(matches.length > 0)
          }
        }}
        autoComplete="off"
      />
      {open && (
        <ul className="autocomplete-list">
          {filtered.slice(0, 6).map(name => (
            <li key={name} onMouseDown={() => pick(name)} onTouchEnd={() => pick(name)}>
              {name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function App() {
  const [date, setDate] = useState(today())
  const [workoutType, setWorkoutType] = useState(WORKOUT_TYPES[0])
  const [exercises, setExercises] = useState([emptyExercise(false)])
  const [sessions, setSessions] = useState(() => {
    const saved = localStorage.getItem('sessions')
    return saved ? JSON.parse(saved) : []
  })
  const [expanded, setExpanded] = useState(() => new Set())
  const [editingId, setEditingId] = useState(null)
  const formRef = useRef(null)

  const isCardio = workoutType === 'Cardio'

  const allExerciseNames = [...new Set([
    ...DEFAULT_EXERCISES,
    ...sessions.flatMap(s => s.exercises.map(e => e.name.trim())).filter(Boolean)
  ])]

  const sortedSessions = [...sessions].sort((a, b) => b.date.localeCompare(a.date))

  useEffect(() => {
    localStorage.setItem('sessions', JSON.stringify(sessions))
  }, [sessions])

  useEffect(() => {
    setExercises([emptyExercise(isCardio)])
  }, [isCardio])

  function today() {
    return new Date().toISOString().split('T')[0]
  }

  function updateExercise(id, field, value) {
    setExercises(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e))
  }

  function addExercise() {
    setExercises(prev => [...prev, emptyExercise(isCardio)])
  }

  function removeExercise(id) {
    setExercises(prev => prev.filter(e => e.id !== id))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const valid = exercises.filter(e => e.name.trim())
    if (valid.length === 0) return
    if (editingId) {
      setSessions(prev => prev.map(s => s.id === editingId ? { id: editingId, date, type: workoutType, exercises: valid } : s))
      setEditingId(null)
    } else {
      const newSession = { id: Date.now(), date, type: workoutType, exercises: valid }
      setSessions(prev => [newSession, ...prev])
      setExpanded(prev => new Set([...prev, newSession.id]))
    }
    setExercises([emptyExercise(isCardio)])
  }

  function startEdit(session) {
    setDate(session.date)
    setWorkoutType(session.type)
    setExercises(session.exercises.map(e => ({ ...e, id: Date.now() + Math.random() })))
    setEditingId(session.id)
    formRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  function cancelEdit() {
    setEditingId(null)
    setDate(today())
    setWorkoutType(WORKOUT_TYPES[0])
    setExercises([emptyExercise(false)])
  }

  function deleteSession(id) {
    if (!window.confirm('Delete this workout?')) return
    setSessions(prev => prev.filter(s => s.id !== id))
  }

  function toggleExpanded(id) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function getPrevWeight(exerciseName, sessionId) {
    const idx = sessions.findIndex(s => s.id === sessionId)
    for (let i = idx + 1; i < sessions.length; i++) {
      const match = sessions[i].exercises.find(
        e => e.name.trim().toLowerCase() === exerciseName.trim().toLowerCase()
      )
      if (match && match.weight !== '') return Number(match.weight)
    }
    return null
  }

  function WeightTag({ current, prev }) {
    if (prev === null || current === '') return null
    const curr = Number(current)
    if (curr > prev) return <span className="tag tag-up">↑</span>
    if (curr < prev) return <span className="tag tag-down">↓</span>
    return <span className="tag tag-same">=</span>
  }

  return (
    <div className="app">
      <h1>Workout Logger</h1>

      <form ref={formRef} onSubmit={handleSubmit}>
        <div className="card">
          <div className="session-header">
            <div className="form-group">
              <label>Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Workout Type</label>
              <select value={workoutType} onChange={e => setWorkoutType(e.target.value)}>
                {WORKOUT_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="card">
          <h2>{isCardio ? 'Activities' : 'Exercises'}</h2>
          {exercises.map((ex, i) => (
            <div key={ex.id} className="exercise-row">
              <div className="exercise-index">{i + 1}</div>
              <div className="exercise-fields">
                <ExerciseNameInput
                  value={ex.name}
                  onChange={val => updateExercise(ex.id, 'name', val)}
                  suggestions={allExerciseNames}
                  placeholder={isCardio ? 'Activity name' : 'Exercise name'}
                />
                {isCardio ? (
                  <>
                    <div className="row">
                      <div className="form-group">
                        <label>Time (min)</label>
                        <input type="number" placeholder="30" value={ex.time} onChange={e => updateExercise(ex.id, 'time', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>Inclination</label>
                        <input type="number" placeholder="0" value={ex.inclination} onChange={e => updateExercise(ex.id, 'inclination', e.target.value)} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Comments</label>
                      <input placeholder="Notes..." value={ex.comments} onChange={e => updateExercise(ex.id, 'comments', e.target.value)} />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="row">
                      <div className="form-group">
                        <label>Sets</label>
                        <input type="number" placeholder="3" value={ex.sets} onChange={e => updateExercise(ex.id, 'sets', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>Reps</label>
                        <input type="number" placeholder="10" value={ex.reps} onChange={e => updateExercise(ex.id, 'reps', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>Weight (kg)</label>
                        <input type="number" placeholder="0" value={ex.weight} onChange={e => updateExercise(ex.id, 'weight', e.target.value)} />
                      </div>
                    </div>
                    <div className="diff-row">
                      {DIFFICULTY.map(d => (
                        <button key={d} type="button"
                          className={`diff-btn diff-${d.toLowerCase()} ${ex.difficulty === d ? 'active' : ''}`}
                          onClick={() => updateExercise(ex.id, 'difficulty', d)}
                        >{d}</button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              {exercises.length > 1 && (
                <button type="button" className="remove-btn" onClick={() => removeExercise(ex.id)}>×</button>
              )}
            </div>
          ))}
          <button type="button" className="add-exercise-btn" onClick={addExercise}>+ Add {isCardio ? 'Activity' : 'Exercise'}</button>
        </div>

        <div className="form-actions">
          <button type="submit" className="save-btn">{editingId ? 'Update Workout' : 'Save Workout'}</button>
          {editingId && <button type="button" className="cancel-btn" onClick={cancelEdit}>Cancel</button>}
        </div>
      </form>

      <div className="card">
        <h2>History</h2>
        {sortedSessions.length === 0 ? (
          <p className="empty">No workouts logged yet.</p>
        ) : (
          sortedSessions.map(session => {
            const isOpen = expanded.has(session.id)
            const sessionIsCardio = session.type === 'Cardio'
            return (
              <div key={session.id} className="session-item">
                <div className="session-row">
                  <button type="button" className="session-toggle" onClick={() => toggleExpanded(session.id)}>
                    <div className="session-meta">
                      <span className="session-date">{session.date}</span>
                      <span className="session-type-badge">{session.type}</span>
                      <span className="session-count">{session.exercises.length} exercise{session.exercises.length !== 1 ? 's' : ''}</span>
                    </div>
                    <span className="toggle-icon">{isOpen ? '▲' : '▼'}</span>
                  </button>
                  <div className="session-actions">
                    <button type="button" className="action-btn edit-btn" onClick={() => startEdit(session)}>✏</button>
                    <button type="button" className="action-btn delete-btn" onClick={() => deleteSession(session.id)}>🗑</button>
                  </div>
                </div>

                {isOpen && (
                  <table className="history-table">
                    <thead>
                      <tr>
                        {sessionIsCardio ? (
                          <>
                            <th className="col-name">Activity</th>
                            <th className="col-sr">Min</th>
                            <th className="col-kg">Incl</th>
                            <th className="col-comments">Notes</th>
                          </>
                        ) : (
                          <>
                            <th className="col-name">Exercise</th>
                            <th className="col-sr">S×R</th>
                            <th className="col-kg">kg</th>
                            <th className="col-feel">Feel</th>
                            <th className="col-delta">Δ</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {session.exercises.map((ex, i) => {
                        if (sessionIsCardio) {
                          return (
                            <tr key={i}>
                              <td className="col-name">{ex.name}</td>
                              <td className="col-sr">{ex.time || '—'}</td>
                              <td className="col-kg">{ex.inclination || '—'}</td>
                              <td className="col-comments">{ex.comments || '—'}</td>
                            </tr>
                          )
                        }
                        const prev = getPrevWeight(ex.name, session.id)
                        return (
                          <tr key={i}>
                            <td className="col-name">{ex.name}</td>
                            <td className="col-sr">{ex.sets && ex.reps ? `${ex.sets}×${ex.reps}` : ex.sets || ex.reps || '—'}</td>
                            <td className="col-kg">{ex.weight || '—'}</td>
                            <td className="col-feel">
                              {ex.difficulty && <span className={`diff-label diff-${ex.difficulty.toLowerCase()}`}>{ex.difficulty}</span>}
                            </td>
                            <td className="col-delta"><WeightTag current={ex.weight} prev={prev} /></td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
