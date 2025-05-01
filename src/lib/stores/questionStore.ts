import { create } from 'zustand'
import { supabase } from '../supabase'

export interface Question {
  id: string
  sessionId: number
  question: string
  choices: string[]
  correctAnswer: string
}

interface QuestionState {
  questions: Question[]
  addQuestion: (question: Question) => Promise<void>
  getQuestions: () => Promise<Question[]>
  updateQuestion: (question: Question) => Promise<void>
  deleteQuestion: (id: string) => Promise<void>
  getCurrentQuestion: (sessionId: number) => Promise<Question | undefined>
  fetchQuestions: () => Promise<void>
}

export const useQuestionStore = create<QuestionState>()((set, get) => ({
  questions: [],

  fetchQuestions: async () => {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .order('session_id', { ascending: true })

    if (error) {
      console.error('Error fetching questions:', error)
      return
    }

    // Transform from snake_case to camelCase
    const questions = data.map(q => ({
      id: q.id,
      sessionId: q.session_id,
      question: q.question,
      choices: q.choices,
      correctAnswer: q.correct_answer,
    }))

    set({ questions })
  },

  addQuestion: async (question: Question) => {
    const { error } = await supabase
      .from('questions')
      .insert([{
        session_id: question.sessionId,
        question: question.question,
        choices: question.choices,
        correct_answer: question.correctAnswer,
      }])

    if (error) {
      console.error('Error adding question:', error)
      return
    }

    await get().fetchQuestions()
  },

  getQuestions: async () => {
    await get().fetchQuestions()
    return get().questions
  },

  updateQuestion: async (question: Question) => {
    const { error } = await supabase
      .from('questions')
      .update({
        session_id: question.sessionId,
        question: question.question,
        choices: question.choices,
        correct_answer: question.correctAnswer,
      })
      .eq('id', question.id)

    if (error) {
      console.error('Error updating question:', error)
      return
    }

    await get().fetchQuestions()
  },

  deleteQuestion: async (id: string) => {
    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting question:', error)
      return
    }

    await get().fetchQuestions()
  },

  getCurrentQuestion: async (sessionId: number) => {
    await get().fetchQuestions()
    return get().questions.find(q => q.sessionId === sessionId)
  },
})) 