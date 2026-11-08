export function calculateDailyGoalProgress(completed, goal) {
  const safeGoal = Number(goal) || 0
  const safeCompleted = Math.max(0, Number(completed) || 0)
  if (safeGoal <= 0) return 100
  return Math.min(100, Math.round((safeCompleted / safeGoal) * 100))
}

export function getNextReviewInterval(stage) {
  const intervals = { 0: 1, 1: 3, 2: 7, 3: 14 }
  return intervals[Math.min(3, Math.max(0, Number(stage) || 0))] || 1
}

export function buildQuizPrompt(verse, pool = []) {
  if (!verse) return null
  const options = [verse.english]
  const extras = pool.filter((item) => item && item.english && item.english !== verse.english)
  while (options.length < 4 && extras.length) {
    const item = extras.shift()
    if (item && !options.includes(item.english)) options.push(item.english)
  }
  return {
    prompt: verse.arabic1 || verse.english,
    answer: verse.english,
    options: options.sort(() => Math.random() - 0.5),
  }
}

export function getNextRepeatProgress(currentProgress, targetCount) {
  const safeCurrent = Math.max(0, Number(currentProgress) || 0)
  const safeTarget = Math.max(1, Number(targetCount) || 1)
  const nextProgress = safeCurrent + 1
  if (nextProgress <= safeTarget) {
    return { nextProgress, shouldContinue: true }
  }
  return { nextProgress: 0, shouldContinue: false }
}
