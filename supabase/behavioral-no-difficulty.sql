-- Behavioral questions do not have a difficulty level.
-- This migration makes the difficulty column nullable and clears it for all
-- existing behavioral questions.

-- 1. Drop NOT NULL constraint on difficulty
ALTER TABLE questions ALTER COLUMN difficulty DROP NOT NULL;

-- 2. Null out difficulty for all behavioral questions
UPDATE questions
SET difficulty = NULL
WHERE question_type = 'behavioral';

-- 3. Enforce the rule at the database level:
--    technical questions must have a difficulty; behavioral must not
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_difficulty_required;
ALTER TABLE questions ADD CONSTRAINT questions_difficulty_required CHECK (
  (question_type = 'technical'  AND difficulty IS NOT NULL) OR
  (question_type = 'behavioral' AND difficulty IS NULL)
);
