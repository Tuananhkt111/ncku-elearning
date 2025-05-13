export interface Popup {
  id: number;
  session_id: number;
  name: string;
  description: string;
  start_time: number; // seconds from session start
  duration: number; // seconds
  created_at: string;
}

export interface QuestionsSet {
  id: number;
  image: string;
  set_name: string;
  created_at: string;
  questions?: Question[];
}

export interface Session {
  id: number;
  name: string;
  duration_minutes: number;
  evaluation_minutes: number;
  created_at: string;
  popups?: Popup[];
  question_sets?: QuestionsSet[];
}

export interface Question {
  id: string;
  question: string;
  choices: string[];
  correct_answer: string;
  created_at: string;
}

export interface QuestionsSetLink {
  id: string;
  set_id: number;
  question_id: string;
  created_at: string;
}

export interface SessionSetLink {
  id: string;
  session_id: number;
  set_id: number;
  created_at: string;
} 