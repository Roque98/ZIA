import express from "express";
import fs from "node:fs";
import path from "node:path";
import { audit } from "./audit.js";
import { toCsv } from "./audit.js";
import {
  clientIp,
  loginLimited,
  newToken,
  readCookie,
  recordLoginFailure,
  recordLoginSuccess,
  sha256,
} from "./http-util.js";
import { hashPassword, verifyAgainstDummy, verifyPassword } from "./password.js";
import { decryptSecret, encryptSecret } from "./secrets.js";
import { rustdeskDeepLink, serverConfig } from "./deep-link.js";
import { probePeer } from "./rustdesk.js";
import { attachRustDeskProxy } from "./proxy.js";
import {
  countAdmins,
  deleteDevice,
  deleteDeviceGroup,
  deviceGroupIds,
  deviceUserGroupIds,
  deviceUserIds,
  getDevice,
  getDeviceGroup,
  isUniqueViolation,
  listDeviceGroups,
  listDevices,
  listUserGroups,
  listUsers,
  memberIds,
  saveDevice,
  saveDeviceGroup,
  searchAudit,
  seedAdmin,
  userCanSeeDevice,
  withTx,
} from "./data.js";
import { ACTIONS, asUuidList, parseDevice, parseGroup, parsePerson } from "./validate.js";

const AVISOS = {
  "equipo-guardado": "Equipo guardado.",
  "equipo-eliminado": "Equipo eliminado.",
  "grupo-guardado": "Grupo guardado.",
  "grupo-eliminado": "Grupo eliminado.",
  "usuario-guardado": "Usuario guardado.",
  "clave-actualizada": "Contraseña actualizada.",
  "sesion-cerrada": "Sesión remota terminada.",
};

const ROOT = path.join(import.meta.dirname, "..");

export async function createApp(pool, config) {
  await seedAdmin(pool, config);
  const webClientReady =
    Boolean(config.webClientDir) &&
    fs.existsSync(path.join(config.webClientDir, "index.html"));

  const app = express();
  app.disable("x-powered-by");
  if (config.trustProxy) app.set("trust proxy", 1);
  app.set("views", path.join(ROOT, "views"));
  app.set("view engine", "ejs");
  app.locals.webClientReady = webClientReady;
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use("/estaticos", express.static(path.join(ROOT, "public")));
  if (webClientReady) {
    app.use("/cliente-rustdesk", express.static(config.webClientDir));
  }
  app.use((req, res, next) => {
    res.set("X-Content-Type-Options", "nosniff");
    res.set("Referrer-Policy", "same-origin");
    res.set("X-Frame-Options", "SAMEORIGIN");
    next();
  });

  app.use(async (req, res, next) => {
    req.actorIp = clientIp(req, config.trustProxy);
    req.user = null;
    req.sessionCsrf = "";
    const token = readCookie(req, "zia_session");
    if (!token) return next();
    try {
      const { rows } = await pool.query(
        `SELECT s.csrf_token, s.expires_at, u.id, u.email, u.display_name, u.role, u.active
         FROM sessions s JOIN users u ON u.id = s.user_id
         WHERE s.token_hash = $1`,
        [sha256(token)],
      );
      const row = rows[0];
      if (!row || !row.active || new Date(row.expires_at).getTime() < Date.now()) {
        return next();
      }
      req.user = row;
      req.sessionCsrf = row.csrf_token;
      next();
    } catch (err) {
      next(err);
    }
  });

  function render(res, view, data = {}) {
    res.render(view, {
      csrf: res.req.sessionCsrf || "",
      currentUser: res.req.user,
      aviso: AVISOS[res.req.query.aviso] || "",
      webClientReady,
      rustdeskHost: config.publicHost,
      rustdeskKey: config.key,
      serverConfig: serverConfig({ host: config.publicHost, key: config.key }),
      ...data,
    });
  }

  function setSessionCookie(res, token) {
    const parts = [
      `zia_session=${encodeURIComponent(token)}`,
      "HttpOnly",
      "SameSite=Lax",
      "Path=/",
      `Max-Age=${config.sessionHours * 3600}`,
    ];
    if (config.cookieSecure) parts.push("Secure");
    res.setHeader("Set-Cookie", parts.join("; "));
  }

  function clearSessionCookie(res) {
    const parts = ["zia_session=", "HttpOnly", "SameSite=Lax", "Path=/", "Max-Age=0"];
    if (config.cookieSecure) parts.push("Secure");
    res.setHeader("Set-Cookie", parts.join("; "));
  }

  async function openSession(user, ip, userAgent) {
    const token = newToken();
    const csrf = newToken();
    const expires = new Date(Date.now() + config.sessionHours * 3600 * 1000);
    await pool.query(
      `INSERT INTO sessions (token_hash, user_id, csrf_token, expires_at, ip, user_agent)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [sha256(token), user.id, csrf, expires, ip, (userAgent || "").slice(0, 300)],
    );
    return token;
  }

  function requireUser(req, res, next) {
    if (!req.user) {
      const nextUrl = encodeURIComponent(req.originalUrl || "/");
      return res.redirect(`/login?next=${nextUrl}`);
    }
    next();
  }

  function requireAdmin(req, res, next) {
    if (!req.user) return res.redirect("/login");
    if (req.user.role !== "admin") return res.status(403).render("forbidden", { currentUser: req.user, csrf: req.sessionCsrf });
    next();
  }

  function requireCsrf(req, res, next) {
    const sent = String(req.body?._csrf || req.query?._csrf || req.get("x-csrf-token") || "");
    if (!req.sessionCsrf || sent !== req.sessionCsrf) {
      return res.status(403).type("text").send("La sesión del formulario venció. Vuelve a cargar la página.");
    }
    next();
  }

  app.get("/salud", (_req, res) => {
    res.json({ ok: true });
  });

  app.get("/login", (req, res) => {
    if (req.user) return res.redirect("/");
    render(res, "login", { error: "", next: safeNext(req.query.next) });
  });

  app.post("/login", async (req, res, next) => {
    try {
      const email = String(req.body.email || "").trim().toLowerCase();
      const password = String(req.body.password || "");
      const nextUrl = safeNext(req.body.next);
      if (loginLimited(req.actorIp)) {
        return res.status(429).render("login", {
          error: "Demasiados intentos. Espera unos minutos.",
          next: nextUrl,
          csrf: "",
          currentUser: null,
          aviso: "",
        });
      }
      const { rows } = await pool.query(
        "SELECT id, email, display_name, password_hash, role, active FROM users WHERE email = $1",
        [email],
      );
      const user = rows[0];
      const ok = user ? await verifyPassword(password, user.password_hash) : false;
      if (!user) await verifyAgainstDummy(password);
      if (!user || !ok || !user.active) {
        recordLoginFailure(req.actorIp);
        await audit(pool, {
          actorEmail: email.slice(0, 200),
          action: "login_failed",
          entityType: "user",
          ip: req.actorIp,
          userAgent: req.get("user-agent"),
          detail: { active: user ? user.active : null },
        });
        return res.status(401).render("login", {
          error: "Correo o contraseña incorrectos.",
          next: nextUrl,
          csrf: "",
          currentUser: null,
          aviso: "",
        });
      }
      recordLoginSuccess(req.actorIp);
      const token = await openSession(user, req.actorIp, req.get("user-agent"));
      await audit(pool, {
        actorUserId: user.id,
        actorEmail: user.email,
        action: "login",
        entityType: "user",
        entityId: user.id,
        ip: req.actorIp,
        userAgent: req.get("user-agent"),
      });
      setSessionCookie(res, token);
      res.redirect(nextUrl);
    } catch (err) {
      next(err);
    }
  });

  app.post("/logout", requireUser, requireCsrf, async (req, res, next) => {
    try {
      const token = readCookie(req, "zia_session");
      if (token) await pool.query("DELETE FROM sessions WHERE token_hash = $1", [sha256(token)]);
      await audit(pool, {
        actorUserId: req.user.id,
        actorEmail: req.user.email,
        action: "logout",
        entityType: "user",
        entityId: req.user.id,
        ip: req.actorIp,
        userAgent: req.get("user-agent"),
      });
      clearSessionCookie(res);
      res.redirect("/login");
    } catch (err) {
      next(err);
    }
  });

  app.get("/", requireUser, async (req, res, next) => {
    try {
      const q = String(req.query.q || "").trim();
      const groupId = asUuidList(req.query.grupo)[0] || "";
      const tag = String(req.query.etiqueta || "").trim().toLowerCase();
      const devices = await listDevices(pool, { user: req.user, q, groupId, tag });
      const groups = req.user.role === "admin" ? await listDeviceGroups(pool) : await visibleGroups(pool, req.user);
      const tags = [...new Set(devices.flatMap((d) => d.tags || []))].sort();
      render(res, "devices", { devices, groups, tags, q, groupId, tag });
    } catch (err) {
      next(err);
    }
  });

  app.get("/equipos/nuevo", requireAdmin, async (req, res, next) => {
    try {
      render(res, "device-form", await formLookups(pool, blankDevice()));
    } catch (err) {
      next(err);
    }
  });

  app.get("/equipos/:id", requireAdmin, async (req, res, next) => {
    try {
      const device = await getDevice(pool, req.params.id);
      if (!device) return res.status(404).render("not-found", shell(req));
      render(res, "device-form", await formLookups(pool, await hydrate(pool, device)));
    } catch (err) {
      next(err);
    }
  });

  app.post("/equipos", requireAdmin, requireCsrf, (req, res, next) => saveDeviceRoute(req, res, next, null));
  app.post("/equipos/:id", requireAdmin, requireCsrf, async (req, res, next) => {
    const existing = await getDevice(pool, req.params.id);
    if (!existing) return res.status(404).render("not-found", shell(req));
    return saveDeviceRoute(req, res, next, existing);
  });

  async function saveDeviceRoute(req, res, next, existing) {
    try {
      const parsed = parseDevice(req.body);
      if (parsed.error) {
        const draft = draftFrom(parsed, existing);
        return res.status(400).render("device-form", {
          ...(await formLookups(pool, draft)),
          error: parsed.error,
          csrf: req.sessionCsrf,
          currentUser: req.user,
          aviso: "",
          webClientReady,
          rustdeskHost: config.publicHost,
          rustdeskKey: config.key,
          serverConfig: serverConfig({ host: config.publicHost, key: config.key }),
        });
      }
      let passwordNonce = existing?.password_nonce || null;
      let passwordCipher = existing?.password_cipher || null;
      let passwordChanged = false;
      let passwordCleared = false;
      if (parsed.accessPassword) {
        const enc = encryptSecret(parsed.accessPassword, config.deviceSecret);
        passwordNonce = enc.nonce;
        passwordCipher = enc.cipher;
        passwordChanged = true;
      } else if (parsed.clearPassword) {
        passwordNonce = null;
        passwordCipher = null;
        passwordCleared = Boolean(existing?.password_cipher);
      }
      const device = await saveDevice(pool, {
        actor: req.user,
        ip: req.actorIp,
        userAgent: req.get("user-agent"),
        existing,
        fields: {
          rustdeskId: parsed.rustdeskId,
          name: parsed.name,
          notes: parsed.notes,
          tags: parsed.tags,
          passwordNonce,
          passwordCipher,
          passwordChanged,
          passwordCleared,
        },
        access: {
          beforeGroups: existing ? await deviceGroupIds(pool, existing.id) : [],
          beforeUsers: existing ? await deviceUserIds(pool, existing.id) : [],
          beforeUserGroups: existing ? await deviceUserGroupIds(pool, existing.id) : [],
          groups: parsed.groups,
          users: parsed.users,
          userGroups: parsed.userGroups,
        },
      });
      res.redirect(`/equipos/${device.id}?aviso=equipo-guardado`);
    } catch (err) {
      if (isUniqueViolation(err)) {
        return res.status(400).type("text").send("Ese ID de RustDesk ya está registrado.");
      }
      next(err);
    }
  }

  app.post("/equipos/:id/eliminar", requireAdmin, requireCsrf, async (req, res, next) => {
    try {
      const device = await getDevice(pool, req.params.id);
      if (!device) return res.status(404).render("not-found", shell(req));
      await deleteDevice(pool, {
        actor: req.user,
        ip: req.actorIp,
        userAgent: req.get("user-agent"),
        device,
      });
      res.redirect("/?aviso=equipo-eliminado");
    } catch (err) {
      next(err);
    }
  });

  app.get("/grupos", requireAdmin, async (req, res, next) => {
    try {
      render(res, "groups", { groups: await listDeviceGroups(pool) });
    } catch (err) {
      next(err);
    }
  });

  app.get("/grupos/nuevo", requireAdmin, async (req, res, next) => {
    try {
      render(res, "group-form", await groupLookups(pool, blankGroup()));
    } catch (err) {
      next(err);
    }
  });

  app.get("/grupos/:id", requireAdmin, async (req, res, next) => {
    try {
      const group = await getDeviceGroup(pool, req.params.id);
      if (!group) return res.status(404).render("not-found", shell(req));
      render(res, "group-form", await groupLookups(pool, await hydrateGroup(pool, group)));
    } catch (err) {
      next(err);
    }
  });

  app.post("/grupos", requireAdmin, requireCsrf, (req, res, next) => saveGroupRoute(req, res, next, null));
  app.post("/grupos/:id", requireAdmin, requireCsrf, async (req, res, next) => {
    const group = await getDeviceGroup(pool, req.params.id);
    if (!group) return res.status(404).render("not-found", shell(req));
    return saveGroupRoute(req, res, next, group);
  });

  async function saveGroupRoute(req, res, next, existing) {
    try {
      const parsed = parseGroup(req.body);
      if (parsed.error) {
        return res.status(400).type("text").send(parsed.error);
      }
      const group = await saveDeviceGroup(pool, {
        actor: req.user,
        ip: req.actorIp,
        userAgent: req.get("user-agent"),
        existing,
        name: parsed.name,
        description: parsed.description,
        devices: asUuidList(req.body.device_ids),
        users: asUuidList(req.body.user_ids),
        userGroups: asUuidList(req.body.user_group_ids),
      });
      res.redirect(`/grupos/${group.id}?aviso=grupo-guardado`);
    } catch (err) {
      if (isUniqueViolation(err)) return res.status(400).type("text").send("Ya hay un grupo con ese nombre.");
      next(err);
    }
  }

  app.post("/grupos/:id/eliminar", requireAdmin, requireCsrf, async (req, res, next) => {
    try {
      const group = await getDeviceGroup(pool, req.params.id);
      if (!group) return res.status(404).render("not-found", shell(req));
      await deleteDeviceGroup(pool, {
        actor: req.user,
        ip: req.actorIp,
        userAgent: req.get("user-agent"),
        group,
      });
      res.redirect("/grupos?aviso=grupo-eliminado");
    } catch (err) {
      next(err);
    }
  });

  app.get("/usuarios", requireAdmin, async (req, res, next) => {
    try {
      const users = await listUsers(pool);
      const groups = await listUserGroups(pool);
      render(res, "users", { users, groups, error: "" });
    } catch (err) {
      next(err);
    }
  });

  app.post("/usuarios", requireAdmin, requireCsrf, async (req, res, next) => {
    try {
      const parsed = parsePerson(req.body);
      if (parsed.error || !parsed.password) {
        return res.status(400).render("users", {
          users: await listUsers(pool),
          groups: await listUserGroups(pool),
          error: parsed.error || "La contraseña inicial es obligatoria.",
          csrf: req.sessionCsrf,
          currentUser: req.user,
          aviso: "",
          webClientReady,
          rustdeskHost: config.publicHost,
          rustdeskKey: config.key,
          serverConfig: serverConfig({ host: config.publicHost, key: config.key }),
        });
      }
      const passwordHash = await hashPassword(parsed.password);
      const { rows } = await pool.query(
        `INSERT INTO users (email, display_name, password_hash, role, active)
         VALUES ($1,$2,$3,$4,$5) RETURNING id, email`,
        [parsed.email, parsed.displayName, passwordHash, parsed.role, parsed.active],
      );
      await audit(pool, {
        actorUserId: req.user.id,
        actorEmail: req.user.email,
        action: "user_create",
        entityType: "user",
        entityId: rows[0].id,
        ip: req.actorIp,
        userAgent: req.get("user-agent"),
        detail: { email: rows[0].email, role: parsed.role },
      });
      res.redirect("/usuarios?aviso=usuario-guardado");
    } catch (err) {
      if (isUniqueViolation(err)) {
        return res.status(400).type("text").send("Ese correo ya existe.");
      }
      next(err);
    }
  });

  app.post("/usuarios/:id", requireAdmin, requireCsrf, async (req, res, next) => {
    try {
      const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [req.params.id]);
      const existing = rows[0];
      if (!existing) return res.status(404).render("not-found", shell(req));
      const parsed = parsePerson({ ...req.body, email: existing.email, password: "" });
      if (parsed.error) return res.status(400).type("text").send(parsed.error);
      const active = req.body.active === "1";
      if (existing.role === "admin" && existing.active && (parsed.role !== "admin" || !active)) {
        if ((await countAdmins(pool)) <= 1) {
          return res.status(400).type("text").send("Tiene que quedar al menos un administrador activo.");
        }
      }
      if (existing.id === req.user.id && !active) {
        return res.status(400).type("text").send("No puedes desactivar tu propio usuario.");
      }
      await pool.query(
        `UPDATE users SET display_name = $2, role = $3, active = $4, updated_at = now() WHERE id = $1`,
        [existing.id, parsed.displayName, parsed.role, active],
      );
      await audit(pool, {
        actorUserId: req.user.id,
        actorEmail: req.user.email,
        action: "user_update",
        entityType: "user",
        entityId: existing.id,
        ip: req.actorIp,
        userAgent: req.get("user-agent"),
        detail: { role: parsed.role, active, display_name: parsed.displayName },
      });
      res.redirect("/usuarios?aviso=usuario-guardado");
    } catch (err) {
      next(err);
    }
  });

  app.post("/usuarios/:id/clave", requireAdmin, requireCsrf, async (req, res, next) => {
    try {
      const password = String(req.body.password || "");
      if (password.length < 10) return res.status(400).type("text").send("La contraseña debe tener al menos 10 caracteres.");
      const { rows } = await pool.query("SELECT id, email FROM users WHERE id = $1", [req.params.id]);
      if (!rows[0]) return res.status(404).render("not-found", shell(req));
      await pool.query("UPDATE users SET password_hash = $2, updated_at = now() WHERE id = $1", [
        rows[0].id,
        await hashPassword(password),
      ]);
      await pool.query("DELETE FROM sessions WHERE user_id = $1", [rows[0].id]);
      await audit(pool, {
        actorUserId: req.user.id,
        actorEmail: req.user.email,
        action: "user_password_reset",
        entityType: "user",
        entityId: rows[0].id,
        ip: req.actorIp,
        userAgent: req.get("user-agent"),
        detail: { email: rows[0].email },
      });
      if (rows[0].id === req.user.id) {
        clearSessionCookie(res);
        return res.redirect("/login");
      }
      res.redirect("/usuarios?aviso=clave-actualizada");
    } catch (err) {
      next(err);
    }
  });

  app.post("/grupos-usuario", requireAdmin, requireCsrf, async (req, res, next) => {
    try {
      const parsed = parseGroup(req.body);
      if (parsed.error) return res.status(400).type("text").send(parsed.error);
      const members = asUuidList(req.body.member_ids);
      await withTx(pool, async (db) => {
        const { rows } = await db.query(
          "INSERT INTO user_groups (name, description) VALUES ($1,$2) RETURNING id",
          [parsed.name, parsed.description],
        );
        for (const userId of members) {
          await db.query(
            "INSERT INTO user_group_members (group_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING",
            [rows[0].id, userId],
          );
        }
      });
      res.redirect("/usuarios?aviso=grupo-guardado");
    } catch (err) {
      if (isUniqueViolation(err)) return res.status(400).type("text").send("Ya hay un grupo con ese nombre.");
      next(err);
    }
  });

  app.post("/grupos-usuario/:id", requireAdmin, requireCsrf, async (req, res, next) => {
    try {
      const parsed = parseGroup(req.body);
      if (parsed.error) return res.status(400).type("text").send(parsed.error);
      const members = asUuidList(req.body.member_ids);
      const before = await memberIds(pool, req.params.id);
      await withTx(pool, async (db) => {
        const updated = await db.query(
          "UPDATE user_groups SET name = $2, description = $3 WHERE id = $1 RETURNING id",
          [req.params.id, parsed.name, parsed.description],
        );
        if (!updated.rows[0]) {
          const err = new Error("not found");
          err.status = 404;
          throw err;
        }
        await db.query("DELETE FROM user_group_members WHERE group_id = $1", [req.params.id]);
        for (const userId of members) {
          await db.query(
            "INSERT INTO user_group_members (group_id, user_id) VALUES ($1,$2)",
            [req.params.id, userId],
          );
        }
      });
      const beforeSet = new Set(before);
      const afterSet = new Set(members);
      if ([...beforeSet].some((id) => !afterSet.has(id)) || [...afterSet].some((id) => !beforeSet.has(id))) {
        await audit(pool, {
          actorUserId: req.user.id,
          actorEmail: req.user.email,
          action: "permission_grant",
          entityType: "user_group",
          entityId: req.params.id,
          ip: req.actorIp,
          userAgent: req.get("user-agent"),
          detail: { scope: "user_group_members", members },
        });
      }
      res.redirect("/usuarios?aviso=grupo-guardado");
    } catch (err) {
      if (err.status === 404) return res.status(404).render("not-found", shell(req));
      if (isUniqueViolation(err)) return res.status(400).type("text").send("Ya hay un grupo con ese nombre.");
      next(err);
    }
  });

  app.get("/auditoria", requireAdmin, async (req, res, next) => {
    try {
      const filters = auditFilters(req);
      const events = await searchAudit(pool, { ...filters, limit: 200, offset: 0 });
      render(res, "audit", { events, filters, actions: ACTIONS });
    } catch (err) {
      next(err);
    }
  });

  app.get("/auditoria.csv", requireAdmin, async (req, res, next) => {
    try {
      const filters = auditFilters(req);
      const events = await searchAudit(pool, { ...filters, limit: 5000, offset: 0 });
      res.set("Content-Type", "text/csv; charset=utf-8");
      res.set("Content-Disposition", "attachment; filename=\"zia-auditoria.csv\"");
      res.send(toCsv(events));
    } catch (err) {
      next(err);
    }
  });

  app.get("/sesion/:id", requireUser, async (req, res, next) => {
    try {
      const device = await loadVisible(pool, req, res);
      if (!device) return;
      const passwordStored = Boolean(device.has_password);
      render(res, "session", {
        device: publicDevice(device),
        passwordStored,
        probe: null,
        remoteSession: null,
      });
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/sesiones", requireUser, requireCsrf, async (req, res, next) => {
    try {
      const device = await getDevice(pool, String(req.body.device_id || ""));
      if (!device || !(await userCanSeeDevice(pool, req.user, device.id))) {
        return res.status(404).json({ error: "Equipo no encontrado." });
      }
      const probe = await probePeer({ url: config.idWsUrl, id: device.rustdesk_id });
      const { rows } = await pool.query(
        `INSERT INTO remote_sessions
          (device_id, user_id, rustdesk_id, device_name, client_ip, user_agent, probe)
         VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb)
         RETURNING id, started_at`,
        [
          device.id,
          req.user.id,
          device.rustdesk_id,
          device.name,
          req.actorIp,
          (req.get("user-agent") || "").slice(0, 300),
          JSON.stringify(publicProbe(probe)),
        ],
      );
      await audit(pool, {
        actorUserId: req.user.id,
        actorEmail: req.user.email,
        action: "session_start",
        entityType: "device",
        entityId: device.id,
        ip: req.actorIp,
        userAgent: req.get("user-agent"),
        detail: {
          remote_session_id: rows[0].id,
          rustdesk_id: device.rustdesk_id,
          name: device.name,
          probe: publicProbe(probe),
        },
      });
      res.json({
        session_id: rows[0].id,
        started_at: rows[0].started_at,
        probe: publicProbe(probe),
        ws_id: `/ws/id?sid=${rows[0].id}`,
        ws_relay: `/ws/relay?sid=${rows[0].id}`,
      });
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/sesiones/:id/fin", requireUser, requireCsrf, async (req, res, next) => {
    try {
      const ended = await endRemoteSession(pool, req.params.id, req.user.id, "user_ended", req);
      if (ended) return res.json(ended);
      const { rows } = await pool.query(
        `SELECT id, started_at, ended_at FROM remote_sessions WHERE id = $1 AND user_id = $2`,
        [req.params.id, req.user.id],
      );
      const row = rows[0];
      if (!row?.ended_at) return res.status(404).json({ error: "Sesión no encontrada." });
      res.json({
        id: row.id,
        ended_at: row.ended_at,
        duration_ms: new Date(row.ended_at).getTime() - new Date(row.started_at).getTime(),
        already_ended: true,
      });
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/sesiones/:id/enlace", requireUser, requireCsrf, async (req, res, next) => {
    try {
      const { rows } = await pool.query(
        `SELECT s.id, s.device_id, d.rustdesk_id, d.password_nonce, d.password_cipher, d.name
         FROM remote_sessions s
         JOIN devices d ON d.id = s.device_id
         WHERE s.id = $1 AND s.user_id = $2 AND s.ended_at IS NULL`,
        [req.params.id, req.user.id],
      );
      const row = rows[0];
      if (!row || !(await userCanSeeDevice(pool, req.user, row.device_id))) {
        return res.status(404).json({ error: "Sesión no encontrada." });
      }
      let password = "";
      if (row.password_cipher) {
        password = decryptSecret(
          { nonce: row.password_nonce, cipher: row.password_cipher },
          config.deviceSecret,
        );
      }
      const link = rustdeskDeepLink({ id: row.rustdesk_id, password, forceRelay: true });
      await audit(pool, {
        actorUserId: req.user.id,
        actorEmail: req.user.email,
        action: "session_deeplink",
        entityType: "device",
        entityId: row.device_id,
        ip: req.actorIp,
        userAgent: req.get("user-agent"),
        detail: { remote_session_id: row.id, rustdesk_id: row.rustdesk_id, included_password: Boolean(password) },
      });
      res.json({
        url: link,
        config: serverConfig({ host: config.publicHost, key: config.key }),
      });
    } catch (err) {
      next(err);
    }
  });

  app.use((err, _req, res, _next) => {
    console.error(err);
    if (res.headersSent) return;
    res.status(500).type("text").send("Error interno.");
  });

  function attach(server) {
    const authorize = async (req, url) => {
      req.actorIp = clientIp(req, config.trustProxy);
      const token = readCookie(req, "zia_session");
      if (!token) return { ok: false };
      const { rows } = await pool.query(
        `SELECT u.id FROM sessions s JOIN users u ON u.id = s.user_id
         WHERE s.token_hash = $1 AND u.active AND s.expires_at > now()`,
        [sha256(token)],
      );
      const user = rows[0];
      const sid = url.searchParams.get("sid") || "";
      if (!user || !sid) return { ok: false };
      const open = await pool.query(
        "SELECT id FROM remote_sessions WHERE id = $1 AND user_id = $2 AND ended_at IS NULL",
        [sid, user.id],
      );
      if (!open.rows[0]) return { ok: false };
      return {
        ok: true,
        onClose: () => endRemoteSession(pool, sid, user.id, "websocket_closed", req),
      };
    };
    attachRustDeskProxy(server, {
      paths: {
        "/ws/id": { target: config.idWsUrl, authorize },
        "/ws/relay": { target: config.relayWsUrl, authorize },
      },
    });
  }

  return { app, attach, webClientReady };
}

async function endRemoteSession(pool, sessionId, userId, reason, req) {
  const { rows } = await pool.query(
    `UPDATE remote_sessions
     SET ended_at = now(), end_reason = $3
     WHERE id = $1 AND user_id = $2 AND ended_at IS NULL
     RETURNING id, device_id, rustdesk_id, device_name, started_at, ended_at`,
    [sessionId, userId, reason],
  );
  const row = rows[0];
  if (!row) return null;
  const durationMs = new Date(row.ended_at).getTime() - new Date(row.started_at).getTime();
  const actor = await pool.query("SELECT email FROM users WHERE id = $1", [userId]);
  await audit(pool, {
    actorUserId: userId,
    actorEmail: actor.rows[0]?.email || null,
    action: "session_end",
    entityType: "device",
    entityId: row.device_id,
    ip: req.actorIp || clientIp(req, false) || null,
    userAgent: req.get?.("user-agent") || req.headers?.["user-agent"],
    detail: {
      remote_session_id: row.id,
      rustdesk_id: row.rustdesk_id,
      name: row.device_name,
      reason,
      duration_ms: durationMs,
    },
  });
  return { id: row.id, ended_at: row.ended_at, duration_ms: durationMs };
}

function publicProbe(probe) {
  return {
    ok: Boolean(probe.ok),
    status: probe.status || "unknown",
    failure: probe.failure || null,
    relay_server: probe.relayServer || "",
    kind: probe.kind || "",
    error: probe.error || "",
  };
}

function publicDevice(device) {
  return {
    id: device.id,
    rustdesk_id: device.rustdesk_id,
    name: device.name,
    notes: device.notes,
    tags: device.tags,
    has_password: device.has_password,
  };
}

async function loadVisible(pool, req, res) {
  const device = await getDevice(pool, req.params.id);
  if (!device || !(await userCanSeeDevice(pool, req.user, device.id))) {
    res.status(404).render("not-found", {
      currentUser: req.user,
      csrf: req.sessionCsrf,
    });
    return null;
  }
  return device;
}

function shell(req) {
  return { currentUser: req.user, csrf: req.sessionCsrf };
}

function safeNext(value) {
  if (typeof value !== "string") return "/";
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "/";
  return value;
}

function auditFilters(req) {
  const action = ACTIONS.includes(req.query.accion) ? req.query.accion : "";
  const actor = String(req.query.actor || "").trim().slice(0, 200);
  const desde = /^\d{4}-\d{2}-\d{2}$/.test(req.query.desde || "") ? req.query.desde : "";
  const hasta = /^\d{4}-\d{2}-\d{2}$/.test(req.query.hasta || "") ? req.query.hasta : "";
  return { action, actor, desde, hasta };
}

function blankDevice() {
  return {
    id: "",
    rustdesk_id: "",
    name: "",
    notes: "",
    tags: [],
    has_password: false,
    group_ids: [],
    user_ids: [],
    user_group_ids: [],
  };
}

async function hydrate(pool, device) {
  return {
    id: device.id,
    rustdesk_id: device.rustdesk_id,
    name: device.name,
    notes: device.notes,
    tags: device.tags,
    has_password: device.has_password,
    group_ids: await deviceGroupIds(pool, device.id),
    user_ids: await deviceUserIds(pool, device.id),
    user_group_ids: await deviceUserGroupIds(pool, device.id),
  };
}

function draftFrom(parsed, existing) {
  return {
    id: existing?.id || "",
    rustdesk_id: parsed.rustdeskId || "",
    name: parsed.name || "",
    notes: parsed.notes || "",
    tags: parsed.tags || [],
    has_password: Boolean(existing?.has_password),
    group_ids: parsed.groups || [],
    user_ids: parsed.users || [],
    user_group_ids: parsed.userGroups || [],
  };
}

async function formLookups(pool, device) {
  const [groups, users, userGroups] = await Promise.all([
    listDeviceGroups(pool),
    listUsers(pool),
    listUserGroups(pool),
  ]);
  return { device, groups, users, userGroups, error: "" };
}

function blankGroup() {
  return { id: "", name: "", description: "", device_ids: [], user_ids: [], user_group_ids: [] };
}

async function hydrateGroup(pool, group) {
  const devices = await pool.query("SELECT device_id FROM device_group_members WHERE group_id = $1", [group.id]);
  const users = await pool.query("SELECT user_id FROM device_group_user_access WHERE device_group_id = $1", [group.id]);
  const userGroups = await pool.query(
    "SELECT user_group_id FROM device_group_user_group_access WHERE device_group_id = $1",
    [group.id],
  );
  return {
    ...group,
    device_ids: devices.rows.map((r) => r.device_id),
    user_ids: users.rows.map((r) => r.user_id),
    user_group_ids: userGroups.rows.map((r) => r.user_group_id),
  };
}

async function groupLookups(pool, group) {
  const devices = await pool.query("SELECT id, name, rustdesk_id FROM devices ORDER BY name");
  const users = await listUsers(pool);
  const userGroups = await listUserGroups(pool);
  return { group, devices: devices.rows, users, userGroups, error: "" };
}

async function visibleGroups(pool, user) {
  const { rows } = await pool.query(
    `SELECT DISTINCT g.id, g.name
     FROM device_groups g
     JOIN device_group_members m ON m.group_id = g.id
     JOIN visible_device_ids($1::uuid) v ON v.device_id = m.device_id
     ORDER BY g.name`,
    [user.id],
  );
  return rows;
}
