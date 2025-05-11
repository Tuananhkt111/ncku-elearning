import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Session, Question, SessionWithQuestions } from '@/types';

const supabase = createClientComponentClient();

// Session operations
export async function getSessions(): Promise<Session[]> {
  const { data: sessions, error } = await supabase
    .from('sessions')
    .select(`
      *,
      popups (
        id,
        name,
        description,
        start_time,
        duration,
        created_at
      )
    `)
    .order('id');

  if (error) throw error;
  return sessions;
}

export async function getSession(id: number): Promise<Session | null> {
  const { data, error } = await supabase
    .from('sessions')
    .select(`
      *,
      popups (
        id,
        name,
        description,
        start_time,
        duration,
        created_at
      )
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function updateSession(
  id: number,
  data: Omit<Session, 'id' | 'created_at'>
): Promise<void> {
  const { popups, ...sessionData } = data;

  // Start a transaction
  const { error: sessionError } = await supabase
    .from('sessions')
    .update(sessionData)
    .eq('id', id);

  if (sessionError) throw sessionError;

  // Delete existing popups
  const { error: deleteError } = await supabase
    .from('popups')
    .delete()
    .eq('session_id', id);

  if (deleteError) throw deleteError;

  // Insert new popups if any
  if (popups && popups.length > 0) {
    const popupsToInsert = popups.map(popup => ({
      session_id: id,
      name: popup.name,
      description: popup.description,
      start_time: popup.start_time,
      duration: popup.duration
    }));

    const { error: popupsError } = await supabase
      .from('popups')
      .insert(popupsToInsert);

    if (popupsError) throw popupsError;
  }
}

export async function getSessionWithQuestions(sessionId: number): Promise<SessionWithQuestions | null> {
  // Get session details with popups
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select(`
      *,
      popups (
        id,
        name,
        description,
        start_time,
        duration,
        created_at
      )
    `)
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