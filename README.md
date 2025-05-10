# NCKU E-Learning Platform

An interactive learning platform that allows users to participate in a 3-part test with controlled interruptions and evaluations.

## Features

- 3 consecutive test sessions with timed evaluations
- Interactive pop-up interruptions
- Multiple-choice questions
- Automatic scoring
- Admin interface for question management
- Session progress tracking
- Final results analysis

## Technical Stack

- Next.js 14 with TypeScript
- Chakra UI for styling
- Zustand for state management
- Supabase for database
- js-cookie for cookie management

## Setup Instructions

1. Clone the repository
2. Install dependencies:
```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory with the following variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_ADMIN_SECRET=your_admin_secret
   ```

4. Set up Supabase:
   - Create a new Supabase project
   - Create the following tables:
     ```sql
     -- Sessions table
     create table sessions (
       id serial primary key,
       description text not null default '',
       duration_minutes integer not null default 7,
       evaluation_minutes integer not null default 3,
       popup_name text default '',
       popup_description text default '',
       popup_start_time integer, -- time in seconds from session start
       popup_duration integer, -- duration in seconds
       popup_remind_time integer, -- time in seconds when to show reminder, null for no reminder
       created_at timestamp with time zone default timezone('utc'::text, now()) not null,
       check (id between 1 and 3) -- Ensure id is between 1 and 3
     );

     -- Questions table
     create table questions (
       id uuid default uuid_generate_v4() primary key,
       session_id integer not null references sessions(id),
       question text not null,
       choices text[] not null,
       correct_answer text not null,
       created_at timestamp with time zone default timezone('utc'::text, now()) not null
     );

     -- Evaluation Questions table
     create table evaluation_questions (
       id uuid default uuid_generate_v4() primary key,
       description text not null,
       created_at timestamp with time zone default timezone('utc'::text, now()) not null
     );

     -- Evaluation Variables table
     create table evaluation_variables (
       id uuid default uuid_generate_v4() primary key,
       question_id uuid not null references evaluation_questions(id) on delete cascade,
       variable_name text not null,
       created_at timestamp with time zone default timezone('utc'::text, now()) not null,
       unique(question_id, variable_name)
     );

     -- Evaluation Suggested Answers table
     create table evaluation_suggested_answers (
       id uuid default uuid_generate_v4() primary key,
       variable_id uuid not null references evaluation_variables(id) on delete cascade,
       answer_text text not null,
       order_number integer not null,
       created_at timestamp with time zone default timezone('utc'::text, now()) not null,
       unique(variable_id, order_number)
     );

     -- Insert default sessions
     insert into sessions (
       id,
       description,
       popup_name,
       popup_description,
       popup_start_time,
       popup_duration,
       popup_remind_time
     ) values
       (1, '', '', '', null, null, null), -- No popup session
       (2, '', '', '', 120, 60, null),    -- Popup after 2 minutes for 1 minute
       (3, '', '', '', 0, 420, 300);      -- Immediate popup for 7 minutes with reminder at 5 minutes
     ```

5. Run the development server:
   ```