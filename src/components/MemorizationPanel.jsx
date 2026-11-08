import { useMemo, useState } from 'react'
import { useQuran } from '../context/QuranContext'
import { useStudy } from '../context/StudyContext'
import { calculateDailyGoalProgress, getNextReviewInterval, buildQuizPrompt } from '../utils/memorization'

function MemorizationPanel() {
  const { verses, selectedSurah } = useQuran()
  const { getVerseProgress, setVerseProgress, progress, bookmarks } = useStudy()
  const [goal, setGoal] = useState(10)
  const [quizMode, setQuizMode] = useState(false)
  const [quizIndex, setQuizIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState('')
  const [quizScore, setQuizScore] = useState(0)
  const [quizComplete, setQuizComplete] = useState(false)

  const progressStats = useMemo(() => {
    const completed = Object.values(progress).filter((value) => value === 'memorized').length
    const learning = Object.values(progress).filter((value) => value === 'learning').length
    const bookmarksCount = Object.keys(bookmarks).length
    return { completed, learning, bookmarksCount, percent: calculateDailyGoalProgress(completed, goal) }
  }, [progress, bookmarks, goal])

  const reviewQueue = useMemo(() => {
    return verses
      .filter((verse) => getVerseProgress(selectedSurah.number, verse.ayahNo) !== 'memorized')
      .slice(0, 6)
      .map((verse) => ({ ...verse, stage: getVerseProgress(selectedSurah.number, verse.ayahNo) === 'learning' ? 1 : 0, interval: getNextReviewInterval(getVerseProgress(selectedSurah.number, verse.ayahNo) === 'learning' ? 1 : 0) }))
  }, [verses, selectedSurah.number, getVerseProgress])

  const quizData = useMemo(() => {
    if (!verses.length) return null
    const promptVerse = verses[Math.min(quizIndex, verses.length - 1)]
    return buildQuizPrompt(promptVerse, verses)
  }, [verses, quizIndex])

  const handleAdvanceQuiz = () => {
    if (!quizData) return
    if (quizIndex + 1 >= verses.length) {
      setQuizComplete(true)
      return
    }
    setQuizIndex((value) => value + 1)
    setSelectedAnswer('')
  }

  const handleAnswer = (value) => {
    setSelectedAnswer(value)
    if (value === quizData?.answer) setQuizScore((score) => score + 1)
  }

  const handleResetQuiz = () => {
    setQuizMode(false)
    setQuizIndex(0)
    setQuizScore(0)
    setQuizComplete(false)
    setSelectedAnswer('')
  }

  const handleMarkMemorized = (verse) => {
    setVerseProgress(selectedSurah.number, verse.ayahNo, 'memorized')
  }

  return (
    <div className="memorization-panel">
      <div className="memorization-header">
        <div>
          <h3>Memorization Dashboard</h3>
          <p>Track daily goals, review items, and quick quiz practice.</p>
        </div>
        <button className="memorization-toggle" onClick={() => setQuizMode((value) => !value)}>{quizMode ? 'Hide Quiz' : 'Start Quiz'}</button>
      </div>

      <div className="memorization-stats">
        <div className="stat-card">
          <span className="stat-label">Daily Goal</span>
          <strong>{progressStats.percent}%</strong>
          <input type="number" min="1" value={goal} onChange={(event) => setGoal(Number(event.target.value) || 1)} />
        </div>
        <div className="stat-card">
          <span className="stat-label">Memorized</span>
          <strong>{progressStats.completed}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">Learning</span>
          <strong>{progressStats.learning}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">Bookmarks</span>
          <strong>{progressStats.bookmarksCount}</strong>
        </div>
      </div>

      <div className="review-queue">
        <h4>Review Queue</h4>
        {reviewQueue.length ? reviewQueue.map((verse) => (
          <div className="review-item" key={verse.ayahNo}>
            <div>
              <strong>{verse.ayahNo}</strong> {verse.arabic1 || verse.english}
            </div>
            <div className="review-actions">
              <span>{verse.interval}d review</span>
              <button onClick={() => handleMarkMemorized(verse)}>✓</button>
            </div>
          </div>
        )) : <p>No review items right now.</p>}
      </div>

      {quizMode && (
        <div className="quiz-panel">
          <h4>Quick Quiz</h4>
          {!quizComplete ? (
            <>
              <p className="quiz-prompt">{quizData?.prompt}</p>
              <div className="quiz-options">
                {quizData?.options.map((option) => (
                  <button key={option} className={`quiz-option ${selectedAnswer === option ? 'selected' : ''}`} onClick={() => handleAnswer(option)}>{option}</button>
                ))}
              </div>
              <div className="quiz-footer">
                <span>Score: {quizScore}</span>
                <button onClick={handleAdvanceQuiz} disabled={!selectedAnswer}>Next</button>
              </div>
            </>
          ) : (
            <div className="quiz-complete">
              <p>Quiz complete! Final score: {quizScore}/{Math.max(1, verses.length)}</p>
              <button onClick={handleResetQuiz}>Restart Quiz</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default MemorizationPanel
