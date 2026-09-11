ALTER TABLE account_users ADD COLUMN account_status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE account_users ADD COLUMN deletion_scheduled_at INTEGER;

CREATE TABLE staff_members (
  user_id TEXT PRIMARY KEY NOT NULL REFERENCES account_users(id),
  role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  invited_by_user_id TEXT REFERENCES account_users(id),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX idx_staff_members_status_role ON staff_members(status, role);

CREATE TABLE admin_audit_log (
  id TEXT PRIMARY KEY NOT NULL,
  actor_user_id TEXT REFERENCES account_users(id),
  actor_email TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  details_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_admin_audit_log_created ON admin_audit_log(created_at);

CREATE TABLE staff_project_access (
  staff_user_id TEXT NOT NULL REFERENCES account_users(id),
  project_id TEXT NOT NULL REFERENCES upload_projects(id),
  access_level TEXT NOT NULL DEFAULT 'reviewer',
  granted_by_user_id TEXT REFERENCES account_users(id),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (staff_user_id, project_id)
);

CREATE INDEX idx_staff_project_access_project ON staff_project_access(project_id, access_level);
