import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useQuestionStore, Question } from './questionStore'

interface SessionState {
  scores: boolean[][]  // Array of arrays, each inner array contains scores for one session
  startTime: number | null
  endTime: number | null
  sessionDurations: number[] // Duration in minutes for each session
  timeLeftPerSession: number[] // Time left in seconds for each session
  addAnswers: (sessionId: number, answers: Record<string, string>) => Promise<void>
  getSessionScores: (sessionId: number) => boolean[]
  getAllScores: () => boolean[][]
  getTotalScore: () => number
  getCompletionTime: () => number
  setSessionDuration: (sessionId: number, duration: number) => void
  setTimeLeft: (sessionId: number, timeLeft: number) => void
  resetSession: () => void
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      scores: [[], [], [], []], // Initialize with empty arrays for all 4 sessions
      startTime: null,
      endTime: null,
      sessionDurations: [7, 7, 7, 7], // Default 7 minutes per session, added session 4
      timeLeftPerSession: [420, 420, 420, 420], // Default 7 minutes in seconds, added session 4

      setSessionDuration: (sessionId: number, duration: number) => {
        const currentState = get()
        const newDurations = [...currentState.sessionDurations]
        newDurations[sessionId - 1] = duration
        set({ sessionDurations: newDurations })
      },

      setTimeLeft: (sessionId: number, timeLeft: number) => {
        const currentState = get()
        const newTimeLeft = [...currentState.timeLeftPerSession]
        newTimeLeft[sessionId - 1] = timeLeft
        set({ timeLeftPerSession: newTimeLeft })
      },

      addAnswers: async (sessionId: number, answers: Record<string, string>) => {
        try {
          const { getQuestions } = useQuestionStore.getState()
          const questions = await getQuestions()
          const sessionQuestions = questions.filter((q: Question) => q.sessionId === sessionId)
          
          if (sessionQuestions.length === 0) {
            console.error('No questions found for session:', sessionId)
            return
          }

          console.log('Session questions:', sessionQuestions)
          console.log('Submitted answers:', answers)

          const sessionScores = sessionQuestions.map(question => {
            const isCorrect = answers[question.id] === question.correctAnswer
            console.log(`Question ${question.id}:`, {
              submitted: answers[question.id],
              correct: question.correctAnswer,
              isCorrect
            })
            return isCorrect
          })

          const currentState = get()
          const newScores = [...(currentState.scores ?? [[], [], [], []])]
          newScores[sessionId - 1] = sessionScores

          // Initialize start time if this is the first answer
          if (currentState.startTime === null) {
            set({ startTime: Date.now() })
          }

          // Set end time if this is the last session
          if (sessionId === 4) {
            set({ endTime: Date.now() })
          }

          console.log('Setting new scores:', newScores)
          set({ scores: newScores })
        } catch (error) {
          console.error('Error in addAnswers:', error)
          throw error
        }
      },

      getSessionScores: (sessionId: number) => {
        const currentState = get()
        const scores = currentState.scores ?? [[], [], [], []]
        return scores[sessionId - 1] || []
      },

      getAllScores: () => {
        const currentState = get()
        return currentState.scores ?? [[], [], [], []]
      },

      getTotalScore: () => {
        const currentState = get()
        const scores = currentState.scores ?? [[], [], [], []]
        const total = scores.flat().filter(Boolean).length
        console.log('Getting total score:', total)
        return total
      },

      getCompletionTime: () => {
        const currentState = get()
        if (!currentState.startTime || !currentState.endTime) return 0
        return Math.floor((currentState.endTime - currentState.startTime) / 1000) // Convert to seconds
      },

      resetSession: () => {
        set({
          scores: [[], [], [], []],
          startTime: null,
          endTime: null,
          sessionDurations: [7, 7, 7, 7],
          timeLeftPerSession: [420, 420, 420, 420]
        })
      }
    }),
    {
      name: 'session-storage'
    }
  )
) 