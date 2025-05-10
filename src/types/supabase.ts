export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      evaluation_questions: {
        Row: {
          id: string
          description: string
          created_at: string
        }
        Insert: {
          id?: string
          description: string
          created_at?: string
        }
        Update: {
          id?: string
          description?: string
          created_at?: string
        }
      }
      evaluation_variables: {
        Row: {
          id: string
          question_id: string
          variable_name: string
          created_at: string
        }
        Insert: {
          id?: string
          question_id: string
          variable_name: string
          created_at?: string
        }
        Update: {
          id?: string
          question_id?: string
          variable_name?: string
          created_at?: string
        }
      }
      evaluation_suggested_answers: {
        Row: {
          id: string
          variable_id: string
          answer_text: string
          order_number: number
          created_at: string
        }
        Insert: {
          id?: string
          variable_id: string
          answer_text: string
          order_number: number
          created_at?: string
        }
        Update: {
          id?: string
          variable_id?: string
          answer_text?: string
          order_number?: number
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 