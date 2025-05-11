export interface Popup {
  id: number;
  session_id: number;
  name: string;
  description: string;
  start_time: number; // seconds from session start
  duration: number; // seconds
  created_at: string;
}

export interface Session {
  id: number;
  description: string;
  duration_minutes: number;
  evaluation_minutes: number;
  created_at: string;
  popups?: Popup[];
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