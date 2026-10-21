-- Consola ZIA: usuarios, equipos RustDesk, accesos y auditoría.

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  display_name text NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'operator')),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE sessions (
  token_hash text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  csrf_token text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  ip text,
  user_agent text
);

CREATE TABLE user_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE user_group_members (
  group_id uuid NOT NULL REFERENCES user_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (group_id, user_id)
);

CREATE TABLE device_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rustdesk_id text NOT NULL UNIQUE,
  name text NOT NULL,
  notes text NOT NULL DEFAULT '',
  tags text[] NOT NULL DEFAULT '{}',
  password_nonce bytea,
  password_cipher bytea,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE device_group_members (
  device_id uuid NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES device_groups(id) ON DELETE CASCADE,
  PRIMARY KEY (device_id, group_id)
);

CREATE TABLE device_user_access (
  device_id uuid NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  granted_by uuid REFERENCES users(id) ON DELETE SET NULL,
  granted_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (device_id, user_id)
);

CREATE TABLE device_user_group_access (
  device_id uuid NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES user_groups(id) ON DELETE CASCADE,
  granted_by uuid REFERENCES users(id) ON DELETE SET NULL,
  granted_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (device_id, group_id)
);

CREATE TABLE device_group_user_access (
  device_group_id uuid NOT NULL REFERENCES device_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  granted_by uuid REFERENCES users(id) ON DELETE SET NULL,
  granted_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (device_group_id, user_id)
);

CREATE TABLE device_group_user_group_access (
  device_group_id uuid NOT NULL REFERENCES device_groups(id) ON DELETE CASCADE,
  user_group_id uuid NOT NULL REFERENCES user_groups(id) ON DELETE CASCADE,
  granted_by uuid REFERENCES users(id) ON DELETE SET NULL,
  granted_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (device_group_id, user_group_id)
);

CREATE TABLE remote_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id uuid REFERENCES devices(id) ON DELETE SET NULL,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  rustdesk_id text NOT NULL,
  device_name text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  client_ip text,
  user_agent text,
  end_reason text,
  probe jsonb
);

CREATE TABLE audit_events (
  id bigserial PRIMARY KEY,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  actor_user_id uuid,
  actor_email text,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  ip text,
  user_agent text,
  detail jsonb NOT NULL DEFAULT '{}'
);

CREATE INDEX audit_events_occurred_at_idx ON audit_events (occurred_at DESC);
CREATE INDEX audit_events_action_idx ON audit_events (action);
CREATE INDEX audit_events_actor_idx ON audit_events (actor_email);
CREATE INDEX remote_sessions_started_idx ON remote_sessions (started_at DESC);
CREATE INDEX devices_tags_idx ON devices USING gin (tags);

-- Equipos que un operador puede ver. Un admin no usa esta función.
CREATE OR REPLACE FUNCTION visible_device_ids(p_user uuid)
RETURNS TABLE (device_id uuid)
LANGUAGE sql
STABLE
AS $$
  SELECT d.id
  FROM devices d
  WHERE EXISTS (
    SELECT 1 FROM device_user_access a
    WHERE a.device_id = d.id AND a.user_id = p_user
  )
  OR EXISTS (
    SELECT 1
    FROM device_group_members m
    JOIN device_group_user_access a ON a.device_group_id = m.group_id
    WHERE m.device_id = d.id AND a.user_id = p_user
  )
  OR EXISTS (
    SELECT 1
    FROM device_user_group_access a
    JOIN user_group_members ug ON ug.group_id = a.group_id
    WHERE a.device_id = d.id AND ug.user_id = p_user
  )
  OR EXISTS (
    SELECT 1
    FROM device_group_members m
    JOIN device_group_user_group_access a ON a.device_group_id = m.group_id
    JOIN user_group_members ug ON ug.group_id = a.user_group_id
    WHERE m.device_id = d.id AND ug.user_id = p_user
  );
$$;
