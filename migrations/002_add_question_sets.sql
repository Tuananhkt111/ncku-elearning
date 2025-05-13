-- Create new tables
CREATE TABLE questions_set (
    id serial primary key,
    image text not null,
    set_name text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

CREATE TABLE questions_set_link (
    id uuid default uuid_generate_v4() primary key,
    set_id integer not null references questions_set(id),
    question_id uuid not null references questions(id),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(set_id, question_id)
);

CREATE TABLE session_set_link (
    id uuid default uuid_generate_v4() primary key,
    session_id integer not null references sessions(id),
    set_id integer not null references questions_set(id),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(session_id, set_id)
);

-- Migrate existing data
-- 1. Create a questions set for each session's existing image
INSERT INTO questions_set (image, set_name)
SELECT description, 'Set A from Session ' || id
FROM sessions
WHERE description != '';

-- 2. Create links between questions and their new sets
WITH session_sets AS (
    SELECT s.id as session_id, qs.id as set_id
    FROM sessions s
    JOIN questions_set qs ON qs.set_name = 'Set A from Session ' || s.id
)
INSERT INTO questions_set_link (set_id, question_id)
SELECT ss.set_id, q.id
FROM questions q
JOIN session_sets ss ON ss.session_id = q.session_id;

-- 3. Create session-set links
WITH session_sets AS (
    SELECT s.id as session_id, qs.id as set_id
    FROM sessions s
    JOIN questions_set qs ON qs.set_name = 'Set A from Session ' || s.id
)
INSERT INTO session_set_link (session_id, set_id)
SELECT session_id, set_id
FROM session_sets;

-- 4. Remove the description column from sessions
ALTER TABLE sessions DROP COLUMN description;

-- 5. Remove the session_id from questions as it's now handled through questions_set_link
ALTER TABLE questions DROP COLUMN session_id;

-- Enable RLS
ALTER TABLE questions_set ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions_set_link ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_set_link ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON questions_set
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON questions_set
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all users" ON questions_set_link
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON questions_set_link
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all users" ON session_set_link
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON session_set_link
    FOR INSERT WITH CHECK (auth.role() = 'authenticated'); 