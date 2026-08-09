import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

import { dbGet, dbRun, dbAll } from "./server/db";
import {
  generateGoogleAuthUrl,
  exchangeCodeForTokens,
  fetchGoogleUserInfo,
  getDriveStorageQuota,
  getGmailHeavyEmails,
  getDriveOldFiles,
  getPhotosStorageUsage,
} from "./server/googleApis";
import { requireAuth, checkPlanLimits, AuthenticatedRequest } from "./server/middleware";

dotenv.config();

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "cloudoptimizer_secret_key_2026";

app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

// Initialize Google GenAI client (Gemini 2.0 Flash)
const getGenAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "cloudoptimizer-ai-studio",
      },
    },
  });
};

// Health Check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "CloudOptimizer AI", model: "gemini-2.0-flash" });
});

/* ==========================================
   1. AUTHENTICATION ENDPOINTS (GOOGLE OAUTH)
   ========================================== */

const getRedirectUri = (req: any) => {
  const host = process.env.RAILWAY_PUBLIC_DOMAIN 
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    : `${(req.headers["x-forwarded-proto"] as string) || req.protocol || "http"}://${req.get('host')}`;
  return `${host}/auth/google/callback`;
};

// Get Google OAuth URL
app.get("/api/auth/google/url", (req, res) => {
  const redirectUri = getRedirectUri(req);
  const authUrl = generateGoogleAuthUrl(redirectUri);
  res.json({ authUrl, redirectUri });
});

// Google OAuth Callback Handler (Handles both /auth/google/callback and /api/auth/google/callback)
app.get(["/auth/google/callback", "/auth/google/callback/", "/api/auth/google/callback", "/api/auth/google/callback/"], async (req, res) => {
  try {
    const code = req.query.code as string;
    if (!code) {
      return res.status(400).send("Falta el código de autorización de Google.");
    }

    const redirectUri = getRedirectUri(req);

    const tokens = await exchangeCodeForTokens(code, redirectUri);
    if (!tokens.access_token) {
      return res.status(400).send("No se pudo obtener el token de acceso de Google.");
    }

    const googleUser = await fetchGoogleUserInfo(tokens.access_token);
    if (!googleUser.id || !googleUser.email) {
      return res.status(400).send("No se pudieron obtener los datos de perfil del usuario.");
    }

    // Upsert User into SQLite
    const userId = "usr_" + googleUser.id;
    const existingUser = await dbGet<any>(`SELECT * FROM users WHERE google_id = ?`, [googleUser.id]);

    if (!existingUser) {
      await dbRun(
        `INSERT INTO users (id, google_id, email, nombre, avatar_url, plan) VALUES (?, ?, ?, ?, ?, 'FREE')`,
        [userId, googleUser.id, googleUser.email, googleUser.name || "Usuario", googleUser.picture || ""]
      );
    } else {
      await dbRun(
        `UPDATE users SET email = ?, nombre = ?, avatar_url = ? WHERE google_id = ?`,
        [googleUser.email, googleUser.name || "Usuario", googleUser.picture || "", googleUser.id]
      );
    }

    // Save Session
    const sessionId = "ses_" + Math.random().toString(36).slice(2, 11);
    const expiresAt = tokens.expiry_date || Date.now() + 3600 * 1000;

    await dbRun(
      `INSERT INTO sessions (id, user_id, access_token, refresh_token, expires_at) VALUES (?, ?, ?, ?, ?)`,
      [sessionId, userId, tokens.access_token, tokens.refresh_token || "", expiresAt]
    );

    // Sign JWT Cookie
    const sessionToken = jwt.sign({ userId, sessionId }, JWT_SECRET, { expiresIn: "30d" });

    res.cookie("cloudoptimizer_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 3600 * 1000,
    });

    // Close auth popup or redirect to main dashboard
    res.send(`
      <! eradication>
      <html>
        <head><title>Autenticación Exitosa</title></head>
        <body style="background:#020617; color:#fff; font-family:sans-serif; text-align:center; padding-top:50px;">
          <h2>¡Conexión Exitosa con Google!</h2>
          <p>Redirigiendo a CloudOptimizer AI...</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS' }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
        </body>
      </html>
    `);
  } catch (err: any) {
    console.error("OAuth Callback error:", err);
    res.status(500).send(`Error en inicio de sesión con Google: ${err.message}`);
  }
});

// Current User Profile Endpoint
app.get("/api/auth/me", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const currentMonth = new Date().toISOString().slice(0, 7);

    const usageRow = await dbGet<any>(
      `SELECT * FROM usage_limits WHERE user_id = ? AND mes = ?`,
      [user.id, currentMonth]
    );

    res.json({
      user,
      limits: {
        chatUsed: usageRow?.consultas_ia_usadas || 0,
        chatMax: user.plan === "PRO" ? Infinity : 3,
        reportsUsed: usageRow?.informes_usados || 0,
        reportsMax: user.plan === "PRO" ? Infinity : 1,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Logout
app.post("/api/auth/logout", requireAuth, async (req: AuthenticatedRequest, res) => {
  res.clearCookie("cloudoptimizer_session");
  res.json({ success: true });
});

// Upgrade Plan to PRO
app.post("/api/auth/upgrade-pro", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    await dbRun(`UPDATE users SET plan = 'PRO' WHERE id = ?`, [userId]);
    res.json({ success: true, plan: "PRO", message: "¡Felicitaciones! Ahora tienes acceso Plan Pro Ilimitado." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/* ==========================================
   2. REAL GOOGLE APIS ENDPOINTS
   ========================================== */

// Real Drive Storage Quota
app.get("/api/storage/quota", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const quotaData = await getDriveStorageQuota(req.accessToken!);
    res.json(quotaData);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "No se pudo obtener el uso de almacenamiento real." });
  }
});

// Real Gmail Heavy Emails
app.get("/api/gmail/heavy-emails", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const heavyEmailsData = await getGmailHeavyEmails(req.accessToken!);
    res.json(heavyEmailsData);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Error al obtener correos pesados de Gmail." });
  }
});

// Real Drive Old Stale Files
app.get("/api/drive/old-files", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const oldFilesData = await getDriveOldFiles(req.accessToken!);
    res.json(oldFilesData);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Error al obtener archivos de Google Drive." });
  }
});

// Real Photos Usage
app.get("/api/photos/storage-usage", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const photosData = await getPhotosStorageUsage(req.accessToken!);
    res.json(photosData);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Error al obtener datos de Google Photos." });
  }
});

/* ==========================================
   3. AI SERVICES (GEMINI 2.0 FLASH + FREEMIUM LIMITS)
   ========================================== */

// Storage Diagnostic Vector Analysis (Mock or Real inputs)
app.post("/api/storage/analyze", (req, res) => {
  try {
    const {
      total_gb = 15.0,
      used_gb = 14.8,
      heavy_emails = 45,
      duplicate_photos = 1200,
      old_drive_files = 34,
    } = req.body || {};

    const usedPercentage = Math.round((used_gb / total_gb) * 100);
    const freeGb = Math.max(0, Number((total_gb - used_gb).toFixed(2)));

    const heavyEmailsGb = Number((heavy_emails * 0.055).toFixed(2));
    const duplicatePhotosGb = Number((duplicate_photos * 0.0035).toFixed(2));
    const oldDriveFilesGb = Number((old_drive_files * 0.12).toFixed(2));
    const trashCacheGb = Number((used_gb * 0.08).toFixed(2));

    const totalPotentialFreedGb = Number(
      (heavyEmailsGb + duplicatePhotosGb + oldDriveFilesGb + trashCacheGb).toFixed(2)
    );

    const projectedUsedGbAfterCleanup = Math.max(
      0,
      Number((used_gb - totalPotentialFreedGb).toFixed(2))
    );
    const projectedPercentage = Math.round(
      (projectedUsedGbAfterCleanup / total_gb) * 100
    );

    let status: "CRITICAL" | "WARNING" | "HEALTHY" = "HEALTHY";
    if (usedPercentage >= 90) status = "CRITICAL";
    else if (usedPercentage >= 75) status = "WARNING";

    const recommendations = [];
    if (heavy_emails > 0) {
      recommendations.push({
        id: "rec_heavy_emails",
        title: `Liberar Correos Pesados en Gmail`,
        description: `Tienes ${heavy_emails} correos con adjuntos > 10MB. Borrarlos o archivarlos liberaría ~${heavyEmailsGb} GB.`,
        category: "GMAIL",
        gbSavings: heavyEmailsGb,
        count: heavy_emails,
        searchQuery: "has:attachment larger:10M",
        riskLevel: "LOW",
        actionableType: "EMAILS",
      });
    }

    if (duplicate_photos > 0) {
      recommendations.push({
        id: "rec_duplicate_photos",
        title: `Eliminar Fotos Duplicadas y Borrosas`,
        description: `Se detectaron ${duplicate_photos} fotos duplicadas en Google Photos. Conservar solo la mejor toma liberará ~${duplicatePhotosGb} GB.`,
        category: "PHOTOS",
        gbSavings: duplicatePhotosGb,
        count: duplicate_photos,
        searchQuery: "category:duplicates quality:blurry",
        riskLevel: "VERY_LOW",
        actionableType: "PHOTOS",
      });
    }

    if (old_drive_files > 0) {
      recommendations.push({
        id: "rec_old_drive_files",
        title: `Archivar Documentos Obsoletos`,
        description: `Hay ${old_drive_files} archivos en Google Drive sin modificar en más de 2 años. Liberará ~${oldDriveFilesGb} GB.`,
        category: "DRIVE",
        gbSavings: oldDriveFilesGb,
        count: old_drive_files,
        searchQuery: "modified:<2024-01-01 size:>10M",
        riskLevel: "MEDIUM",
        actionableType: "DRIVE_FILES",
      });
    }

    if (trashCacheGb > 0.2) {
      recommendations.push({
        id: "rec_trash_cache",
        title: `Vaciar Papelera y Basura Acumulada`,
        description: `Se detectaron ~${trashCacheGb} GB en papelera acumulada y archivos temporales en cola de purga.`,
        category: "SYSTEM",
        gbSavings: trashCacheGb,
        count: 1,
        searchQuery: "is:trashed",
        riskLevel: "VERY_LOW",
        actionableType: "TRASH",
      });
    }

    const annualSavingsUsd = usedPercentage >= 90 ? 23.88 : usedPercentage >= 75 ? 19.99 : 0;

    res.json({
      summary: {
        totalGb: total_gb,
        usedGb: used_gb,
        freeGb,
        usedPercentage,
        status,
        totalPotentialFreedGb,
        projectedUsedGbAfterCleanup,
        projectedPercentage,
        annualSavingsUsd,
      },
      vectors: {
        heavyEmailsGb,
        duplicatePhotosGb,
        oldDriveFilesGb,
        trashCacheGb,
      },
      recommendations,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Error en cálculo de diagnóstico" });
  }
});

// Gemini AI Advisor Report (Gemini 2.0 Flash + Plan Limits)
app.post(
  "/api/ai/advisor",
  requireAuth,
  checkPlanLimits("REPORT"),
  async (req: AuthenticatedRequest, res) => {
    try {
      const ai = getGenAI();
      if (!ai) {
        return res.status(530).json({
          error: "Gemini API Key no está configurada.",
        });
      }

      const { metrics, customFocus } = req.body || {};
      const metricsInfo = metrics
        ? `Estado real de almacenamiento: Total=${metrics.totalGb}GB, Usado=${metrics.usedGb}GB (${metrics.usedPercentage}% saturación).
           Correos pesados=${metrics.heavyEmailsCount || 0}, Fotos duplicadas=${metrics.duplicatePhotosCount || 0}, Archivos obsoletos Drive=${metrics.oldDriveFilesCount || 0}.`
        : "Saturación estándar de almacenamiento en la nube de Google.";

      const prompt = `
Eres el motor de diagnóstico avanzado de "CloudOptimizer AI" (Gemini 2.0 Flash).
Analiza el estado de almacenamiento real del usuario:
${metricsInfo}
Enfoque de análisis: ${customFocus || "Plan de purga preventiva de emergencia y filtros de búsqueda."}

Proporciona un reporte en español en formato JSON estructurado con estas claves exactas:
1. "executiveSummary": Resumen ejecutivo conciso de 2-3 oraciones explicando la causa de la saturación.
2. "primaryVector": El principal responsable de consumo (ej. "Correos pesados con adjuntos en Gmail" o "Fotos duplicadas en alta resolución").
3. "actionPlan": Array de 3-4 pasos tácticos, cada uno con:
   - "step": Número (1, 2, 3...)
   - "title": Título claro
   - "category": "GMAIL" | "PHOTOS" | "DRIVE" | "SYSTEM"
   - "estimatedReleaseGb": texto ej. "2.5 GB"
   - "searchFilter": Operador de búsqueda exacto de Google (ej. "has:attachment larger:10M")
   - "safetyAdvice": Nota de seguridad para evitar borrar datos importantes.
4. "proactivePrevention": 2 reglas de prevención continua para evitar saturación futura.

Devuelve ESTRICTAMENTE JSON.
`;

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const rawText = response.text || "{}";
      const parsedData = JSON.parse(rawText);
      res.json({ result: parsedData });
    } catch (err: any) {
      console.error("Gemini Advisor error:", err);
      res.status(500).json({ error: err.message || "Fallo al generar reporte IA" });
    }
  }
);

// Gemini Chat Endpoint (Gemini 2.0 Flash + Plan Limits)
app.post(
  "/api/ai/chat",
  requireAuth,
  checkPlanLimits("CHAT"),
  async (req: AuthenticatedRequest, res) => {
    try {
      const ai = getGenAI();
      if (!ai) {
        return res.status(503).json({
          error: "La API Key de Gemini no está configurada.",
        });
      }

      const { messages, storageState } = req.body || {};
      const contextText = storageState
        ? `Contexto de Almacenamiento del Usuario: ${storageState.usedGb} GB / ${storageState.totalGb} GB (${storageState.usedPercentage}% ocupado). Correos pesados: ${storageState.heavyEmailsCount}, Fotos duplicadas: ${storageState.duplicatePhotosCount}, Archivos obsoletos: ${storageState.oldDriveFilesCount}.`
        : "";

      const userPrompt = messages?.[messages.length - 1]?.content || "¿Cómo puedo liberar espacio rápidamente?";

      const chatPrompt = `
Instrucción de Sistema: Eres el asistente inteligente de CloudOptimizer AI. Responde siempre en español. Ofrece recomendaciones prácticas, concisas y filtros de búsqueda precisos de Google Drive/Gmail/Photos (ej: "larger:10M", "category:promotions older_than:1y").

${contextText}

Consulta del Usuario: ${userPrompt}
`;

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: chatPrompt,
      });

      res.json({ reply: response.text || "Estoy aquí para ayudarte a optimizar tu almacenamiento en la nube." });
    } catch (err: any) {
      console.error("Gemini Chat error:", err);
      res.status(500).json({ error: err.message || "Error en el chat de IA" });
    }
  }
);

/* ==========================================
   4. STATIC PRIVACY POLICY ROUTE
   ========================================== */
app.get("/privacy", (_req, res) => {
  res.sendFile(path.join(process.cwd(), "public", "privacy.html"));
});

/* ==========================================
   5. VITE / STATIC SERVER
   ========================================== */
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CloudOptimizer AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
