import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Session, Question, QuestionsSet, QuestionsSetLink, SessionSetLink } from '@/types';

const supabase = createClientComponentClient();

interface SessionSetLinkWithSet {
  questions_set: {
    id: number;
    image: string;
    set_name: string;
    created_at: string;
    questions_set_link: Array<{
      question_id: string;
      questions: Question;
    }>;
  };
}

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
      ),
      session_set_link (
        id,
        set_id,
        questions_set (
          id,
          image,
          set_name,
          created_at,
          questions_set_link (
            question_id,
            questions (*)
          )
        )
      )
    `)
    .order('id');

  if (error) throw error;

  // Transform the data to match our types
  return sessions.map(session => ({
    ...session,
    question_sets: session.session_set_link?.map((link: SessionSetLinkWithSet) => ({
      ...link.questions_set,
      questions: link.questions_set.questions_set_link.map(q => q.questions)
    }))
  }));
}

export async function getSession(id: number): Promise<Session | null> {
  const { data: session, error } = await supabase
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
      ),
      session_set_link (
        id,
        set_id,
        questions_set (
          id,
          image,
          set_name,
          created_at,
          questions_set_link (
            question_id,
            questions (*)
          )
        )
      )
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  if (!session) return null;

  return {
    ...session,
    question_sets: session.session_set_link?.map((link: SessionSetLinkWithSet) => ({
      ...link.questions_set,
      questions: link.questions_set.questions_set_link.map(q => q.questions)
    }))
  };
}

export async function updateSession(
  id: number,
  data: Omit<Session, 'id' | 'created_at'>
): Promise<void> {
  const { popups, question_sets, ...sessionData } = data;
  const supabase = createClientComponentClient();

  // Start a transaction
  try {
    // 1. Update basic session data (excluding relationships)
    const { error: sessionError } = await supabase
      .from('sessions')
      .update({
        name: sessionData.name,
        duration_minutes: sessionData.duration_minutes,
        evaluation_minutes: sessionData.evaluation_minutes
      })
      .eq('id', id);

    if (sessionError) throw sessionError;

    // 2. Handle popups
    if (popups !== undefined) {
      // Delete existing popups
      const { error: deletePopupsError } = await supabase
        .from('popups')
        .delete()
        .eq('session_id', id);

      if (deletePopupsError) throw deletePopupsError;

      // Insert new popups if any
      if (popups.length > 0) {
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

    // 3. Handle question sets
    if (question_sets !== undefined) {
      // Get existing session-set links
      const { data: existingLinks, error: linksError } = await supabase
        .from('session_set_link')
        .select('set_id')
        .eq('session_id', id);

      if (linksError) throw linksError;

      // Delete links that are no longer needed
      const newSetIds = question_sets.map(set => set.id);
      const oldSetIds = existingLinks?.map(link => link.set_id) || [];
      const setsToRemove = oldSetIds.filter(setId => !newSetIds.includes(setId));

      if (setsToRemove.length > 0) {
        const { error: deleteLinksError } = await supabase
          .from('session_set_link')
          .delete()
          .eq('session_id', id)
          .in('set_id', setsToRemove);

        if (deleteLinksError) throw deleteLinksError;
      }

      // Add new links
      const linksToAdd = question_sets
        .filter(set => !oldSetIds.includes(set.id))
        .map(set => ({
          session_id: id,
          set_id: set.id
        }));

      if (linksToAdd.length > 0) {
        const { error: addLinksError } = await supabase
          .from('session_set_link')
          .insert(linksToAdd);

        if (addLinksError) throw addLinksError;
      }

      // Update each question set
      for (const set of question_sets) {
        // Update set data
        const { error: setError } = await supabase
          .from('questions_set')
          .update({
            image: set.image,
            set_name: set.set_name
          })
          .eq('id', set.id);

        if (setError) throw setError;

        if (set.questions) {
          // Get existing question links
          const { data: existingQuestionLinks, error: questionLinksError } = await supabase
            .from('questions_set_link')
            .select('question_id')
            .eq('set_id', set.id);

          if (questionLinksError) throw questionLinksError;

          // Delete links that are no longer needed
          const newQuestionIds = set.questions.map(q => q.id);
          const oldQuestionIds = existingQuestionLinks?.map(link => link.question_id) || [];
          const questionsToRemove = oldQuestionIds.filter(qId => !newQuestionIds.includes(qId));

          if (questionsToRemove.length > 0) {
            const { error: deleteQuestionLinksError } = await supabase
              .from('questions_set_link')
              .delete()
              .eq('set_id', set.id)
              .in('question_id', questionsToRemove);

            if (deleteQuestionLinksError) throw deleteQuestionLinksError;
          }

          // Add new question links
          const questionLinksToAdd = set.questions
            .filter(q => !oldQuestionIds.includes(q.id))
            .map(q => ({
              set_id: set.id,
              question_id: q.id
            }));

          if (questionLinksToAdd.length > 0) {
            const { error: addQuestionLinksError } = await supabase
              .from('questions_set_link')
              .insert(questionLinksToAdd);

            if (addQuestionLinksError) throw addQuestionLinksError;
          }

          // Update questions
          for (const question of set.questions) {
            const { error: questionError } = await supabase
              .from('questions')
              .update({
                question: question.question,
                choices: question.choices,
                correct_answer: question.correct_answer
              })
              .eq('id', question.id);

            if (questionError) throw questionError;
          }
        }
      }
    }
  } catch (error) {
    console.error('Error updating session:', error);
    throw error;
  }
}

// Question Set operations
export async function createQuestionSet(set: Omit<QuestionsSet, 'id' | 'created_at'>): Promise<QuestionsSet> {
  const { data, error } = await supabase
    .from('questions_set')
    .insert([set])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateQuestionSet(
  id: number,
  set: Partial<Omit<QuestionsSet, 'id' | 'created_at'>>
): Promise<QuestionsSet> {
  const { data, error } = await supabase
    .from('questions_set')
    .update(set)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
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

// Question Set Link operations
export async function createQuestionSetLink(link: Omit<QuestionsSetLink, 'id' | 'created_at'>): Promise<QuestionsSetLink> {
  const { data, error } = await supabase
    .from('questions_set_link')
    .insert([link])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteQuestionSetLink(setId: number, questionId: string): Promise<void> {
  const { error } = await supabase
    .from('questions_set_link')
    .delete()
    .eq('set_id', setId)
    .eq('question_id', questionId);

  if (error) throw error;
}

// Session Set Link operations
export async function createSessionSetLink(link: Omit<SessionSetLink, 'id' | 'created_at'>): Promise<SessionSetLink> {
  const { data, error } = await supabase
    .from('session_set_link')
    .insert([link])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteSessionSetLink(sessionId: number, setId: number): Promise<void> {
  const { error } = await supabase
    .from('session_set_link')
    .delete()
    .eq('session_id', sessionId)
    .eq('set_id', setId);

  if (error) throw error;
} 