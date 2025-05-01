export interface Session {
  id: number;
  description: string;
  duration_minutes: number;
  evaluation_minutes: number;
  popup_name: string;
  popup_description: string;
  popup_start_time: number | null; // seconds from session start
  popup_duration: number | null; // seconds
  popup_remind_time: number | null; // seconds, when to show reminder
  created_at: string;
}

export interface Question {
  id: string;
  session_id: number;
  question: string;
  choices: string[];
  correct_answer: string;
  created_at: string;
}

export interface SessionWithQuestions extends Session {
  questions: Question[];
} 