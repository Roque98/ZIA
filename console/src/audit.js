export async function audit(db, event) {
  await db.query(
    `INSERT INTO audit_events
      (actor_user_id, actor_email, action, entity_type, entity_id, ip, user_agent, detail)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb)`,
    [
      event.actorUserId || null,
      event.actorEmail || null,
      event.action,
      event.entityType || null,
      event.entityId || null,
      event.ip || null,
      (event.userAgent || "").slice(0, 300) || null,
      JSON.stringify(event.detail || {}),
    ],
  );
}

export function csvCell(value) {
  const s = value == null ? "" : String(value);
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function toCsv(rows) {
  const header = [
    "occurred_at",
    "actor_email",
    "action",
    "entity_type",
    "entity_id",
    "ip",
    "user_agent",
    "detail",
  ];
  const lines = [header.join(",")];
  for (const row of rows) {
    lines.push(
      [
        row.occurred_at instanceof Date ? row.occurred_at.toISOString() : row.occurred_at,
        row.actor_email,
        row.action,
        row.entity_type,
        row.entity_id,
        row.ip,
        row.user_agent,
        typeof row.detail === "string" ? row.detail : JSON.stringify(row.detail ?? {}),
      ]
        .map(csvCell)
        .join(","),
    );
  }
  return lines.join("\n") + "\n";
}
