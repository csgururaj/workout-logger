import { useState, useEffect } from 'react'
import './App.css'

const WORKOUT_TYPES = [
  'Upper Body - Shoulder',
  'Upper Body - Chest',
  'Lower Body - Legs',
  'Lower Body + Back',
  'Cardio',
]

const DIFFICULTY = ['Easy', 'Ok', 'Difficult']

const emptyExercise = (isCardio) => isCardio
  ? { id: Date.now() + Math.random(), name: '', time: '', inclination: '', comments: '' }
  : { id: Date.now() + Math.random(), name: '', sets: '3', reps: '10', weight: '', difficulty: 'Ok' }

export default function App() {
  const [date, setDate] = useState(today())
  const [workoutType, setWorkoutType] = useState(WORKOUT_TYPES[0])
  const [exercises, setExercises] = useState([emptyExercise(false)])
  const [sessions, setSessions] = useState(() => {
    const saved = localStorage.getItem('sessions')
    return saved ? JSON.parse(saved) : []
  })

  const isCardio = workoutType === 'Cardio'

  const pastExerciseNames = [...new Set(
    sessions.flatMap(s => s.exercises.map(e => e.name.trim())).filter(Boolean)
  )]

  useEffect(() => {
    localStorage.setItem('sessions', JSON.stringify(sessions))
  }, [sessions])

  // Reset exercises when switching cardio <-> non-cardio
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
    setSessions(prev => [{ id: Date.now(), date, type: workoutType, exercises: valid }, ...prev])
    setExercises([emptyExercise(isCardio)])
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

      <datalist id="exercise-names">
        {pastExerciseNames.map(name => <option key={name} value={name} />)}
      </datalist>

      <form onSubmit={handleSubmit}>
        {/* Session Header */}
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

        {/* Exercises */}
        <div className="card">
          <h2>{isCardio ? 'Activities' : 'Exercises'}</h2>
          {exercises.map((ex, i) => (
            <div key={ex.id} className="exercise-row">
              <div className="exercise-index">{i + 1}</div>
              <div className="exercise-fields">
                <div className="form-group">
                  <input
                    list="exercise-names"
                    placeholder={isCardio ? 'Activity name' : 'Exercise name'}
                    value={ex.name}
                    onChange={e => updateExercise(ex.id, 'name', e.target.value)}
                  />
                </div>

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
                        <button
                          key={d}
                          type="button"
                          className={`diff-btn diff-${d.toLowerCase()} ${ex.difficulty === d ? 'active' : ''}`}
                          onClick={() => updateExercise(ex.id, 'difficulty', d)}
                        >
                          {d}
                        </button>
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

        <button type="submit" className="save-btn">Save Workout</button>
      </form>

      {/* History */}
      <div className="card">
        <h2>History</h2>
        {sessions.length === 0 ? (
          <p className="empty">No workouts logged yet.</p>
        ) : (
          sessions.map(session => {
            const sessionIsCardio = session.type === 'Cardio'
            return (
              <div key={session.id} className="session-item">
                <div className="session-meta">
                  <span className="session-date">{session.date}</span>
                  <span className="session-type-badge">{session.type}</span>
                </div>
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
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
