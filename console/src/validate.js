const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function asUuidList(value) {
  const list = Array.isArray(value) ? value : value ? [value] : [];
  return [...new Set(list.map((v) => String(v).trim()).filter((v) => UUID.test(v)))];
}

export function parseTags(raw) {
  const tags = [
    ...new Set(
      String(raw || "")
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];
  if (tags.length > 12) return { error: "Máximo 12 etiquetas." };
  for (const tag of tags) {
    if (!/^[a-z0-9_-]{1,24}$/.test(tag)) {
      return { error: `Etiqueta no válida: ${tag}. Usa letras, números, guion o guion bajo.` };
    }
  }
  return { tags };
}

export function parseDevice(body) {
  const name = String(body.name || "").trim();
  const rustdeskId = String(body.rustdesk_id || "").trim();
  const notes = String(body.notes || "").trim();
  if (!name || name.length > 80) return { error: "El nombre es obligatorio (máximo 80 caracteres)." };
  if (!/^[A-Za-z0-9_-]{4,32}$/.test(rustdeskId)) {
    return { error: "El ID de RustDesk debe tener de 4 a 32 letras, números, guion o guion bajo." };
  }
  if (notes.length > 2000) return { error: "Las notas no pueden pasar de 2000 caracteres." };
  const tags = parseTags(body.tags);
  if (tags.error) return tags;
  const accessPassword = String(body.access_password || "");
  if (accessPassword && (accessPassword.length < 4 || accessPassword.length > 64)) {
    return { error: "La contraseña de acceso, si la guardas, debe tener entre 4 y 64 caracteres." };
  }
  return {
    name,
    rustdeskId,
    notes,
    tags: tags.tags,
    accessPassword,
    clearPassword: body.clear_password === "1",
    groups: asUuidList(body.group_ids),
    users: asUuidList(body.user_ids),
    userGroups: asUuidList(body.user_group_ids),
  };
}

export function parsePerson(body) {
  const email = String(body.email || "").trim().toLowerCase();
  const displayName = String(body.display_name || "").trim();
  const role = body.role === "admin" ? "admin" : "operator";
  const password = String(body.password || "");
  if (!EMAIL.test(email) || email.length > 200) return { error: "Correo no válido." };
  if (!displayName || displayName.length > 80) return { error: "El nombre es obligatorio." };
  if (password && password.length < 10) return { error: "La contraseña debe tener al menos 10 caracteres." };
  return {
    email,
    displayName,
    role,
    password,
    active: body.active === "1" || body.active === "on",
  };
}

export function parseGroup(body) {
  const name = String(body.name || "").trim();
  const description = String(body.description || "").trim();
  if (!name || name.length > 80) return { error: "El grupo necesita un nombre (máximo 80 caracteres)." };
  if (description.length > 400) return { error: "La descripción es demasiado larga." };
  return { name, description };
}

export const ACTIONS = [
  "login",
  "login_failed",
  "logout",
  "user_create",
  "user_update",
  "user_password_reset",
  "device_create",
  "device_update",
  "device_delete",
  "device_group_delete",
  "permission_grant",
  "permission_revoke",
  "session_start",
  "session_end",
  "session_deeplink",
  "device_password_reveal",
];
