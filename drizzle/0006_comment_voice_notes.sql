ALTER TABLE project_review_comments ADD COLUMN voice_note_id TEXT;

CREATE TABLE IF NOT EXISTS project_comment_voice_notes (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL,
  object_key TEXT NOT NULL UNIQUE,
  content_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  duration_seconds INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (project_id) REFERENCES upload_projects(id)
);

CREATE INDEX IF NOT EXISTS idx_project_comment_voice_notes_project
  ON project_comment_voice_notes(project_id, created_at);
