-- Add unique constraint to user_test_answer table
ALTER TABLE user_test_answer
ADD CONSTRAINT unique_user_session UNIQUE (user_id, session_id); 