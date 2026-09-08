CREATE TABLE workspace_records (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES account_users(id),
  project_id TEXT REFERENCES upload_projects(id),
  kind TEXT NOT NULL,
  name TEXT NOT NULL,
  payload_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX idx_workspace_records_user_project ON workspace_records(user_id, project_id, kind);
