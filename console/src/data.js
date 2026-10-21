import { hashPassword } from "./password.js";
import { audit } from "./audit.js";

export async function withTx(pool, fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function seedAdmin(pool, config) {
  const count = await pool.query("SELECT count(*)::int AS n FROM users");
  if (count.rows[0].n > 0) return { created: false };
  if (!config.seedEmail || !config.seedPassword) {
    return { created: false, reason: "missing_env" };
  }
  const passwordHash = await hashPassword(config.seedPassword);
  const { rows } = await pool.query(
    `INSERT INTO users (email, display_name, password_hash, role)
     VALUES ($1, $2, $3, 'admin')
     RETURNING id, email`,
    [config.seedEmail, config.seedName || "Administrador", passwordHash],
  );
  await audit(pool, {
    actorUserId: rows[0].id,
    actorEmail: rows[0].email,
    action: "user_create",
    entityType: "user",
    entityId: rows[0].id,
    detail: { role: "admin", seed: true },
  });
  return { created: true, email: rows[0].email };
}

const LIKE = (value) => `%${String(value).replace(/[\\%_]/g, (ch) => `\\${ch}`)}%`;

export async function listDevices(db, { user, q = "", groupId = "", tag = "" }) {
  const params = [user.role === "admin", user.id];
  const where = ["($1::bool OR d.id IN (SELECT device_id FROM visible_device_ids($2::uuid)))"];
  if (q) {
    params.push(LIKE(q));
    const i = params.length;
    where.push(
      `(d.name ILIKE $${i} ESCAPE '\\' OR d.rustdesk_id ILIKE $${i} ESCAPE '\\' OR d.notes ILIKE $${i} ESCAPE '\\' OR EXISTS (SELECT 1 FROM unnest(d.tags) t WHERE t ILIKE $${i} ESCAPE '\\'))`,
    );
  }
  if (groupId) {
    params.push(groupId);
    where.push(
      `EXISTS (SELECT 1 FROM device_group_members m WHERE m.device_id = d.id AND m.group_id = $${params.length}::uuid)`,
    );
  }
  if (tag) {
    params.push(tag);
    where.push(`$${params.length} = ANY(d.tags)`);
  }
  const { rows } = await db.query(
    `SELECT d.id, d.rustdesk_id, d.name, d.notes, d.tags,
            (d.password_cipher IS NOT NULL) AS has_password,
            d.updated_at,
            COALESCE((
              SELECT array_agg(g.name ORDER BY g.name)
              FROM device_group_members m
              JOIN device_groups g ON g.id = m.group_id
              WHERE m.device_id = d.id
            ), '{}') AS group_names,
            (SELECT count(*)::int FROM device_user_access a WHERE a.device_id = d.id) AS direct_users,
            (SELECT count(*)::int FROM device_user_group_access a WHERE a.device_id = d.id) AS direct_groups
     FROM devices d
     WHERE ${where.join(" AND ")}
     ORDER BY d.name`,
    params,
  );
  return rows;
}

export async function getDevice(db, id) {
  const { rows } = await db.query(
    `SELECT id, rustdesk_id, name, notes, tags,
            (password_cipher IS NOT NULL) AS has_password,
            password_nonce, password_cipher, created_at, updated_at
     FROM devices WHERE id = $1`,
    [id],
  );
  return rows[0] || null;
}

export async function userCanSeeDevice(db, user, deviceId) {
  if (!user) return false;
  if (user.role === "admin") {
    const { rows } = await db.query("SELECT 1 FROM devices WHERE id = $1", [deviceId]);
    return rows.length > 0;
  }
  const { rows } = await db.query(
    "SELECT 1 FROM visible_device_ids($1::uuid) v WHERE v.device_id = $2::uuid",
    [user.id, deviceId],
  );
  return rows.length > 0;
}

export async function deviceGroupIds(db, deviceId) {
  const { rows } = await db.query(
    "SELECT group_id FROM device_group_members WHERE device_id = $1",
    [deviceId],
  );
  return rows.map((r) => r.group_id);
}

export async function deviceUserIds(db, deviceId) {
  const { rows } = await db.query(
    "SELECT user_id FROM device_user_access WHERE device_id = $1",
    [deviceId],
  );
  return rows.map((r) => r.user_id);
}

export async function deviceUserGroupIds(db, deviceId) {
  const { rows } = await db.query(
    "SELECT group_id FROM device_user_group_access WHERE device_id = $1",
    [deviceId],
  );
  return rows.map((r) => r.group_id);
}

function diff(before, after) {
  const b = new Set(before);
  const a = new Set(after);
  return {
    added: [...a].filter((id) => !b.has(id)),
    removed: [...b].filter((id) => !a.has(id)),
  };
}

export async function saveDevice(pool, { actor, ip, userAgent, existing, fields, access }) {
  return withTx(pool, async (db) => {
    let device;
    if (!existing) {
      const { rows } = await db.query(
        `INSERT INTO devices (rustdesk_id, name, notes, tags, password_nonce, password_cipher, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         RETURNING id, rustdesk_id, name`,
        [
          fields.rustdeskId,
          fields.name,
          fields.notes,
          fields.tags,
          fields.passwordNonce,
          fields.passwordCipher,
          actor.id,
        ],
      );
      device = rows[0];
      await audit(db, {
        actorUserId: actor.id,
        actorEmail: actor.email,
        action: "device_create",
        entityType: "device",
        entityId: device.id,
        ip,
        userAgent,
        detail: { rustdesk_id: device.rustdesk_id, name: device.name, tags: fields.tags },
      });
    } else {
      const { rows } = await db.query(
        `UPDATE devices
         SET rustdesk_id = $2, name = $3, notes = $4, tags = $5,
             password_nonce = $6, password_cipher = $7, updated_at = now()
         WHERE id = $1
         RETURNING id, rustdesk_id, name`,
        [
          existing.id,
          fields.rustdeskId,
          fields.name,
          fields.notes,
          fields.tags,
          fields.passwordNonce,
          fields.passwordCipher,
        ],
      );
      device = rows[0];
      await audit(db, {
        actorUserId: actor.id,
        actorEmail: actor.email,
        action: "device_update",
        entityType: "device",
        entityId: device.id,
        ip,
        userAgent,
        detail: {
          rustdesk_id: device.rustdesk_id,
          name: device.name,
          tags: fields.tags,
          password_changed: fields.passwordChanged,
          password_cleared: fields.passwordCleared,
        },
      });
    }

    await syncLinks(db, {
      actor,
      ip,
      userAgent,
      deviceId: device.id,
      table: "device_group_members",
      column: "group_id",
      before: access.beforeGroups,
      after: access.groups,
      scope: "device_group_membership",
    });
    await syncLinks(db, {
      actor,
      ip,
      userAgent,
      deviceId: device.id,
      table: "device_user_access",
      column: "user_id",
      before: access.beforeUsers,
      after: access.users,
      scope: "device_user",
    });
    await syncLinks(db, {
      actor,
      ip,
      userAgent,
      deviceId: device.id,
      table: "device_user_group_access",
      column: "group_id",
      before: access.beforeUserGroups,
      after: access.userGroups,
      scope: "device_user_group",
    });
    return device;
  });
}

async function syncLinks(db, { actor, ip, userAgent, deviceId, table, column, before, after, scope }) {
  const { added, removed } = diff(before, after);
  for (const id of removed) {
    await db.query(`DELETE FROM ${table} WHERE device_id = $1 AND ${column} = $2`, [deviceId, id]);
    await audit(db, {
      actorUserId: actor.id,
      actorEmail: actor.email,
      action: "permission_revoke",
      entityType: "device",
      entityId: deviceId,
      ip,
      userAgent,
      detail: { scope, subject_id: id },
    });
  }
  for (const id of added) {
    if (scope === "device_group_membership") {
      await db.query(
        `INSERT INTO device_group_members (device_id, group_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [deviceId, id],
      );
    } else {
      await db.query(
        `INSERT INTO ${table} (device_id, ${column}, granted_by) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
        [deviceId, id, actor.id],
      );
    }
    await audit(db, {
      actorUserId: actor.id,
      actorEmail: actor.email,
      action: "permission_grant",
      entityType: "device",
      entityId: deviceId,
      ip,
      userAgent,
      detail: { scope, subject_id: id },
    });
  }
}

export async function deleteDevice(pool, { actor, ip, userAgent, device }) {
  await withTx(pool, async (db) => {
    await db.query("DELETE FROM devices WHERE id = $1", [device.id]);
    await audit(db, {
      actorUserId: actor.id,
      actorEmail: actor.email,
      action: "device_delete",
      entityType: "device",
      entityId: device.id,
      ip,
      userAgent,
      detail: { rustdesk_id: device.rustdesk_id, name: device.name },
    });
  });
}

export async function listDeviceGroups(db) {
  const { rows } = await db.query(
    `SELECT g.id, g.name, g.description,
            (SELECT count(*)::int FROM device_group_members m WHERE m.group_id = g.id) AS devices,
            (SELECT count(*)::int FROM device_group_user_access a WHERE a.device_group_id = g.id) AS users,
            (SELECT count(*)::int FROM device_group_user_group_access a WHERE a.device_group_id = g.id) AS user_groups
     FROM device_groups g
     ORDER BY g.name`,
  );
  return rows;
}

export async function getDeviceGroup(db, id) {
  const { rows } = await db.query("SELECT * FROM device_groups WHERE id = $1", [id]);
  return rows[0] || null;
}

export async function idsOf(db, sql, params) {
  const { rows } = await db.query(sql, params);
  return rows.map((r) => r.id);
}

export async function saveDeviceGroup(pool, { actor, ip, userAgent, existing, name, description, devices, users, userGroups }) {
  return withTx(pool, async (db) => {
    let group = existing;
    if (!group) {
      const { rows } = await db.query(
        `INSERT INTO device_groups (name, description) VALUES ($1, $2) RETURNING id, name`,
        [name, description],
      );
      group = rows[0];
    } else {
      const { rows } = await db.query(
        `UPDATE device_groups SET name = $2, description = $3 WHERE id = $1 RETURNING id, name`,
        [group.id, name, description],
      );
      group = rows[0];
    }

    const beforeDevices = (
      await db.query("SELECT device_id AS id FROM device_group_members WHERE group_id = $1", [group.id])
    ).rows.map((r) => r.id);
    const beforeUsers = (
      await db.query("SELECT user_id AS id FROM device_group_user_access WHERE device_group_id = $1", [group.id])
    ).rows.map((r) => r.id);
    const beforeUserGroups = (
      await db.query(
        "SELECT user_group_id AS id FROM device_group_user_group_access WHERE device_group_id = $1",
        [group.id],
      )
    ).rows.map((r) => r.id);

    await replaceAccess(db, {
      actor,
      ip,
      userAgent,
      entityId: group.id,
      scope: "device_group_membership",
      withGrantor: false,
      deleteSql: "DELETE FROM device_group_members WHERE group_id = $1 AND device_id = $2",
      insertSql:
        "INSERT INTO device_group_members (device_id, group_id) VALUES ($2, $1) ON CONFLICT DO NOTHING",
      before: beforeDevices,
      after: devices,
    });
    await replaceAccess(db, {
      actor,
      ip,
      userAgent,
      entityId: group.id,
      scope: "device_group_user",
      deleteSql: "DELETE FROM device_group_user_access WHERE device_group_id = $1 AND user_id = $2",
      insertSql:
        "INSERT INTO device_group_user_access (device_group_id, user_id, granted_by) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
      before: beforeUsers,
      after: users,
    });
    await replaceAccess(db, {
      actor,
      ip,
      userAgent,
      entityId: group.id,
      scope: "device_group_user_group",
      deleteSql:
        "DELETE FROM device_group_user_group_access WHERE device_group_id = $1 AND user_group_id = $2",
      insertSql:
        "INSERT INTO device_group_user_group_access (device_group_id, user_group_id, granted_by) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
      before: beforeUserGroups,
      after: userGroups,
    });
    return group;
  });
}

async function replaceAccess(db, spec) {
  const { added, removed } = diff(spec.before, spec.after);
  for (const id of removed) {
    await db.query(spec.deleteSql, [spec.entityId, id]);
    await audit(db, {
      actorUserId: spec.actor.id,
      actorEmail: spec.actor.email,
      action: "permission_revoke",
      entityType: "device_group",
      entityId: spec.entityId,
      ip: spec.ip,
      userAgent: spec.userAgent,
      detail: { scope: spec.scope, subject_id: id },
    });
  }
  for (const id of added) {
    const params = spec.withGrantor === false
      ? [spec.entityId, id]
      : [spec.entityId, id, spec.actor.id];
    await db.query(spec.insertSql, params);
    await audit(db, {
      actorUserId: spec.actor.id,
      actorEmail: spec.actor.email,
      action: "permission_grant",
      entityType: "device_group",
      entityId: spec.entityId,
      ip: spec.ip,
      userAgent: spec.userAgent,
      detail: { scope: spec.scope, subject_id: id },
    });
  }
}

export async function deleteDeviceGroup(pool, { actor, ip, userAgent, group }) {
  await withTx(pool, async (db) => {
    await db.query("DELETE FROM device_groups WHERE id = $1", [group.id]);
    await audit(db, {
      actorUserId: actor.id,
      actorEmail: actor.email,
      action: "device_group_delete",
      entityType: "device_group",
      entityId: group.id,
      ip,
      userAgent,
      detail: { name: group.name },
    });
  });
}

export async function listUsers(db) {
  const { rows } = await db.query(
    `SELECT id, email, display_name, role, active, created_at
     FROM users ORDER BY display_name`,
  );
  return rows;
}

export async function listUserGroups(db) {
  const { rows } = await db.query(
    `SELECT g.id, g.name, g.description,
            COALESCE((
              SELECT array_agg(m.user_id)
              FROM user_group_members m
              WHERE m.group_id = g.id
            ), ARRAY[]::uuid[]) AS member_ids
     FROM user_groups g
     ORDER BY g.name`,
  );
  return rows;
}

export async function memberIds(db, groupId) {
  const { rows } = await db.query(
    "SELECT user_id FROM user_group_members WHERE group_id = $1",
    [groupId],
  );
  return rows.map((r) => r.user_id);
}

export function isUniqueViolation(err) {
  return err && err.code === "23505";
}

export async function searchAudit(db, { action = "", actor = "", desde = "", hasta = "", limit = 100, offset = 0 }) {
  const where = [];
  const params = [];
  if (action) {
    params.push(action);
    where.push(`action = $${params.length}`);
  }
  if (actor) {
    params.push(LIKE(actor));
    where.push(`actor_email ILIKE $${params.length} ESCAPE '\\'`);
  }
  if (desde) {
    params.push(desde);
    where.push(`occurred_at >= $${params.length}::date`);
  }
  if (hasta) {
    params.push(hasta);
    where.push(`occurred_at < ($${params.length}::date + interval '1 day')`);
  }
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  params.push(limit);
  params.push(offset);
  const { rows } = await db.query(
    `SELECT id, occurred_at, actor_email, action, entity_type, entity_id, ip, user_agent, detail
     FROM audit_events
     ${clause}
     ORDER BY occurred_at DESC, id DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );
  return rows;
}

export async function countAdmins(db) {
  const { rows } = await db.query(
    "SELECT count(*)::int AS n FROM users WHERE role = 'admin' AND active",
  );
  return rows[0].n;
}
