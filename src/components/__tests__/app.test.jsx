import { describe, it, expect } from 'vitest'
import { calculateDailyGoalProgress, buildQuizPrompt, getNextRepeatProgress } from '../../utils/memorization'

describe('memorization helpers', () => {
  it('calculates progress percentage safely', () => {
    expect(calculateDailyGoalProgress(5, 10)).toBe(50)
    expect(calculateDailyGoalProgress(0, 0)).toBe(100)
  })

  it('creates a quiz prompt with fallback options', () => {
    const prompt = buildQuizPrompt({ english: 'Test verse', arabic1: 'Arabic text' }, [{ english: 'Wrong 1' }, { english: 'Wrong 2' }])
    expect(prompt.answer).toBe('Test verse')
    expect(prompt.options).toContain('Test verse')
  })

  it('continues a repeat loop until the target count is reached', () => {
    expect(getNextRepeatProgress(0, 3)).toEqual({ nextProgress: 1, shouldContinue: true })
    expect(getNextRepeatProgress(2, 3)).toEqual({ nextProgress: 3, shouldContinue: true })
    expect(getNextRepeatProgress(3, 3)).toEqual({ nextProgress: 0, shouldContinue: false })
  })
})
