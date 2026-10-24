CREATE TABLE users(id TEXT PRIMARY KEY, email TEXT NOT NULL, name TEXT NOT NULL);
CREATE TABLE sessions(token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), expires_at INTEGER NOT NULL);
CREATE INDEX sessions_expiry ON sessions(expires_at);
CREATE TABLE oauth_states(state TEXT PRIMARY KEY, verifier TEXT NOT NULL, expires_at INTEGER NOT NULL);
CREATE TABLE tasks(user_id TEXT NOT NULL REFERENCES users(id), id TEXT NOT NULL, title TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('todo','doing','done')), priority INTEGER NOT NULL DEFAULT 0, due TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, PRIMARY KEY(user_id,id));
CREATE TABLE ai_usage(user_id TEXT NOT NULL, period INTEGER NOT NULL, count INTEGER NOT NULL, PRIMARY KEY(user_id,period));
