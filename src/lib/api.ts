import { createClient } from '@supabase/supabase-js';
import { Session, Question, SessionWithQuestions } from '@/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Session operations
export async function getSessions(): Promise<Session[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .order('id');
  
  if (error) throw error;
  return data;
}

export async function getSession(id: number): Promise<Session | null> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function updateSession(
  id: number,
  session: Partial<Omit<Session, 'id' | 'created_at'>>
): Promise<Session> {
  const { data, error } = await supabase
    .from('sessions')
    .update(session)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getSessionWithQuestions(sessionId: number): Promise<SessionWithQuestions | null> {
  // Get session details
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (sessionError) throw sessionError;
  if (!session) return null;

  // Get questions for the session
  const { data: questions, error: questionsError } = await supabase
    .from('questions')
    .select('*')
    .eq('session_id', sessionId);

  if (questionsError) throw questionsError;

  return {
    ...session,
    questions: questions || [],
  };
}

// Question operations
export async function createQuestion(question: Omit<Question, 'id' | 'created_at'>): Promise<Question> {
  const { data, error } = await supabase
    .from('questions')
    .insert([question])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateQuestion(
  id: string,
  question: Partial<Omit<Question, 'id' | 'created_at'>>
): Promise<Question> {
  const { data, error } = await supabase
    .from('questions')
    .update(question)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteQuestion(id: string): Promise<void> {
  const { error } = await supabase
    .from('questions')
    .delete()
    .eq('id', id);

  if (error) throw error;
} 