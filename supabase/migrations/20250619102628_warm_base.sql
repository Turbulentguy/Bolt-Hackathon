/*
  # Create search history table

  1. New Tables
    - `search_history`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `query` (text, the search query)
      - `paper_title` (text, title of the found paper)
      - `paper_authors` (text, authors of the paper)
      - `paper_summary` (text, AI-generated summary)
      - `paper_pdf_url` (text, PDF link)
      - `paper_arxiv_url` (text, ArXiv link)
      - `paper_published_date` (text, publication date)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `search_history` table
    - Add policy for authenticated users to read/write their own history
*/

CREATE TABLE IF NOT EXISTS search_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  query text NOT NULL,
  paper_title text NOT NULL,
  paper_authors text,
  paper_summary text NOT NULL,
  paper_pdf_url text,
  paper_arxiv_url text,
  paper_published_date text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own search history"
  ON search_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own search history"
  ON search_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own search history"
  ON search_history
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS search_history_user_id_created_at_idx 
  ON search_history(user_id, created_at DESC);