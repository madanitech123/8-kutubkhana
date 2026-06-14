-- مكتبة المصباح - Phase 3: Data integrity (constraints + one active loan per book)
-- Run after 003_rls_role_based.sql.

-- ---------------------------------------------------------------------------
-- Books: required fields and valid numbers
-- ---------------------------------------------------------------------------

UPDATE ktb_books SET name = 'بدون عنوان' WHERE trim(name) = '';
UPDATE ktb_books SET author = 'غير محدد' WHERE trim(author) = '';
UPDATE ktb_books SET category = 'عام' WHERE trim(category) = '';
UPDATE ktb_books SET cabinet = '-' WHERE trim(cabinet) = '';

UPDATE ktb_books SET parts = 1 WHERE parts IS NULL OR parts < 1;
UPDATE ktb_books SET copies = 1 WHERE copies IS NULL OR copies < 1;

ALTER TABLE ktb_books ADD CONSTRAINT books_name_not_empty
  CHECK (trim(name) <> '');

ALTER TABLE ktb_books ADD CONSTRAINT books_author_not_empty
  CHECK (trim(author) <> '');

ALTER TABLE ktb_books ADD CONSTRAINT books_category_not_empty
  CHECK (trim(category) <> '');

ALTER TABLE ktb_books ADD CONSTRAINT books_cabinet_not_empty
  CHECK (trim(cabinet) <> '');

ALTER TABLE ktb_books ADD CONSTRAINT books_parts_min
  CHECK (parts >= 1);

ALTER TABLE ktb_books ADD CONSTRAINT books_copies_min
  CHECK (copies >= 1);

-- ---------------------------------------------------------------------------
-- Loans: one active loan per book, return_date >= loan_date
-- ---------------------------------------------------------------------------

WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY book_id ORDER BY created_at DESC NULLS LAST) AS rn
  FROM ktb_loans
  WHERE status = 'معار'
),
dupes AS (
  SELECT id FROM ranked WHERE rn > 1
)
UPDATE ktb_loans
SET return_date = COALESCE(loan_date, current_date), status = 'مُرجع'
FROM dupes
WHERE ktb_loans.id = dupes.id;

CREATE UNIQUE INDEX loans_one_active_per_book
  ON ktb_loans (book_id)
  WHERE (status = 'معار');

UPDATE ktb_loans
SET return_date = loan_date
WHERE return_date IS NOT NULL AND loan_date IS NOT NULL AND return_date < loan_date;

ALTER TABLE ktb_loans ADD CONSTRAINT loans_return_after_loan
  CHECK (
    return_date IS NULL
    OR loan_date IS NULL
    OR return_date >= loan_date
  );
