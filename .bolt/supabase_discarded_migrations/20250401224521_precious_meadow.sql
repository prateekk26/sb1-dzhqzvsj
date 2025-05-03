/*
  # Fix Interview Question Data
  
  1. Changes
    - Fix the "INT-5" question that has incorrect data
    - The question text and type fields appear to be swapped
    - Correct the competency code and difficulty

  2. Background
    - This fixes a data issue where the question "if someone asked your colleagues to describe you, what would you expect them to say?"
      was incorrectly stored with type in the question field
*/

-- Fix the specific interview question with ID "INT-5"
UPDATE interview_questions
SET 
  question = 'If someone asked your colleagues to describe you, what would you expect them to say?',
  type = 'behavioral',
  difficulty = 'easy',
  primary_competency_code = 'EISA',
  secondary_competency_code = NULL
WHERE 
  question_id = 'INT-5';

-- If the exact question ID doesn't exist but we know the question content is wrong
UPDATE interview_questions
SET 
  type = 'behavioral',
  difficulty = 'easy',
  primary_competency_code = 'EISA',
  secondary_competency_code = NULL
WHERE 
  question = 'easy' AND
  type = 'if someone asked your colleagues to describe you, what would you expect them to say?';

-- In case the question ID exists but with a different format
UPDATE interview_questions
SET 
  question = 'If someone asked your colleagues to describe you, what would you expect them to say?',
  type = 'behavioral',
  difficulty = 'easy',
  primary_competency_code = 'EISA',
  secondary_competency_code = NULL
WHERE 
  question_id ILIKE 'INT-5';