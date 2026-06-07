/*
  # Create Reviews Table

  ## Summary
  Creates the `reviews` table for storing user feedback submitted from the Results Screen
  of the Clash of English mini app.

  ## New Tables

  ### `reviews`
  - `id` (uuid, primary key) — auto-generated unique identifier
  - `user_name` (text) — display name of the reviewer
  - `stars` (integer, 1–5) — star rating
  - `tags` (text[]) — array of selected quick-feedback tags
  - `comment` (text) — optional free-text review
  - `created_at` (timestamptz) — submission timestamp

  ## Security
  - RLS enabled on `reviews`
  - Authenticated users can INSERT their own reviews
  - Authenticated users can SELECT all reviews (leaderboard/social display)
  - No UPDATE or DELETE policies (reviews are immutable once submitted)
*/

CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name text NOT NULL DEFAULT '',
  stars integer NOT NULL CHECK (stars >= 1 AND stars <= 5),
  tags text[] NOT NULL DEFAULT '{}',
  comment text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can insert reviews"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view all reviews"
  ON reviews FOR SELECT
  TO authenticated
  USING (true);
