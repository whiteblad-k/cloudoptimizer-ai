import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { dbGet, dbRun } from "./db";
import { getOAuth2Client } from "./googleApis";

const JWT_SECRET = process.env.JWT_SECRET || "cloudoptimizer_secret_key_2026";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    google_id: string;
    email: string;
    nombre: string;
    avatar_url: string;
    plan: "FREE" | "PRO";
  };
  accessToken?: string;
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const sessionCookie = req.cookies?.cloudoptimizer_session || req.headers.authorization?.replace("Bearer ", "");

    if (!sessionCookie) {
      return res.status(401).json({ error: "No autenticado. Por favor inicia sesión con Google." });
    }

    const decoded = jwt.verify(sessionCookie, JWT_SECRET) as { userId: string; sessionId: string };

    const sessionRow = await dbGet<any>(
      `SELECT s.*, u.google_id, u.email, u.nombre, u.avatar_url, u.plan 
       FROM sessions s 
       JOIN users u ON s.user_id = u.id 
       WHERE s.id = ?`,
      [decoded.sessionId]
    );

    if (!sessionRow) {
      return res.status(401).json({ error: "Sesión inválida o expirada." });
    }

    let accessToken = sessionRow.access_token;

    // Check if token expired and refresh if possible
    if (Date.now() >= sessionRow.expires_at && sessionRow.refresh_token) {
      try {
        const oauth2Client = getOAuth2Client();
        oauth2Client.setCredentials({ refresh_token: sessionRow.refresh_token });
        const { credentials } = await oauth2Client.refreshAccessToken();

        if (credentials.access_token) {
          accessToken = credentials.access_token;
          const newExpiresAt = credentials.expiry_date || Date.now() + 3600 * 1000;
          await dbRun(
            `UPDATE sessions SET access_token = ?, expires_at = ? WHERE id = ?`,
            [accessToken, newExpiresAt, sessionRow.id]
          );
        }
      } catch (refreshErr) {
        console.error("Token refresh error:", refreshErr);
      }
    }

    req.user = {
      id: sessionRow.user_id,
      google_id: sessionRow.google_id,
      email: sessionRow.email,
      nombre: sessionRow.nombre,
      avatar_url: sessionRow.avatar_url,
      plan: sessionRow.plan || "FREE",
    };
    req.accessToken = accessToken;

    next();
  } catch (err) {
    return res.status(401).json({ error: "Token de sesión no válido." });
  }
}

export function checkPlanLimits(limitType: "CHAT" | "REPORT") {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    if (req.user.plan === "PRO") {
      return next(); // Pro plan has no limits
    }

    const currentMonth = new Date().toISOString().slice(0, 7); // e.g. '2026-08'
    const userId = req.user.id;

    // Fetch or create usage limit record for this month
    let usageRow = await dbGet<any>(
      `SELECT * FROM usage_limits WHERE user_id = ? AND mes = ?`,
      [userId, currentMonth]
    );

    if (!usageRow) {
      const limitId = "lim_" + Math.random().toString(36).slice(2, 11);
      await dbRun(
        `INSERT INTO usage_limits (id, user_id, mes, consultas_ia_usadas, informes_usados) VALUES (?, ?, ?, 0, 0)`,
        [limitId, userId, currentMonth]
      );
      usageRow = { consultas_ia_usadas: 0, informes_usados: 0 };
    }

    if (limitType === "CHAT") {
      const MAX_FREE_CHAT = 3;
      if (usageRow.consultas_ia_usadas >= MAX_FREE_CHAT) {
        return res.status(403).json({
          limitReached: true,
          limitType: "CHAT",
          message: `Has alcanzado el límite de tu Plan Gratuito (${MAX_FREE_CHAT} consultas por mes). Pásate a Plan Pro para consultas ilimitadas con Gemini.`,
          currentUsage: usageRow.consultas_ia_usadas,
          maxAllowed: MAX_FREE_CHAT,
        });
      }
      // Increment usage count
      await dbRun(
        `UPDATE usage_limits SET consultas_ia_usadas = consultas_ia_usadas + 1 WHERE user_id = ? AND mes = ?`,
        [userId, currentMonth]
      );
    } else if (limitType === "REPORT") {
      const MAX_FREE_REPORTS = 1;
      if (usageRow.informes_usados >= MAX_FREE_REPORTS) {
        return res.status(403).json({
          limitReached: true,
          limitType: "REPORT",
          message: `Has alcanzado el límite de tu Plan Gratuito (${MAX_FREE_REPORTS} informe por mes). Hazte Pro para informes ilimitados.`,
          currentUsage: usageRow.informes_usados,
          maxAllowed: MAX_FREE_REPORTS,
        });
      }
      // Increment usage count
      await dbRun(
        `UPDATE usage_limits SET informes_usados = informes_usados + 1 WHERE user_id = ? AND mes = ?`,
        [userId, currentMonth]
      );
    }

    next();
  };
}
