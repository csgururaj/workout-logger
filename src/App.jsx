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

const emptyExercise = () => ({ id: Date.now() + Math.random(), name: '', sets: '3', reps: '10', weight: '', difficulty: 'Ok' })

export default function App() {
  const [date, setDate] = useState(today())
  const [workoutType, setWorkoutType] = useState(WORKOUT_TYPES[0])
  const [exercises, setExercises] = useState([emptyExercise()])
  const [sessions, setSessions] = useState(() => {
    const saved = localStorage.getItem('sessions')
    return saved ? JSON.parse(saved) : []
  })

  useEffect(() => {
    localStorage.setItem('sessions', JSON.stringify(sessions))
  }, [sessions])

  function today() {
    return new Date().toISOString().split('T')[0]
  }

  function updateExercise(id, field, value) {
    setExercises(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e))
  }

  function addExercise() {
    setExercises(prev => [...prev, emptyExercise()])
  }

  function removeExercise(id) {
    setExercises(prev => prev.filter(e => e.id !== id))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const valid = exercises.filter(e => e.name.trim())
    if (valid.length === 0) return
    setSessions(prev => [{ id: Date.now(), date, type: workoutType, exercises: valid }, ...prev])
    setExercises([emptyExercise()])
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
          <h2>Exercises</h2>
          {exercises.map((ex, i) => (
            <div key={ex.id} className="exercise-row">
              <div className="exercise-index">{i + 1}</div>
              <div className="exercise-fields">
                <div className="form-group">
                  <input
                    placeholder="Exercise name"
                    value={ex.name}
                    onChange={e => updateExercise(ex.id, 'name', e.target.value)}
                  />
                </div>
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
              </div>
              {exercises.length > 1 && (
                <button type="button" className="remove-btn" onClick={() => removeExercise(ex.id)}>×</button>
              )}
            </div>
          ))}
          <button type="button" className="add-exercise-btn" onClick={addExercise}>+ Add Exercise</button>
        </div>

        <button type="submit" className="save-btn">Save Workout</button>
      </form>

      {/* History */}
      <div className="card">
        <h2>History</h2>
        {sessions.length === 0 ? (
          <p className="empty">No workouts logged yet.</p>
        ) : (
          sessions.map(session => (
            <div key={session.id} className="session-item">
              <div className="session-meta">
                <span className="session-date">{session.date}</span>
                <span className="session-type-badge">{session.type}</span>
              </div>
              <table className="history-table">
                <thead>
                  <tr>
                    <th className="col-name">Exercise</th>
                    <th className="col-sr">S×R</th>
                    <th className="col-kg">kg</th>
                    <th className="col-feel">Feel</th>
                    <th className="col-delta">Δ</th>
                  </tr>
                </thead>
                <tbody>
                  {session.exercises.map((ex, i) => {
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
          ))
        )}
      </div>
    </div>
  )
}
