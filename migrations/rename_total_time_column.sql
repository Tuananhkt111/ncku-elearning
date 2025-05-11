-- Rename the column from total_time_ms to total_time
ALTER TABLE user_test_answer 
RENAME COLUMN total_time_ms TO total_time;

-- Update any existing data to convert from milliseconds to seconds
UPDATE user_test_answer 
SET total_time = total_time / 1000 
WHERE total_time > 1000; -- Only convert values that appear to be in milliseconds 