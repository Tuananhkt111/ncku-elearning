import { create } from 'zustand'
import { supabase } from '../supabase'

export interface Question {
  id: string
  question: string
  choices: string[]
  correctAnswer: string
}

interface QuestionState {
  questions: Question[]
  isLoading: boolean
  hasInitialized: boolean
  addQuestion: (question: Question) => Promise<void>
  getQuestions: () => Promise<Question[]>
  updateQuestion: (question: Question) => Promise<void>
  deleteQuestion: (id: string) => Promise<void>
  fetchQuestions: () => Promise<void>
}

export const useQuestionStore = create<QuestionState>()((set, get) => ({
  questions: [],
  isLoading: false,
  hasInitialized: false,

  fetchQuestions: async () => {
    // If already loading, wait for the current fetch
    if (get().isLoading) {
      return;
    }

    // If already initialized and has data, no need to fetch again
    if (get().hasInitialized && get().questions.length > 0) {
      return;
    }

    try {
      set({ isLoading: true });
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform from snake_case to camelCase
      const questions = data.map(q => ({
        id: q.id,
        question: q.question,
        choices: q.choices,
        correctAnswer: q.correct_answer,
      }));

      set({ questions, hasInitialized: true });
    } catch (error) {
      console.error('Error fetching questions:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  addQuestion: async (question: Question) => {
    try {
      set({ isLoading: true });
      const { data, error } = await supabase
        .from('questions')
        .insert([{
          question: question.question,
          choices: question.choices,
          correct_answer: question.correctAnswer,
        }])
        .select();

      if (error) throw error;

      // Update local state immediately with the new question
      const newQuestion = {
        id: data[0].id,
        question: data[0].question,
        choices: data[0].choices,
        correctAnswer: data[0].correct_answer,
      };
      
      set(state => ({
        questions: [newQuestion, ...state.questions]
      }));
    } catch (error) {
      console.error('Error adding question:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  getQuestions: async () => {
    if (!get().hasInitialized) {
      await get().fetchQuestions();
    }
    return get().questions;
  },

  updateQuestion: async (question: Question) => {
    try {
      set({ isLoading: true });
      const { data, error } = await supabase
        .from('questions')
        .update({
          question: question.question,
          choices: question.choices,
          correct_answer: question.correctAnswer,
        })
        .eq('id', question.id)
        .select();

      if (error) throw error;

      // Update the question in local state immediately
      set(state => ({
        questions: state.questions.map(q => 
          q.id === question.id ? {
            id: data[0].id,
            question: data[0].question,
            choices: data[0].choices,
            correctAnswer: data[0].correct_answer,
          } : q
        )
      }));
    } catch (error) {
      console.error('Error updating question:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteQuestion: async (id: string) => {
    try {
      set({ isLoading: true });
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Remove the question from local state immediately
      set(state => ({
        questions: state.questions.filter(q => q.id !== id)
      }));
    } catch (error) {
      console.error('Error deleting question:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
})); 